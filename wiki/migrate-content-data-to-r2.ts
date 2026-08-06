/**
 * content_data(本文) -> content_data_url(R2のURL) 移行スクリプト。
 *
 * wiki/migration_content_data_to_r2.sql の STEP 1 を流したあとに実行する。
 * 本文をR2へ上げる作業はHTTPアップロードが要るのでSQLでは書けない。
 *
 *   pnpm tsx wiki/migrate-content-data-to-r2.ts            # 本番実行
 *   pnpm tsx wiki/migrate-content-data-to-r2.ts --dry-run  # 書き込まずに件数だけ見る
 *
 * 必要な環境変数:
 *   NEON_DATABASE_URL             既存のものと同じ
 *   CLOUDFLARE_URL                uploader-worker のURL
 *   CLOUDFLARE_CLIENT_ID          wrangler.toml の CLIENT_ID
 *   CLOUDFLARE_UPLOAD_SECRET_PEPPER  wrangler.toml の UPLOAD_SECRET_PEPPER
 *
 * 何度流しても安全。content_data_url が既に埋まっている行は飛ばす。
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import fs from "node:fs";

neonConfig.webSocketConstructor = ws;

if (fs.existsSync(".env")) {
	process.loadEnvFile(".env");
}

const DRY_RUN = process.argv.includes("--dry-run");

const NEON_DATABASE_URL = String(process.env.NEON_DATABASE_URL);
const CLOUDFLARE_URL = String(process.env.CLOUDFLARE_URL);
const CLIENT_ID = String(process.env.CLOUDFLARE_CLIENT_ID);
const UPLOAD_SECRET_PEPPER = String(
	process.env.CLOUDFLARE_UPLOAD_SECRET_PEPPER,
);

for (const [name, value] of Object.entries({
	NEON_DATABASE_URL,
	CLOUDFLARE_URL,
	CLIENT_ID,
	UPLOAD_SECRET_PEPPER,
})) {
	if (!value || value === "undefined") {
		throw new Error(`環境変数 ${name} が設定されていません`);
	}
}

const pool = new Pool({ connectionString: NEON_DATABASE_URL });

// content_type のビット。uploader の kind に対応する
const DTM = 2048;
const ENCRYPT = 4096;
const KIND_BY_CONTENT_TYPE = new Map<number, "mml" | "encrypt">([
	[DTM, "mml"],
	[ENCRYPT, "encrypt"],
]);

const sha256 = async (message: string): Promise<string> => {
	const bytes = new TextEncoder().encode(message);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
};

/** Worker のレート制限は10秒3回。余裕をみて4秒に1回まで落とす */
const RATE_LIMIT_INTERVAL_MS = 4000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const uploadText = async (
	kind: "mml" | "encrypt",
	text: string,
): Promise<string> => {
	const nonce = crypto.randomUUID().replace(/-/g, "");
	const requestHash = await sha256(
		`${kind}\n${nonce}\n${text}` + UPLOAD_SECRET_PEPPER,
	);
	const params = new URLSearchParams({ kind, nonce });
	const res = await fetch(`${CLOUDFLARE_URL}/text?${params.toString()}`, {
		method: "POST",
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			Authorization: `Client-ID ${CLIENT_ID}`,
			"X-Request-Hash": requestHash,
		},
		body: text,
	});
	if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
	const json = (await res.json()) as { data: { link: string } };
	return json.data.link;
};

const migrateTable = async (table: "threads" | "res") => {
	const { rows } = await pool.query(
		`SELECT id, content_type, content_data
		   FROM ${table}
		  WHERE content_data <> '' AND content_data_url = ''
		  ORDER BY id`,
	);
	console.log(`[${table}] 対象 ${rows.length} 件`);

	let migrated = 0;
	let skipped = 0;
	const failed: number[] = [];

	for (const row of rows) {
		const kind = KIND_BY_CONTENT_TYPE.get(Number(row.content_type));
		if (!kind) {
			// DTM/暗号レス以外に content_data が入っている行は想定外。触らずに残す
			console.warn(
				`[${table}] id=${row.id} content_type=${row.content_type} は移行対象外。スキップ`,
			);
			skipped++;
			continue;
		}
		if (DRY_RUN) {
			migrated++;
			continue;
		}
		try {
			const link = await uploadText(kind, row.content_data);
			await pool.query(
				`UPDATE ${table} SET content_data_url = $1 WHERE id = $2`,
				[link, row.id],
			);
			migrated++;
			if (migrated % 50 === 0) {
				console.log(`[${table}] ${migrated}/${rows.length} 完了`);
			}
		} catch (e) {
			console.error(`[${table}] id=${row.id} 失敗:`, e);
			failed.push(row.id);
		}
		await sleep(RATE_LIMIT_INTERVAL_MS);
	}

	console.log(
		`[${table}] 移行 ${migrated} / スキップ ${skipped} / 失敗 ${failed.length}`,
	);
	if (failed.length) console.error(`[${table}] 失敗したid:`, failed);
	return failed.length;
};

const main = async () => {
	if (DRY_RUN) console.log("--dry-run: 書き込みは行いません");
	let failures = 0;
	failures += await migrateTable("threads");
	failures += await migrateTable("res");
	await pool.end();

	if (failures) {
		console.error(
			`\n${failures} 件失敗。もう一度流せば失敗分だけ再試行される。` +
				"\n全件成功するまで STEP 3 のSQLを流さないこと。",
		);
		process.exit(1);
	}
	console.log("\n全件完了。STEP 3 のSQLを流してよい。");
};

main();

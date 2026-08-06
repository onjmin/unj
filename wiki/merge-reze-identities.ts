/**
 * unj / unj-reze DB統合 STEP 2: identity の移送。
 *
 *   1. reze の anonymous_users を unj の users へ写す（採番は users.id SERIAL）
 *   2. reze の session_id を unj の auth_tokens へ入れる（＝ログイン維持の本体）
 *   3. 「reze 側のあらゆる識別子 → users.id」の写像を reze のDBへ書き戻す
 *
 * 2つのDBを跨ぐのでSQLでは書けない。
 *
 *   pnpm tsx wiki/merge-reze-identities.ts            # 本番実行
 *   pnpm tsx wiki/merge-reze-identities.ts --dry-run  # 件数だけ見る
 *
 * 必要な環境変数:
 *   NEON_DATABASE_URL   統合先（unj）
 *   REZE_DATABASE_URL   移行元（unj-reze の DATABASE_URL）
 *
 * 何度流しても安全。users.reze_origin_id で既存行に解決する。
 *
 * 【前提】wiki/merge_reze_01_unj_schema.sql を先に流しておくこと。
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const DRY_RUN = process.argv.includes("--dry-run");

const NEON_DATABASE_URL = String(process.env.NEON_DATABASE_URL);
const REZE_DATABASE_URL = String(process.env.REZE_DATABASE_URL);

for (const [name, value] of Object.entries({
	NEON_DATABASE_URL,
	REZE_DATABASE_URL,
})) {
	if (!value || value === "undefined") {
		throw new Error(`環境変数 ${name} が設定されていません`);
	}
}

const unj = new Pool({ connectionString: NEON_DATABASE_URL });
const reze = new Pool({ connectionString: REZE_DATABASE_URL });

interface RezeUser {
	id: string;
	slug: string | null;
	display_name: string;
	avatar_color: string | null;
	avatar_url: string | null;
	bio: string | null;
	is_private: boolean;
	hide_from_search: boolean;
	hide_reactions: boolean;
	session_id: string;
	ip_address: string | null;
	created_at: Date | string;
	last_seen_at: Date | string;
}

/**
 * reze 側の識別子は歴史的に3種類が混在している。
 *
 * migration 15 が全部 anonymous_users.id へ寄せ、17 が slug へ差し戻し、
 * 18 が日本語シードidを 'usr_' + slug へ補正している。さらに 15 が張った
 * `REFERENCES anonymous_users(id)` の FK は 17 で落とされていない。
 * つまり本番の実状態は実際に見るまで確定できない。
 *
 * そこで「どの形が入っていても引ける」写像を作る。1ユーザーにつき
 * slug / id / display_name の3キーを登録し、張り替え側は列の中身が
 * どれであっても JOIN 一発で数値IDに解決できるようにする。
 */
const keysOf = (u: RezeUser): string[] => {
	const keys = new Set<string>();
	if (u.slug) keys.add(u.slug);
	keys.add(u.id);
	// display_name は衝突しうる（改名で同名になる）。衝突したものは写像から外す。
	if (u.display_name) keys.add(u.display_name);
	return [...keys];
};

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

const main = async () => {
	if (DRY_RUN) console.log("--dry-run: 書き込みは行いません\n");

	const { rows } = await reze.query<RezeUser>(
		`SELECT id, slug, display_name, avatar_color, avatar_url, bio,
		        is_private, hide_from_search, hide_reactions,
		        session_id, ip_address, created_at, last_seen_at
		   FROM anonymous_users
		  ORDER BY created_at`,
	);
	console.log(`reze のユーザー: ${rows.length} 件`);

	// display_name の衝突検出。衝突したものは写像キーから外す（誤解決を防ぐ）
	const nameCount = new Map<string, number>();
	for (const u of rows) {
		if (u.display_name) {
			nameCount.set(u.display_name, (nameCount.get(u.display_name) ?? 0) + 1);
		}
	}
	const ambiguousNames = new Set(
		[...nameCount.entries()].filter(([, n]) => n > 1).map(([name]) => name),
	);
	if (ambiguousNames.size) {
		console.warn(
			`display_name が重複しているユーザーが ${ambiguousNames.size} 名分います。` +
				"このキーは写像から外します（誤って別人に紐づくため）",
		);
	}

	const mapping: { key: string; userId: number }[] = [];
	let created = 0;
	let reused = 0;
	let sessions = 0;

	for (const u of rows) {
		if (DRY_RUN) {
			created++;
			mapping.push(...keysOf(u).map((key) => ({ key, userId: 0 })));
			continue;
		}

		// reze_origin_id で冪等に。二度流しても同じ users 行へ解決する
		const upsert = await unj.query<{ id: number; existed: boolean }>(
			`INSERT INTO users (
			     created_at, updated_at, last_seen_at, ip,
			     display_name, reze_slug, reze_origin_id,
			     avatar_color, avatar_url, bio,
			     is_private, hide_from_search, hide_reactions
			 ) VALUES ($1, $2, $3, COALESCE($4::inet, '0.0.0.0'::inet),
			           $5, $6, $7, COALESCE($8, 'from-blue-500 to-indigo-600'), $9, $10,
			           $11, $12, $13)
			 ON CONFLICT (reze_origin_id) WHERE reze_origin_id IS NOT NULL
			 DO UPDATE SET
			     display_name = EXCLUDED.display_name,
			     reze_slug = EXCLUDED.reze_slug,
			     avatar_url = EXCLUDED.avatar_url,
			     bio = EXCLUDED.bio,
			     is_private = EXCLUDED.is_private,
			     hide_from_search = EXCLUDED.hide_from_search,
			     hide_reactions = EXCLUDED.hide_reactions
			 RETURNING id, (xmax <> 0) AS existed`,
			[
				toDate(u.created_at),
				toDate(u.last_seen_at),
				toDate(u.last_seen_at),
				// reze の ip_address はロードバランサーのアドレスで本人確認には使えない
				// （lib/session.ts のコメント参照）。INET に入らない値は捨てる。
				/^\d{1,3}(\.\d{1,3}){3}$/.test(u.ip_address ?? "") ? u.ip_address : null,
				u.display_name,
				u.slug,
				u.id,
				u.avatar_color,
				u.avatar_url,
				u.bio,
				u.is_private,
				u.hide_from_search,
				u.hide_reactions,
			],
		);
		const userId = upsert.rows[0].id;
		if (upsert.rows[0].existed) reused++;
		else created++;

		// --- ログイン維持の本体 ---
		// reze のブラウザが持っている秘密は session_id だけ。これを auth_tokens に
		// 入れておけば、ユーザーの操作ゼロでログインが継続する。
		if (u.session_id) {
			const res = await unj.query(
				`INSERT INTO auth_tokens (user_id, token, ip, kind)
				 VALUES ($1, $2, '0.0.0.0'::inet, 'reze')
				 ON CONFLICT (token) DO NOTHING`,
				[userId, u.session_id],
			);
			sessions += res.rowCount ?? 0;
		}

		for (const key of keysOf(u)) {
			if (ambiguousNames.has(key) && key === u.display_name) continue;
			mapping.push({ key, userId });
		}
	}

	console.log(
		`users: 新規 ${created} / 既存に解決 ${reused}\n` +
			`auth_tokens: セッション ${sessions} 件を投入`,
	);

	if (DRY_RUN) {
		console.log(`写像キー: ${mapping.length} 件（書き込みなし）`);
		await Promise.all([unj.end(), reze.end()]);
		return;
	}

	// --- 写像を reze 側へ書き戻す ---
	// これがあると、reze 側の張り替えは純粋なSQLでできる（DBを跨がない）。
	await reze.query(`
		CREATE TABLE IF NOT EXISTS user_id_map (
			reze_key TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL
		)`);
	await reze.query("TRUNCATE user_id_map");

	// 1件ずつ投げると件数分の往復になるので、多値INSERTでまとめる
	const CHUNK = 500;
	for (let i = 0; i < mapping.length; i += CHUNK) {
		const chunk = mapping.slice(i, i + CHUNK);
		const values = chunk
			.map((_, j) => `($${j * 2 + 1}, $${j * 2 + 2})`)
			.join(", ");
		await reze.query(
			`INSERT INTO user_id_map (reze_key, user_id) VALUES ${values}
			 ON CONFLICT (reze_key) DO NOTHING`,
			chunk.flatMap((m) => [m.key, m.userId]),
		);
	}
	console.log(`user_id_map: ${mapping.length} キーを書き込み`);

	await Promise.all([unj.end(), reze.end()]);
	console.log(
		"\n完了。次は unj-reze 側で data/migrations/merge_02_numeric_user_ids.sql を流す。",
	);
};

main().catch((e) => {
	console.error("移送に失敗:", e);
	process.exit(1);
});

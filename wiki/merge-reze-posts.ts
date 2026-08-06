/**
 * unj / unj-reze DB統合 STEP 5: posts と周辺テーブルの移送。
 *
 *   reze posts (id = thread_id) → unj threads（>>1）
 *   reze posts (id <> thread_id) → unj res（num は created_at 順、2始まり）
 *   games / mvs / follows / blocks / mutes / notifications / messages / oshi_items → unj
 *
 * 2つのDBを跨ぐのでSQLでは書けない。
 *
 *   pnpm tsx wiki/merge-reze-posts.ts            # 本番実行
 *   pnpm tsx wiki/merge-reze-posts.ts --dry-run  # 件数だけ見る
 *
 * 必要な環境変数: NEON_DATABASE_URL（統合先） / REZE_DATABASE_URL（移行元）
 *
 * 【前提】
 *   - merge_reze_01_unj_schema.sql        （STEP 1）
 *   - reze 側 merge_02_numeric_user_ids.sql（STEP 3）
 *   - merge_reze_02_threads_res.sql       （STEP 4）
 *   がいずれも適用済みであること。
 *
 * 何度流しても安全。reze_origin_post_id で既存行に解決する。
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

/** 移送先の板。うんでも実況J（common/request/board.ts の id: 1） */
const BOARD_ID = 1;

/** content_type のビット（common/request/content-schema.ts の Enum と対応） */
const TYPE_TEXT = 1;
const TYPE_IMAGE = 4;
const TYPE_DTM = 2048;

/**
 * 退会済みユーザーの受け皿。
 *
 * 解決できなかった投稿者（元データの孤児参照）はここへ寄せる。
 * unj の user_id は NOT NULL なので NULL のままでは INSERT できないが、
 * cc_user_name を空にするので画面上は通常の「名無し」として出る。
 * 投稿本文は失わない。
 */
let deletedUserId = 0;

const firstLine = (content: string, max = 64) => {
	const line = (content ?? "").split("\n").find((l) => l.trim()) ?? "";
	const trimmed = line.trim();
	return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
};

/**
 * reze の投稿から unj の content_type / content_url / content_data_url を決める。
 * unj の content_type は単一値なので、複数の添付があるときは優先順で1つに寄せる。
 * 画像とMMLが両方付いた投稿では画像が content_url に残らないため、
 * 本文末尾にURLを足して失わないようにする。
 */
const deriveContent = (p: PostRow) => {
	if (p.has_mml && p.mml_url) {
		const text =
			p.has_image && p.image_src
				? `${p.content ?? ""}\n${p.image_src}`.trim()
				: (p.content ?? "");
		return {
			contentType: TYPE_DTM,
			contentText: text,
			contentUrl: "",
			contentDataUrl: p.mml_url,
		};
	}
	if (p.has_image && p.image_src) {
		return {
			contentType: TYPE_IMAGE,
			contentText: p.content ?? "",
			contentUrl: p.image_src,
			contentDataUrl: "",
		};
	}
	return {
		contentType: TYPE_TEXT,
		contentText: p.content ?? "",
		contentUrl: "",
		contentDataUrl: "",
	};
};

interface PostRow {
	id: number;
	thread_id: number;
	parent_post_id: number | null;
	author_user_id: number | null;
	display_name: string | null;
	avatar_color: string | null;
	created_at: Date | string;
	content: string | null;
	likes: number;
	dislikes: number;
	hearts_total: number;
	reposts: number;
	has_image: boolean;
	image_src: string | null;
	has_mml: boolean;
	mml_url: string | null;
	has_collab_button: boolean;
	game_id: string | null;
	mv_id: string | null;
	origin_type: string | null;
	is_false_declaration: boolean;
	is_edited: boolean;
}

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

/** reze posts.id → unj の (thread_id, num) */
const postMap = new Map<number, { threadId: number; num: number }>();

const migrateGamesAndMvs = async () => {
	for (const table of ["games", "mvs"] as const) {
		const bgCol = table === "games" ? "bg_ref" : "bg_url";
		const extra =
			table === "games"
				? ", plays, clears, best_score, best_score_by"
				: ", plays";
		const { rows } = await reze.query(
			`SELECT id, preset, title, manifest_url, manifest_delete_id,
			        manifest_delete_hash, ${bgCol}, created_at, creator_user_id${extra}
			   FROM ${table} ORDER BY id`,
		);
		console.log(`[${table}] ${rows.length} 件`);
		if (DRY_RUN) continue;

		for (const r of rows) {
			const cols =
				table === "games"
					? `(id, preset, title, manifest_url, manifest_delete_id, manifest_delete_hash,
					    bg_ref, created_at, creator_user_id, plays, clears, best_score, best_score_by)
					   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`
					: `(id, preset, title, manifest_url, manifest_delete_id, manifest_delete_hash,
					    bg_url, created_at, creator_user_id, plays)
					   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
			const base = [
				r.id,
				r.preset,
				r.title,
				r.manifest_url,
				r.manifest_delete_id,
				r.manifest_delete_hash,
				r[bgCol],
				toDate(r.created_at),
				r.creator_user_id,
			];
			const values =
				table === "games"
					? [
							...base,
							r.plays ?? 0,
							r.clears ?? 0,
							r.best_score ?? 0,
							r.best_score_by,
						]
					: [...base, r.plays ?? 0];
			await unj.query(
				`INSERT INTO ${table} ${cols} ON CONFLICT (id) DO NOTHING`,
				values,
			);
		}
	}
};

const migratePosts = async () => {
	const { rows: threads } = await reze.query<PostRow>(
		`SELECT * FROM posts WHERE id = thread_id ORDER BY created_at, id`,
	);
	console.log(`[posts] スレッド ${threads.length} 件`);

	for (const t of threads) {
		const c = deriveContent(t);
		const authorId = t.author_user_id ?? deletedUserId;
		// 投稿者が解決できなかった場合は名前も空にする（＝名無し表示）
		const name = t.author_user_id ? (t.display_name ?? "") : "";

		const { rows: replies } = await reze.query<PostRow>(
			`SELECT * FROM posts WHERE thread_id = $1 AND id <> thread_id
			  ORDER BY created_at, id`,
			[t.id],
		);

		if (DRY_RUN) {
			console.log(`  thread ${t.id}: ${replies.length} 返信`);
			continue;
		}

		const ins = await unj.query<{ id: number }>(
			`INSERT INTO threads (
			     created_at, ip, res_count, latest_res, latest_res_at,
			     title, board_id, res_limit,
			     user_id, cc_user_name, cc_user_avatar, avatar_color,
			     content_text, content_url, content_type, content_data_url,
			     good_count, bad_count, hearts_total, reposts,
			     origin_type, is_false_declaration, has_collab_button, is_edited,
			     game_id, mv_id, reze_origin_post_id
			 ) VALUES ($1,'0.0.0.0'::inet,$2,$3,$4,$5,$6,1000,$7,$8,0,$9,
			           $10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
			 ON CONFLICT (reze_origin_post_id) WHERE reze_origin_post_id IS NOT NULL
			 DO UPDATE SET title = EXCLUDED.title
			 RETURNING id`,
			[
				toDate(t.created_at),
				replies.length + 1,
				firstLine(replies.at(-1)?.content ?? t.content ?? ""),
				toDate(replies.at(-1)?.created_at ?? t.created_at),
				firstLine(t.content ?? "") || "無題",
				BOARD_ID,
				authorId,
				name,
				t.avatar_color,
				c.contentText,
				c.contentUrl,
				c.contentType,
				c.contentDataUrl,
				t.likes ?? 0,
				t.dislikes ?? 0,
				t.hearts_total ?? 0,
				t.reposts ?? 0,
				t.origin_type,
				t.is_false_declaration ?? false,
				t.has_collab_button ?? false,
				t.is_edited ?? false,
				t.game_id,
				t.mv_id,
				t.id,
			],
		);
		const threadId = ins.rows[0].id;
		postMap.set(t.id, { threadId, num: 1 });

		// 返信は created_at 順に num = 2.. を振る。
		// unj の res.num は SMALLINT / UNIQUE(thread_id, num) なので、
		// reze 側で1000レス上限（lib/thread-limits.ts）を掛けてある前提。
		let num = 2;
		for (const r of replies) {
			const rc = deriveContent(r);
			const rAuthor = r.author_user_id ?? deletedUserId;
			const rName = r.author_user_id ? (r.display_name ?? "") : "";
			const parent =
				r.parent_post_id && r.parent_post_id !== t.id
					? (postMap.get(r.parent_post_id)?.num ?? null)
					: 1;

			await unj.query(
				`INSERT INTO res (
				     thread_id, num, created_at, ip, is_owner, sage,
				     user_id, cc_user_name, cc_user_avatar, avatar_color,
				     content_text, content_url, content_type, content_data_url,
				     good_count, bad_count, hearts_total, reposts,
				     origin_type, is_false_declaration, has_collab_button, is_edited,
				     game_id, mv_id, parent_num, reze_origin_post_id
				 ) VALUES ($1,$2,$3,'0.0.0.0'::inet,$4,FALSE,$5,$6,0,$7,
				           $8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
				 ON CONFLICT (reze_origin_post_id) WHERE reze_origin_post_id IS NOT NULL
				 DO NOTHING`,
				[
					threadId,
					num,
					toDate(r.created_at),
					r.author_user_id != null && r.author_user_id === t.author_user_id,
					rAuthor,
					rName,
					r.avatar_color,
					rc.contentText,
					rc.contentUrl,
					rc.contentType,
					rc.contentDataUrl,
					r.likes ?? 0,
					r.dislikes ?? 0,
					r.hearts_total ?? 0,
					r.reposts ?? 0,
					r.origin_type,
					r.is_false_declaration ?? false,
					r.has_collab_button ?? false,
					r.is_edited ?? false,
					r.game_id,
					r.mv_id,
					parent,
					r.id,
				],
			);
			postMap.set(r.id, { threadId, num });
			num++;
		}
	}
	console.log(`[posts] 移送 ${postMap.size} 件`);
};

/** ユーザー間テーブル。両端が解決できない行は捨てる（関係が成立しないため） */
const migrateRelations = async () => {
	const jobs: {
		label: string;
		select: string;
		insert: string;
		map: (r: any) => unknown[] | null;
	}[] = [
		{
			label: "user_follows",
			select: `SELECT follower_user_id a, followed_user_id b, created_at
			           FROM user_follows WHERE follower_user_id IS NOT NULL AND followed_user_id IS NOT NULL`,
			insert: `INSERT INTO user_follows (follower_user_id, followed_user_id, created_at)
			         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
			map: (r) => [r.a, r.b, toDate(r.created_at)],
		},
		{
			label: "user_blocks",
			select: `SELECT blocker_user_id a, blocked_user_id b, created_at
			           FROM user_blocks WHERE blocker_user_id IS NOT NULL AND blocked_user_id IS NOT NULL`,
			insert: `INSERT INTO user_blocks (blocker_user_id, blocked_user_id, created_at)
			         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
			map: (r) => [r.a, r.b, toDate(r.created_at)],
		},
		{
			label: "user_mutes",
			select: `SELECT muter_user_id a, muted_user_id b, created_at
			           FROM user_mutes WHERE muter_user_id IS NOT NULL AND muted_user_id IS NOT NULL`,
			insert: `INSERT INTO user_mutes (muter_user_id, muted_user_id, created_at)
			         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
			map: (r) => [r.a, r.b, toDate(r.created_at)],
		},
		{
			label: "messages",
			// 送信者が解決できないDMは捨てる。誰からのDMか分からないものは残しても読めない
			select: `SELECT sender_user_id s, recipient_user_id r, text, created_at
			           FROM messages WHERE sender_user_id IS NOT NULL`,
			insert: `INSERT INTO messages (sender_user_id, recipient_user_id, text, created_at)
			         VALUES ($1,$2,$3,$4)`,
			map: (r) => [r.s, r.r, r.text, toDate(r.created_at)],
		},
		{
			label: "oshi_items",
			select: `SELECT owner_user_id o, kind, track_id, collection_id, artist_id,
			                title, subtitle, artwork_url, view_url, preview_url, created_at
			           FROM oshi_items WHERE owner_user_id IS NOT NULL`,
			insert: `INSERT INTO oshi_items (owner_user_id, kind, track_id, collection_id, artist_id,
			                                 title, subtitle, artwork_url, view_url, preview_url, created_at)
			         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
			map: (r) => [
				r.o,
				r.kind,
				r.track_id,
				r.collection_id,
				r.artist_id,
				r.title,
				r.subtitle,
				r.artwork_url,
				r.view_url,
				r.preview_url,
				toDate(r.created_at),
			],
		},
		{
			label: "reports",
			select: `SELECT reporter_user_id u, target_type, target_id, reason, created_at FROM reports`,
			insert: `INSERT INTO reports (reporter_user_id, target_type, target_id, reason, created_at)
			         VALUES ($1,$2,$3,$4,$5)`,
			map: (r) => [
				r.u,
				r.target_type,
				r.target_id,
				r.reason,
				toDate(r.created_at),
			],
		},
		{
			label: "notifications",
			// 宛先が解決できない通知は捨てる。誰にも見えないので残す意味がない
			select: `SELECT actor_user_id a, target_user_id t, type, post_id, read, created_at
			           FROM notifications WHERE target_user_id IS NOT NULL`,
			insert: `INSERT INTO notifications (actor_user_id, target_user_id, type, thread_id, res_num, read, created_at)
			         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			map: (r) => {
				// post_id は reze の採番。移送後の (thread_id, num) へ読み替える
				const ref =
					r.post_id != null ? postMap.get(Number(r.post_id)) : undefined;
				return [
					r.a,
					r.t,
					r.type,
					ref?.threadId ?? null,
					ref && ref.num > 1 ? ref.num : null,
					r.read ?? false,
					toDate(r.created_at),
				];
			},
		},
	];

	for (const job of jobs) {
		const { rows } = await reze.query(job.select);
		console.log(`[${job.label}] ${rows.length} 件`);
		if (DRY_RUN) continue;
		let done = 0;
		for (const r of rows) {
			const values = job.map(r);
			if (!values) continue;
			try {
				await unj.query(job.insert, values);
				done++;
			} catch (e) {
				console.error(`[${job.label}] 失敗:`, (e as Error).message);
			}
		}
		console.log(`[${job.label}] 移送 ${done} 件`);
	}
};

const main = async () => {
	if (DRY_RUN) console.log("--dry-run: 書き込みは行いません\n");

	const placeholder = await unj.query<{ id: number }>(
		"SELECT id FROM users WHERE reze_origin_id = '__reze_deleted__'",
	);
	if (!placeholder.rows.length) {
		throw new Error(
			"退会済みユーザーのプレースホルダがありません。" +
				"先に wiki/merge_reze_02_threads_res.sql を流してください",
		);
	}
	deletedUserId = placeholder.rows[0].id;
	console.log(`退会済みユーザーの受け皿: users.id = ${deletedUserId}\n`);

	await migrateGamesAndMvs();
	await migratePosts();
	await migrateRelations();

	await Promise.all([unj.end(), reze.end()]);
	console.log(
		"\n完了。STEP 6（reze アプリのコードを新スキーマへ切り替え）へ。",
	);
};

main().catch((e) => {
	console.error("移送に失敗:", e);
	process.exit(1);
});

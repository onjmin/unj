import type { PoolClient } from "@neondatabase/serverless";
import { addHours } from "date-fns";
import type { Request, Response, Router } from "express";
import type { Server } from "socket.io";
import * as v from "valibot";
import { boardIdMap, noharaBoard } from "../../../common/request/board.js";
import {
	contentSchemaMap,
	makeLatestResPreview,
} from "../../../common/request/content-schema.js";
import {
	myConfig,
	SMALLINT,
	SMALLSERIAL,
	THREAD_TITLE,
	USER_NAME,
} from "../../../common/request/schema.js";
import type { HeadlineThread } from "../../../common/response/schema.js";
import { encodeThreadId } from "../../mylib/anti-debug.js";
import {
	contentTypesBitmaskCache,
	deletedAtCache,
	ownerIdCache,
	resCountCache,
	resLimitCache,
} from "../../mylib/cache.js";
import { genTestIP } from "../../mylib/ip.js";
import { logger } from "../../mylib/log.js";
import { pool } from "../../mylib/pool.js";
import { broadcastLimit, getHeadlineRoom } from "../../mylib/socket.js";

const api = "/thread/make";
const userId = 1; // システムに使っていい実在のusers.id

const requestSchema = v.strictObject({
	boardId: SMALLSERIAL, // 0（未定義板）は弾く
	title: THREAD_TITLE,
	// 写しはサーバー側で作れない（socketが無い）ので呼び出し元から受け取る
	ccUserId: v.string(),
	ccUserName: USER_NAME,
	ccUserAvatar: SMALLINT,
	contentText: v.string(), // この段階では簡易的にしか見ない
	contentUrl: v.string(), // この段階では簡易的にしか見ない
	contentData: v.string(), // この段階では簡易的にしか見ない
	contentType: v.pipe(
		SMALLINT,
		v.check<number>((n) => (n & (n - 1)) === 0),
	),
	// 高度な設定（省略時はスレ立てページの初期値相当）
	varsan: v.optional(v.boolean(), false),
	sage: v.optional(v.boolean(), false),
	ccBitmask: v.optional(SMALLINT, 1),
	contentTypesBitmask: v.optional(SMALLSERIAL),
	max: v.optional(
		v.pipe(v.number(), v.integer(), v.minValue(10), v.maxValue(1000)),
		1000,
	),
	timer: v.optional(
		v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(8760)),
		0,
	),
});

export default (router: Router, io: Server) => {
	router.post(api, async (req: Request, res: Response) => {
		// スレ立てAPI用バリデーション
		const result = v.safeParse(requestSchema, req.body, myConfig);
		if (!result.success) {
			res.status(400).json({ error: v.flatten(result.issues) });
			return;
		}

		const board = boardIdMap.get(result.output.boardId);
		if (!board) {
			res.status(400).json({ error: "Invalid boardId" });
			return;
		}
		if (!board.avatarMap.has(result.output.ccUserAvatar)) {
			res.status(400).json({ error: "Invalid ccUserAvatar" });
			return;
		}

		// 省略時はテキストと>>1のコンテンツだけ投稿可能にする
		const contentTypesBitmask =
			result.output.contentTypesBitmask ?? 1 | result.output.contentType;
		if ((contentTypesBitmask & result.output.contentType) === 0) {
			res.status(400).json({ error: "Invalid contentType" });
			return;
		}
		const schema = contentSchemaMap.get(result.output.contentType);
		if (!schema) {
			res.status(400).json({ error: "Invalid contentType" });
			return;
		}
		const content = v.safeParse(schema, req.body, myConfig);
		if (!content.success) {
			res.status(400).json({ error: v.flatten(content.issues) });
			return;
		}

		let deletedAt: Date | null = null;
		if (result.output.timer) {
			deletedAt = addHours(new Date(), result.output.timer);
		}
		// 強制自動削除（板固有機能）
		if (board.id === noharaBoard.id) {
			deletedAt = addHours(new Date(), 3);
		}

		let poolClient: PoolClient | null = null;
		try {
			poolClient = await pool.connect();
			await poolClient.query("BEGIN");

			const latestRes = makeLatestResPreview(content.output);

			// スレッドの作成

			const { rows, rowCount } = await poolClient.query(
				[
					`INSERT INTO threads (${[
						// 書き込み内容
						"user_id",
						"cc_user_id",
						"cc_user_name",
						"cc_user_avatar",
						"content_text",
						"content_url",
						"content_type",
						"content_data_url",
						// 基本的な情報
						"title",
						"board_id",
						// 高度な設定
						"varsan",
						"sage",
						"cc_bitmask",
						"content_types_bitmask",
						"res_limit",
						"deleted_at",
						// メタ情報
						"latest_res",
						"ip",
						"origin_type",
					].join(",")})`,
					"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)",
					"RETURNING *",
				].join(" "),
				[
					// 書き込み内容
					userId,
					result.output.ccUserId,
					result.output.ccUserName,
					result.output.ccUserAvatar,
					content.output.contentText,
					content.output.contentUrl,
					content.output.contentType,
					content.output.contentData ?? "",
					// 基本的な情報
					result.output.title,
					board.id,
					// 高度な設定
					result.output.varsan,
					result.output.sage,
					result.output.ccBitmask,
					contentTypesBitmask,
					result.output.max,
					deletedAt,
					// メタ情報
					latestRes,
					genTestIP(),
					"fal_1_3",
				],
			);
			if (rowCount === 0) {
				// BEGIN後なので、開きっぱなしのままreleaseしないよう巻き戻してから返す
				// （レスポンスを返さずreturnするとリクエストがタイムアウトまでぶら下がる）
				await poolClient.query("ROLLBACK");
				res.status(500).json({ error: "Failed to create thread" });
				return;
			}
			const { id, created_at } = rows[0];

			await poolClient.query("COMMIT");

			// 立てた直後にレスAPI（/thread/res）へ繋げられるようキャッシュを温める
			// （readThreadを経由しないとキャッシュが空のままで書き込みが弾かれる）
			resCountCache.set(id, 1);
			resLimitCache.set(id, result.output.max);
			contentTypesBitmaskCache.set(id, contentTypesBitmask);
			deletedAtCache.set(id, deletedAt);
			ownerIdCache.set(id, userId);

			const newThread: HeadlineThread = {
				// 書き込み内容
				ccUserId: result.output.ccUserId,
				// メタ情報
				id: encodeThreadId(id) ?? "",
				latestRes,
				latestResAt: created_at,
				resCount: 1,
				// 基本的な情報
				title: result.output.title,
				// 一覧の見出しフォールバック用（HeadlineThread.contentText参照）
				contentText: content.output.contentText,
				boardId: board.id,
				// 動的なデータ
				online: 0,
				ikioi: 0,
				lolCount: 0,
				goodCount: 0,
				badCount: 0,
			};

			// Socket.IO通知（ヘッドラインの更新を全体通知）
			if (io.sockets.sockets.size >= broadcastLimit) {
				io.to(getHeadlineRoom(board.id)).emit("newHeadline", {
					ok: true,
					new: newThread,
					yours: false,
				});
			} else {
				io.emit("newHeadline", {
					ok: true,
					new: newThread,
					yours: false,
				});
			}

			res
				.status(200)
				.json({ message: "Thread created successfully", thread: newThread });
		} catch (e) {
			await poolClient?.query("ROLLBACK");
			logger.error(e);
			res.status(500).json({ error: "Failed to create thread" });
		} finally {
			poolClient?.release();
		}
	});
};

import type { PoolClient } from "@neondatabase/serverless";
import type { Request, Response, Router } from "express";
import type { Server } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../../common/request/content-schema.js";
import {
	SMALLINT,
	THREAD_ID,
	USER_NAME,
	myConfig,
} from "../../../common/request/schema.js";
import type { Res } from "../../../common/response/schema.js";
import { decodeThreadId } from "../../mylib/anti-debug.js";
import {
	balsResNumCache,
	contentTypesBitmaskCache,
	isDeleted,
	isMax,
	resCountCache,
} from "../../mylib/cache.js";
import { genTestIP } from "../../mylib/ip.js";
import { logger } from "../../mylib/log.js";
import { pool } from "../../mylib/pool.js";
import { exist, getThreadRoom } from "../../mylib/socket.js";

const api = "/thread/res";
const userId = 1; // システムに使っていい実在のusers.id

const requestSchema = v.strictObject({
	threadId: THREAD_ID,
	ccUserId: v.string(),
	ccUserName: USER_NAME,
	ccUserAvatar: SMALLINT,
	contentText: v.string(), // この段階では簡易的にしか見ない
	contentUrl: v.string(), // この段階では簡易的にしか見ない
	contentType: v.pipe(
		SMALLINT,
		v.check<number>((n) => (n & (n - 1)) === 0),
	),
});

export default (router: Router, io: Server) => {
	router.post(api, async (req: Request, res: Response) => {
		// レスAPI用バリデーション
		const result = v.safeParse(requestSchema, req.body, myConfig);
		if (!result.success) {
			res.status(400).json({ error: "Invalid threadId" });
			return;
		}

		const threadId = decodeThreadId(result.output.threadId);
		if (!threadId) {
			res.status(400).json({ error: "Invalid threadId" });
			return;
		}

		if (isDeleted(threadId)) return;
		if (balsResNumCache.get(threadId)) return;
		if (isMax(threadId, false)) return;

		const contentTypesBitmask = contentTypesBitmaskCache.get(threadId) ?? 0;
		if ((contentTypesBitmask & result.output.contentType) === 0) return;
		const schema = contentSchemaMap.get(result.output.contentType);
		if (!schema) return;
		const content = v.safeParse(schema, req.body, myConfig);
		if (!content.success) return;

		let poolClient: PoolClient | null = null;
		try {
			poolClient = await pool.connect();
			await poolClient.query("BEGIN");

			const nextResNum = (resCountCache.get(threadId) ?? 0) + 1;
			resCountCache.set(threadId, nextResNum);

			const sage = true;

			// レス

			const insertQuery = [
				`INSERT INTO res (${[
					"thread_id",
					"user_id",
					"cc_user_id",
					"cc_user_name",
					"cc_user_avatar",
					"content_text",
					"content_url",
					"content_type",
					"sage",
					"ip",
				].join(", ")})`,
				"VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,",
				"(SELECT COALESCE(MAX(num), 1) + 1 FROM res WHERE thread_id = $1)",
				")",
				"RETURNING *",
			].join(" ");

			const { rows, rowCount } = await poolClient.query(insertQuery, [
				threadId,
				userId,
				result.output.ccUserId,
				result.output.ccUserName,
				result.output.ccUserAvatar,
				content.output.contentText,
				content.output.contentUrl,
				content.output.contentType,
				sage,
				genTestIP(),
			]);
			if (rowCount === 0) return;
			const { created_at, num } = rows[0];

			// スレッドの更新

			const query = new Map();
			query.set("res_count", num);
			await poolClient.query(
				[
					`UPDATE threads SET ${sage ? "" : "latest_res_at = NOW(),"}`,
					[...query.keys()].map((v, i) => `${v}=$${i + 1}`).join(","),
					`WHERE id = $${query.size + 1}`,
				].join(" "),
				[...query.values(), threadId],
			);

			await poolClient.query("COMMIT");

			const newRes: Res = {
				yours: true,
				// 書き込み内容
				ccUserId: result.output.ccUserId,
				ccUserName: result.output.ccUserName,
				ccUserAvatar: result.output.ccUserAvatar,
				contentText: content.output.contentText,
				contentUrl: content.output.contentUrl,
				contentType: content.output.contentType,
				commandResult: "",
				// メタ情報
				num: nextResNum,
				createdAt: created_at,
				isOwner: false,
				sage: true,
			};

			// Socket.IO通知
			const threadRoom = getThreadRoom(threadId);
			if (exist(io, threadRoom)) {
				io.to(threadRoom).emit("res", {
					ok: true,
					new: newRes,
					yours: false,
				});
			}

			res
				.status(200)
				.json({ message: "Response created successfully", res: newRes });
		} catch (e) {
			await poolClient?.query("ROLLBACK");
			logger.error(e);
			res.status(500).json({ error: "Failed to create response" });
		} finally {
			poolClient?.release();
		}
	});
};

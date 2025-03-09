import { neon } from "@neondatabase/serverless";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import { MakeThreadSchema, ResSchema } from "../../common/request/schema.js";
import { NeverSchema } from "../../common/request/util.js";
import type { HeadlineThread } from "../../common/response/schema.js";
import { encodeThreadId, encodeUserId } from "../mylib/anti-debug.js";
import Auth from "../mylib/auth.js";
import { makeCcUserAvatar, makeCcUserId, makeCcUserName } from "../mylib/cc.js";
import { DEV_MODE, NEON_DATABASE_URL } from "../mylib/env.js";
import Nonce from "../mylib/nonce.js";
import { headlineRoom } from "../mylib/socket.js";

const api = "makeThread";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const res = v.safeParse(ResSchema, data);
		if (!res.success) {
			return;
		}

		// resとmakeThreadを共通化しているために必要な検証
		if (res.output.threadId !== null) {
			return;
		}

		// 本文のバリデーション
		const { contentType } = res.output;
		const content = v.safeParse(
			contentSchemaMap.get(contentType) ?? NeverSchema,
			data,
		);
		if (!content.success) {
			return;
		}

		const makeThread = v.safeParse(MakeThreadSchema, data);
		if (!makeThread.success) {
			return;
		}
		const { contentTypesBitmask } = makeThread.output;
		if (!(contentType & contentTypesBitmask)) {
			return;
		}

		// Nonce値の完全一致チェック
		if (!Nonce.isValid(socket, res.output.nonce)) {
			return;
		}
		Nonce.lock(socket);
		Nonce.update(socket);

		const userId = Auth.getUserId(socket);

		// 危険な処理
		const sql = neon(NEON_DATABASE_URL);
		try {
			await sql("BEGIN"); // トランザクション開始
			const result = await sql(
				[
					"INSERT INTO threads (user_id, title, res_limit, thread_type, varsan, sage, cc_bitmask, content_types_bitmask)",
					"VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
				].join(" "),
				[
					userId,
					makeThread.output.title,
					makeThread.output.max,
					0, // TODO
					makeThread.output.varsan,
					makeThread.output.sage,
					makeThread.output.ccBitmask,
					makeThread.output.contentTypesBitmask,
				],
			);
			if (!result.length) {
				return;
			}
			const threadId = result[0].id;
			const { ccBitmask } = makeThread.output;
			const result2 = await sql(
				[
					"INSERT INTO res (user_id, thread_id, num, is_owner, cc_user_id, cc_user_name, cc_user_avatar, content, content_url, content_type)",
					"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
				].join(" "),
				[
					userId,
					threadId,
					1,
					true,
					makeCcUserId(ccBitmask, userId),
					makeCcUserName(ccBitmask, res.output.userName),
					makeCcUserAvatar(ccBitmask, res.output.userAvatar),
					res.output.content,
					res.output.contentUrl,
					res.output.contentType,
				],
			);
			if (!result2.length) {
				return;
			}
			const newThread: HeadlineThread = {
				id: encodeThreadId(threadId) ?? "",
				latestResAt: new Date(),
				resCount: 1,
				title: makeThread.output.title,
				online: 1,
				ikioi: 0,
				lolCount: 0,
				goodCount: 0,
				badCount: 0,
			};
			socket.emit(api, { ok: true, new: newThread });
			socket.to(headlineRoom).emit(api, { ok: true, new: newThread });
			await sql("COMMIT"); // 問題なければコミット
		} catch (error) {
			await sql("ROLLBACK"); // エラーが発生した場合はロールバック
			if (DEV_MODE) {
				console.error(error);
			}
		} finally {
			Nonce.unlock(socket);
		}
	});
};

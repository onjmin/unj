import { neon } from "@neondatabase/serverless";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import { MakeThreadSchema, ResSchema } from "../../common/request/schema.js";
import { NeverSchema } from "../../common/request/util.js";
import type { HeadlineThread } from "../../common/response/schema.js";
import { encodeThreadId, encodeUserId } from "../mylib/anti-debug.js";
import { NEON_DATABASE_URL } from "../mylib/env.js";
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

		// 危険な処理
		try {
			const sql = neon(NEON_DATABASE_URL);
			const query = await sql("SELECT * FROM threads");
			const thread_id = Math.random().toString();
			const _mock = Object.assign(
				{ ...mock },
				{
					title: makeThread.output.title,
				},
			);
			socket.emit(api, { ok: true, new: _mock });
			socket.to(headlineRoom).emit(api, { ok: true, new: _mock });
		} catch (error) {
		} finally {
			Nonce.unlock(socket);
		}
	});

	const mock: HeadlineThread = {
		id: encodeThreadId(114514) ?? "",
		latestResAt: new Date(),
		resCount: 1,
		title: "【朗報】侍ジャパン、謎のホームランで勝利！",
		online: 1,
		ikioi: 0,
		lolCount: 0,
		goodCount: 0,
		badCount: 0,
	};
};

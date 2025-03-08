import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import { MakeThreadSchema, ResSchema } from "../../common/request/schema.js";
import { NeverSchema } from "../../common/request/util.js";
import Nonce from "../mylib/nonce.js";
import { headlineRoom } from "../mylib/socket.js";

const api = "makeThread";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const res = v.safeParse(ResSchema, data);
		if (!res.success) {
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
			// await insertPost(_.data);
			const thread_id = Math.random().toString();
			socket.emit(api, { ok: true, thread_id });
			io.to(headlineRoom).emit(api, { ok: true });
		} catch (error) {
		} finally {
			Nonce.unlock(socket);
		}
	});
};

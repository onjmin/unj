import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import { ResSchema, SERIAL } from "../../common/request/schema.js";
import { NeverSchema } from "../../common/request/util.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import Nonce from "../mylib/nonce.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";

const api = "res";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const res = v.safeParse(ResSchema, data);
		if (!res.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const serial = v.safeParse(SERIAL, decodeThreadId(res.output.threadId));
		if (!serial.success) {
			return;
		}
		const id = serial.output;

		// roomのチェック
		if (!exist(io, getThreadRoom(id)) || !joined(socket, getThreadRoom(id))) {
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

		// read thread
		// if (!(content_type & resultMakeThread.output.content_types_bitmask)) {
		// 	return;
		// }
		// const thread_id = ""; // threadから取得

		// Nonce値の完全一致チェック
		if (!Nonce.isValid(socket, res.output.nonce)) {
			return;
		}
		Nonce.lock(socket);
		Nonce.update(socket);

		// 危険な処理
		try {
			// await insertPost(result.data);
			io.to(getThreadRoom(id)).emit(api, { ok: true }); // TODO
		} catch (error) {
		} finally {
			Nonce.unlock(socket);
		}
	});
};

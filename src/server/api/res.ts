import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { getContentSchema } from "../../common/request/content-schema.js";
import { ResSchema, SMALLSERIAL } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import Nonce from "../mylib/nonce.js";
import { getThreadRoom } from "../mylib/socket.js";

const api = "res";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const res = v.safeParse(ResSchema, data);
		if (!res.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const smallserial = v.safeParse(
			SMALLSERIAL,
			decodeThreadId(res.output.threadId),
		);
		if (!smallserial.success) {
			return;
		}
		const id = smallserial.output;

		// 本文のバリデーション
		const { contentType } = res.output;
		const ContentSchema = getContentSchema(contentType);
		const content = v.safeParse(ContentSchema, data);
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

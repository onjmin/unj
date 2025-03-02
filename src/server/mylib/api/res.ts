import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { getContentSchema } from "../../../common/request/content-schema.js";
import { ResSchema } from "../../../common/request/schema.js";
import { getThreadRoom } from "../socket.js";
import Token from "../token.js";

const api = "res";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const res = v.safeParse(ResSchema, data);
		if (!res.success) {
			return;
		}
		const { token } = res.output;
		const { content_type } = res.output;
		const ContentSchema = getContentSchema(content_type);
		const content = v.safeParse(ContentSchema, data);
		if (!content.success) {
			return;
		}
		// read thread
		// if (!(content_type & resultMakeThread.output.content_types_bitmask)) {
		// 	return;
		// }
		const thread_id = ""; // threadから取得
		try {
			if (!Token.isValid(socket, token)) {
				return;
			}
			Token.lock(socket);
			Token.update(socket);
			// await insertPost(result.data);
			io.to(getThreadRoom(thread_id)).emit(api, { ok: true }); // TODO
		} catch (error) {
		} finally {
			Token.unlock(socket);
		}
	});
};

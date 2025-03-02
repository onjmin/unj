import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { getContentSchema } from "../../../common/request/content-schema.js";
import { MakeThreadSchema, ResSchema } from "../../../common/request/schema.js";
import { headlineRoom } from "../socket.js";
import Token from "../token.js";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on("makeThread", async (data) => {
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
		const makeThread = v.safeParse(MakeThreadSchema, data);
		if (!makeThread.success) {
			return;
		}
		const { content_types_bitmask } = makeThread.output;
		if (!(content_type & content_types_bitmask)) {
			return;
		}
		try {
			if (!Token.isValid(socket, token)) {
				return;
			}
			Token.lock(socket);
			Token.update(socket);
			// await insertPost(_.data);
			const thread_id = Math.random().toString();
			socket.emit("makeThread", { ok: true, thread_id });
			socket.to(headlineRoom).emit("makeThread", { ok: true });
		} catch (error) {
		} finally {
			Token.unlock(socket);
		}
	});
};

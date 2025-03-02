import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinHeadlineSchema } from "../../../common/request/schema.js";
import { headlineRoom, switchRoom } from "../socket.js";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on("joinHeadline", async (data) => {
		const joinHeadline = v.safeParse(joinHeadlineSchema, data);
		if (!joinHeadline.success) {
			return;
		}
		if (await switchRoom(socket, headlineRoom)) {
			socket.to(headlineRoom).emit("joinHeadline", { ok: true });
		}
	});
};

import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinHeadlineSchema } from "../../../common/request/schema.js";
import { headlineRoom, switchRoom } from "../socket.js";

const api = "joinHeadline";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const joinHeadline = v.safeParse(joinHeadlineSchema, data);
		if (!joinHeadline.success) {
			return;
		}
		const room = headlineRoom;
		const moved = await switchRoom(socket, room);
		const size = io.sockets.adapter.rooms.get(room)?.size ?? 0;
		if (moved) {
			io.to(room).emit(api, { ok: true, size });
		} else {
			socket.emit(api, { ok: true, size });
		}
	});
};

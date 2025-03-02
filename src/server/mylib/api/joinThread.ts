import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinThreadSchema } from "../../../common/request/schema.js";
import { getThreadRoom, switchRoom } from "../socket.js";

const api = "joinThread";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const joinThread = v.safeParse(joinThreadSchema, data);
		if (!joinThread.success) {
			return;
		}
		const { thread_id } = joinThread.output;
		const room = getThreadRoom(thread_id);
		const moved = await switchRoom(socket, room);
		const size = io.sockets.adapter.rooms.get(room)?.size ?? 0;
		if (moved) {
			io.to(room).emit(api, { ok: true, size });
		} else {
			socket.emit(api, { ok: true, size });
		}
	});
};

import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinThreadSchema } from "../../../common/request/schema.js";
import { count, getThreadRoom, headlineRoom, switchRoom } from "../socket.js";
import headline from "./headline.js";

const api = "joinThread";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.data.prevRoom = "";
	socket.on(api, async (data) => {
		const joinThread = v.safeParse(joinThreadSchema, data);
		if (!joinThread.success) {
			return;
		}
		const { thread_id } = joinThread.output;
		const room = getThreadRoom(thread_id);
		const moved = await switchRoom(socket, room);
		const size = count(io, room);
		if (moved) {
			io.to(room).emit(api, { ok: true, size });
			// 元いたスレに退室通知
			const { prevRoom } = socket.data;
			if (prevRoom !== "" && prevRoom !== headline) {
				const size = count(io, prevRoom);
				socket.to(prevRoom).emit(api, { ok: true, size });
			}
			socket.data.prevRoom = room;
		} else {
			socket.emit(api, { ok: true, size });
		}
	});
	socket.on("disconnect", () => {
		const { prevRoom } = socket.data;
		if (prevRoom !== "" && prevRoom !== headline) {
			const size = count(io, prevRoom);
			socket.to(prevRoom).emit(api, { ok: true, size });
		}
	});
};

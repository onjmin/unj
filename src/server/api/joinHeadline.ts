import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinHeadlineSchema } from "../../common/request/schema.js";
import { count, headlineRoom, switchRoom } from "../mylib/socket.js";

const api = "joinHeadline";

export default ({
	socket,
	io,
	online,
}: { socket: Socket; io: Server; online: Set<string> }) => {
	socket.data.prevRoom = "";
	socket.on(api, async (data) => {
		const joinHeadline = v.safeParse(joinHeadlineSchema, data);
		if (!joinHeadline.success) {
			return;
		}
		const room = headlineRoom;
		const moved = await switchRoom(socket, room);
		const { size } = online;
		if (moved) {
			io.to(room).emit(api, { ok: true, size });
			// 元いたスレに退室通知
			const { prevRoom } = socket.data;
			if (prevRoom !== "") {
				const size = count(io, prevRoom);
				socket.to(prevRoom).emit("joinThread", { ok: true, size });
			}
			socket.data.prevRoom = room;
		} else {
			socket.emit(api, { ok: true, size });
		}
	});
	socket.on("disconnect", () => {
		const room = headlineRoom;
		const { size } = online;
		socket.to(room).emit(api, { ok: true, size });
	});
};

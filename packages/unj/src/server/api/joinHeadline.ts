import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinHeadlineSchema } from "../../common/request/schema.js";
import {
	type Online,
	headlineRoom,
	sizeOf,
	switchTo,
} from "../mylib/socket.js";

const api = "joinHeadline";

export default ({
	socket,
	io,
	online,
	accessCounter,
}: {
	socket: Socket;
	io: Server;
	online: Online;
	accessCounter: () => number;
}) => {
	socket.data.prevRoom = "";
	socket.on(api, async (data) => {
		const joinHeadline = v.safeParse(joinHeadlineSchema, data);
		if (!joinHeadline.success) return;
		const room = headlineRoom;
		const moved = await switchTo(socket, room);
		const { size } = online;
		const accessCount = accessCounter();
		if (moved) {
			io.to(room).emit(api, { ok: true, size, accessCount });
			// 元いたスレに退室通知
			const { prevRoom } = socket.data;
			if (prevRoom !== "") {
				const size = sizeOf(io, prevRoom);
				socket.to(prevRoom).emit("joinThread", { ok: true, size, pv: null });
			}
			socket.data.prevRoom = room;
		} else {
			socket.emit(api, { ok: true, size, accessCount });
		}
	});
	socket.on("disconnect", () => {
		const room = headlineRoom;
		const { size } = online;
		const accessCount = accessCounter();
		socket.to(room).emit(api, { ok: true, size, accessCount });
	});
};

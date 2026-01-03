import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { boardIdMap } from "../../common/request/board.js";
import { joinHeadlineSchema } from "../../common/request/schema.js";
import {
	getAccessCount,
	getHeadlineRoom,
	online,
	sizeOf,
	switchTo,
} from "../mylib/socket.js";

const api = "joinHeadline";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.data.prevRoom = "";
	socket.on(api, async (data) => {
		const joinHeadline = v.safeParse(joinHeadlineSchema, data);
		if (!joinHeadline.success) return;

		const board = boardIdMap.get(joinHeadline.output.boardId);
		if (!board) return;

		const room = getHeadlineRoom(board.id);
		const moved = await switchTo(socket, room);
		const { size } = online;
		const accessCount = getAccessCount();
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
		const { prevRoom } = socket.data;
		const { size } = online;
		const accessCount = getAccessCount();
		if (prevRoom !== "") {
			socket.to(prevRoom).emit(api, { ok: true, size, accessCount });
		}
	});
};

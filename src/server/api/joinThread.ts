import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { SERIAL, joinThreadSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import { getThreadRoom, sizeOf, switchTo } from "../mylib/socket.js";
import headline from "./headline.js";

const api = "joinThread";
export const pvMap: Map<number, number> = new Map();

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.data.prevRoom = "";
	socket.on(api, async (data) => {
		const joinThread = v.safeParse(joinThreadSchema, data);
		if (!joinThread.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const serial = v.safeParse(
			SERIAL,
			decodeThreadId(joinThread.output.threadId),
		);
		if (!serial.success) {
			return;
		}
		const id = serial.output;

		const room = getThreadRoom(id);
		const moved = await switchTo(socket, room);
		const size = sizeOf(io, room);
		if (moved) {
			const pv = (pvMap.get(id) ?? 0) + 1;
			pvMap.set(id, pv);
			io.to(room).emit(api, { ok: true, size, pv });
			// 元いたスレに退室通知
			const { prevRoom } = socket.data;
			if (prevRoom !== "" && prevRoom !== headline) {
				const size = sizeOf(io, prevRoom);
				socket.to(prevRoom).emit(api, { ok: true, size, pv: null });
			}
			socket.data.prevRoom = room;
		} else {
			socket.emit(api, { ok: true, size, pv: null });
		}
	});
	socket.on("disconnect", () => {
		const { prevRoom } = socket.data;
		if (prevRoom !== "" && prevRoom !== headline) {
			const size = sizeOf(io, prevRoom);
			socket.to(prevRoom).emit(api, { ok: true, size, pv: null });
		}
	});
};

import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { SMALLSERIAL, joinThreadSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import { count, getThreadRoom, switchRoom } from "../mylib/socket.js";
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
		const smallserial = v.safeParse(
			SMALLSERIAL,
			decodeThreadId(joinThread.output.threadId),
		);
		if (!smallserial.success) {
			return;
		}
		const id = smallserial.output;

		const room = getThreadRoom(id);
		const moved = await switchRoom(socket, room);
		const size = count(io, room);
		if (moved) {
			const pv = (pvMap.get(id) ?? 0) + 1;
			pvMap.set(id, pv);
			io.to(room).emit(api, { ok: true, size, pv });
			// 元いたスレに退室通知
			const { prevRoom } = socket.data;
			if (prevRoom !== "" && prevRoom !== headline) {
				const size = count(io, prevRoom);
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
			const size = count(io, prevRoom);
			socket.to(prevRoom).emit(api, { ok: true, size, pv: null });
		}
	});
};

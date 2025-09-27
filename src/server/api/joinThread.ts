import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinThreadSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import { isDeleted } from "../mylib/cache.js";
import { getThreadRoom, sizeOf, switchTo } from "../mylib/socket.js";

const api = "joinThread";
export const pvCache: Map<number, number> = new Map();

/**
 * Nonce値の検証なしで叩けるため、脆弱にさせないためにpvCacheはDBに反映しない
 */
export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.data.prevRoom = "";
	socket.on(api, async (data) => {
		const joinThread = v.safeParse(joinThreadSchema, data);
		if (!joinThread.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(joinThread.output.threadId);
		if (threadId === null) return;

		// TODO: 未キャッシュ状態の削除済みスレに入れてしまう問題
		if (isDeleted(threadId)) return;

		const room = getThreadRoom(threadId);
		const moved = await switchTo(socket, room);
		const size = sizeOf(io, room);
		if (moved) {
			const pv = (pvCache.get(threadId) ?? 0) + 1;
			pvCache.set(threadId, pv);
			io.to(room).emit(api, { ok: true, size, pv });
			// 元いたスレに退室通知
			const { prevRoom } = socket.data;
			if (prevRoom !== "") {
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
		if (prevRoom !== "") {
			const size = sizeOf(io, prevRoom);
			socket.to(prevRoom).emit(api, { ok: true, size, pv: null });
		}
	});
};

import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { boardIdMap } from "../../common/request/board.js";
import { joinHeadlineSchema } from "../../common/request/schema.js";
import {
	getAccessCount,
	getHeadlineRoom,
	online,
	switchTo,
} from "../mylib/socket.js";
import { createThrottle } from "../mylib/ttl-throttle.js";
import { notifyThreadRoom } from "./joinThread.js";

const api = "joinHeadline";

// 入退室通知はroom単位で間引く（join往復による通知の増幅対策）
const throttle = createThrottle(2000);

/**
 * オンライン数とアクセス数を板のroom全体に通知する
 */
const notifyHeadlineRoom = (io: Server, room: string) => {
	throttle(room, () => {
		io.to(room).emit(api, {
			ok: true,
			size: online.size,
			accessCount: getAccessCount(),
		});
	});
};

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.data.prevRoom = "";
	socket.data.prevThreadId = 0; // 0はスレ以外（ヘッドラインなど）
	socket.on(api, async (data) => {
		const joinHeadline = v.safeParse(joinHeadlineSchema, data);
		if (!joinHeadline.success) return;

		const board = boardIdMap.get(joinHeadline.output.boardId);
		if (!board) return;

		const room = getHeadlineRoom(board.id);
		const moved = await switchTo(socket, room);
		if (moved) {
			notifyHeadlineRoom(io, room);
			// 元いたスレに退室通知
			const { prevThreadId } = socket.data;
			if (prevThreadId) notifyThreadRoom(io, prevThreadId);
			socket.data.prevRoom = room;
			socket.data.prevThreadId = 0;
		} else {
			socket.emit(api, {
				ok: true,
				size: online.size,
				accessCount: getAccessCount(),
			});
		}
	});
	socket.on("disconnect", () => {
		// スレにいた場合の退室通知はjoinThread側で送る
		const { prevRoom, prevThreadId } = socket.data;
		if (prevRoom !== "" && !prevThreadId) notifyHeadlineRoom(io, prevRoom);
	});
};

import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { joinThreadSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { isDeleted } from "../mylib/cache.js";
import { getThreadRoom, sizeOf, switchTo } from "../mylib/socket.js";
import { TtlMap } from "../mylib/ttl-map.js";
import { createThrottle } from "../mylib/ttl-throttle.js";

const api = "joinThread";
const delimiter = "###";
// threadId → PV（件数上限を超えたら古いスレの分から捨てる）
export const pvCache: TtlMap<number, number> = new TtlMap({
	max: 10000,
	ttl: Number.POSITIVE_INFINITY,
});
// userId###threadId（出入りの往復でPVを水増しさせない）
const pvCounted: TtlMap<string, true> = new TtlMap({
	max: 20000,
	ttl: 1000 * 60 * 30,
});

// 入退室通知はroom単位で間引く（join往復による通知の増幅対策）
const throttle = createThrottle(2000);

/**
 * スレの人数とPVをroom全体に通知する
 */
export const notifyThreadRoom = (io: Server, threadId: number) => {
	const room = getThreadRoom(threadId);
	throttle(room, () => {
		io.to(room).emit(api, {
			ok: true,
			size: sizeOf(io, room),
			pv: pvCache.get(threadId) ?? null,
		});
	});
};

/**
 * Nonce値の検証なしで叩けるため、脆弱にさせないためにpvCacheはDBに反映しない
 */
export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.data.prevRoom = "";
	socket.data.prevThreadId = 0; // 0はスレ以外（ヘッドラインなど）
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
		if (moved) {
			// PVは同じ人につき一定時間に1回だけ数える
			const key = [auth.getUserId(socket), threadId].join(delimiter);
			if (!pvCounted.has(key) || !pvCache.has(threadId)) {
				pvCounted.set(key, true);
				pvCache.set(threadId, (pvCache.get(threadId) ?? 0) + 1);
			}
			notifyThreadRoom(io, threadId);
			// 元いたスレに退室通知
			const { prevThreadId } = socket.data;
			if (prevThreadId) notifyThreadRoom(io, prevThreadId);
			socket.data.prevRoom = room;
			socket.data.prevThreadId = threadId;
		} else {
			socket.emit(api, { ok: true, size: sizeOf(io, room), pv: null });
		}
	});
	socket.on("disconnect", () => {
		const { prevThreadId } = socket.data;
		if (prevThreadId) notifyThreadRoom(io, prevThreadId);
	});
};

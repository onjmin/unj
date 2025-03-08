import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { SERIAL, likeSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import Auth from "../mylib/auth.js";
import Nonce from "../mylib/nonce.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";

const api = "like";
const delimiter = "###";
const done: Set<string> = new Set();
export const goodCounts: Map<number, number> = new Map();
export const badCounts: Map<number, number> = new Map();

let id: NodeJS.Timeout;
const delay = 1000 * 60 * 8;
const lazyUpdate = () => {
	clearTimeout(id);
	id = setTimeout(() => {
		// DB書き込み
	}, delay);
};

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const like = v.safeParse(likeSchema, data);
		if (!like.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const serial = v.safeParse(SERIAL, decodeThreadId(like.output.threadId));
		if (!serial.success) {
			return;
		}
		const id = serial.output;

		// roomのチェック
		if (!exist(io, getThreadRoom(id)) || !joined(socket, getThreadRoom(id))) {
			return;
		}

		const auth = Auth.get(socket);
		const key = [auth, id].join(delimiter);

		// Nonce値の完全一致チェック
		if (!Nonce.isValid(socket, like.output.nonce)) {
			return;
		}

		// 追加検証
		if (done.has(key)) {
			return;
		}
		done.add(key);

		Nonce.lock(socket);
		Nonce.update(socket);

		// 危険な処理
		try {
			let goodCount = goodCounts.get(id) ?? 0;
			let badCount = badCounts.get(id) ?? 0;
			if (like.output.good) {
				goodCounts.set(id, ++goodCount);
			} else {
				badCounts.set(id, ++badCount);
			}
			io.to(getThreadRoom(id)).emit(api, {
				ok: true,
				goodCount,
				badCount,
			});
			lazyUpdate();
		} catch (error) {
		} finally {
			Nonce.unlock(socket);
		}
	});
};

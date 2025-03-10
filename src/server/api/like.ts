import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { likeSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { badCountCache, goodCountCache, isExpired } from "../mylib/cache.js";
import { DEV_MODE } from "../mylib/env.js";
import nonce from "../mylib/nonce.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";

const api = "like";
const delimiter = "###";
const done: Set<string> = new Set();

let id: NodeJS.Timeout;
const delay = 1000 * 60 * 4;
const lazyUpdate = () => {
	clearTimeout(id);
	id = setTimeout(() => {
		// 危険な処理
		// try {
		// } catch (error) {
		// 	if (DEV_MODE) {
		// 		console.error(error);
		// 	}
		// } finally {
		// }
	}, delay);
};

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const like = v.safeParse(likeSchema, data);
		if (!like.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(like.output.threadId);
		if (threadId === null) {
			return;
		}

		if (isExpired(threadId)) {
			return;
		}

		// roomのチェック
		if (
			!exist(io, getThreadRoom(threadId)) ||
			!joined(socket, getThreadRoom(threadId))
		) {
			return;
		}

		// 連投規制
		const key = [auth.get(socket), id].join(delimiter);
		if (done.has(key)) {
			return;
		}
		done.add(key);

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, like.output.nonce)) {
			return;
		}

		// 危険な処理
		try {
			nonce.lock(socket);
			nonce.update(socket);

			let goodCount = goodCountCache.get(threadId) ?? 0;
			let badCount = badCountCache.get(threadId) ?? 0;
			if (like.output.good) {
				goodCountCache.set(threadId, ++goodCount);
			} else {
				badCountCache.set(threadId, ++badCount);
			}
			socket.emit(api, {
				ok: true,
				goodCount,
				badCount,
				yours: true,
			});
			socket.to(getThreadRoom(threadId)).emit(api, {
				ok: true,
				goodCount,
				badCount,
				yours: false,
			});
			lazyUpdate();
		} catch (error) {
		} finally {
			nonce.unlock(socket);
		}
	});
};

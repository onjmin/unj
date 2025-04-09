import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { likeSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { badCountCache, goodCountCache, isDeleted } from "../mylib/cache.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";

const api = "like";
const delimiter = "###";
const done: Set<string> = new Set();

const delay = 1000 * 60 * 4; // Glitchは5分放置でスリープする
const neet: Map<number, NodeJS.Timeout> = new Map();
const lazyUpdate = (threadId: number, goodCount: number, badCount: number) => {
	clearTimeout(neet.get(threadId));
	const id = setTimeout(async () => {
		try {
			await pool.query(
				"UPDATE threads SET good_count = $1, bad_count = $2 WHERE id = $3",
				[goodCount, badCount, threadId],
			);
		} catch (err) {}
	}, delay);
	neet.set(threadId, id);
};

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const like = v.safeParse(likeSchema, data);
		if (!like.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(like.output.threadId);
		if (threadId === null) return;

		if (isDeleted(threadId)) return;

		// roomのチェック
		if (
			!exist(io, getThreadRoom(threadId)) ||
			!joined(socket, getThreadRoom(threadId))
		)
			return;

		// 連投規制
		const key = [auth.getUserId(socket), threadId].join(delimiter);
		if (done.has(key)) return;
		done.add(key);

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, like.output.nonce)) {
			logger.verbose(`🔒 ${like.output.nonce}`);
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
			lazyUpdate(threadId, goodCount, badCount);
			logger.verbose(api);
		} catch (error) {
			logger.error(error);
		} finally {
			nonce.unlock(socket);
		}
	});
};

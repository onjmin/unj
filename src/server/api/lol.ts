import type { PoolClient } from "pg";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { lolSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { isDeleted, lolCountCache } from "../mylib/cache.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { onError, pool } from "../mylib/pool.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";

const api = "lol";
const delimiter = "###";
const done: Set<string> = new Set();

const delay = 1000 * 60 * 4; // Glitchは5分放置でスリープする
const neet: Map<number, NodeJS.Timeout> = new Map();
const lazyUpdate = (threadId: number, lolCount: number) => {
	clearTimeout(neet.get(threadId));
	const id = setTimeout(async () => {
		let poolClient: PoolClient | null = null;
		try {
			poolClient = await pool.connect();
			onError(poolClient);
			await poolClient.query(
				"UPDATE threads SET lol_count = $1 WHERE id = $2",
				[lolCount, threadId],
			);
		} finally {
			poolClient?.release();
		}
	}, delay);
	neet.set(threadId, id);
};

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const lol = v.safeParse(lolSchema, data);
		if (!lol.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(lol.output.threadId);
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
		if (!nonce.isValid(socket, lol.output.nonce)) {
			logger.verbose(`🔒 ${lol.output.nonce}`);
			return;
		}

		// 危険な処理
		try {
			nonce.lock(socket);
			nonce.update(socket);

			let lolCount = lolCountCache.get(threadId) ?? 0;
			lolCountCache.set(threadId, ++lolCount);
			socket.emit(api, {
				ok: true,
				lolCount,
				yours: true,
			});
			socket.to(getThreadRoom(threadId)).emit(api, {
				ok: true,
				lolCount,
				yours: false,
			});
			lazyUpdate(threadId, lolCount);
			logger.verbose(api);
		} catch (error) {
			logger.error(error);
		} finally {
			nonce.unlock(socket);
		}
	});
};

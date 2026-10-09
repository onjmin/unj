import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { lolSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { isDeleted, lolCountCache, threadCached } from "../mylib/cache.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";
import { TtlMap } from "../mylib/ttl-map.js";

const api = "lol";
const delimiter = "###";
// userId###threadId（しばらく草されていない古いものから捨てる）
const done: TtlMap<string, true> = new TtlMap({
	max: 20000,
	ttl: 1000 * 60 * 60 * 24 * 30,
});

const delay = 1000 * 60 * 4; // Glitchは5分放置でスリープする
const neet: Map<number, NodeJS.Timeout> = new Map();
const lolCountDiffMap: Map<number, number> = new Map();
const lazyUpdate = (threadId: number, lolCountDiff: number) => {
	lolCountDiffMap.set(
		threadId,
		(lolCountDiffMap.get(threadId) ?? 0) + lolCountDiff,
	);
	clearTimeout(neet.get(threadId));
	const id = setTimeout(async () => {
		neet.delete(threadId);
		// 発火時点の差分を送る（送信中に増えた分は次回に持ち越す）
		const diff = lolCountDiffMap.get(threadId) ?? 0;
		try {
			await pool.query(
				"UPDATE threads SET lol_count = lol_count + $1 WHERE id = $2",
				[diff, threadId],
			);
			const rest = (lolCountDiffMap.get(threadId) ?? 0) - diff;
			if (rest === 0) {
				lolCountDiffMap.delete(threadId);
			} else {
				lolCountDiffMap.set(threadId, rest);
			}
		} catch (error) {
			logger.verbose(api);
			logger.error(error);
		}
	}, delay);
	neet.set(threadId, id);
};

/**
 * DB未反映の草があるか（スレのキャッシュを捨ててよいかの判定用）
 */
export const hasPendingLol = (threadId: number) =>
	lolCountDiffMap.has(threadId);

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const lol = v.safeParse(lolSchema, data);
		if (!lol.success) return;

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, lol.output.nonce)) {
			logger.verbose(`🔒 ${lol.output.nonce}`);
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(lol.output.threadId);
		if (threadId === null) return;

		if (isDeleted(threadId)) return;
		// readThread前（またはキャッシュを捨てた後）のスレは対象外
		if (!threadCached.has(threadId)) return;

		// roomのチェック
		if (
			!exist(io, getThreadRoom(threadId)) ||
			!joined(socket, getThreadRoom(threadId))
		)
			return;

		// 連投規制
		const key = [auth.getUserId(socket), threadId].join(delimiter);
		if (done.has(key)) return;
		done.set(key, true);

		// 危険な処理
		try {
			nonce.lock(socket);
			nonce.update(socket);

			let lolCount = lolCountCache.get(threadId) ?? 0;
			lolCountCache.set(threadId, ++lolCount);
			lazyUpdate(threadId, 1);
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
			logger.verbose(api);
		} catch (error) {
			logger.error(error);
		} finally {
			nonce.unlock(socket);
		}
	});
};

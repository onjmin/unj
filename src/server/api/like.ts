import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { likeSchema } from "../../common/request/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import {
	badCountCache,
	goodCountCache,
	isDeleted,
	threadCached,
} from "../mylib/cache.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";
import { TtlMap } from "../mylib/ttl-map.js";

const api = "like";
const delimiter = "###";
// userId###threadId（しばらくｲｲされていない古いものから捨てる）
const done: TtlMap<string, true> = new TtlMap({
	max: 20000,
	ttl: 1000 * 60 * 60 * 24 * 30,
});

const delay = 1000 * 60 * 4; // Glitchは5分放置でスリープする
const neet: Map<number, NodeJS.Timeout> = new Map();
const goodCountDiffMap: Map<number, number> = new Map();
const badCountDiffMap: Map<number, number> = new Map();
const lazyUpdate = (
	threadId: number,
	goodCountDiff: number,
	badCountDiff: number,
) => {
	goodCountDiffMap.set(
		threadId,
		(goodCountDiffMap.get(threadId) ?? 0) + goodCountDiff,
	);
	badCountDiffMap.set(
		threadId,
		(badCountDiffMap.get(threadId) ?? 0) + badCountDiff,
	);
	clearTimeout(neet.get(threadId));
	const id = setTimeout(async () => {
		neet.delete(threadId);
		// 発火時点の差分を送る（送信中に増えた分は次回に持ち越す）
		const diff = goodCountDiffMap.get(threadId) ?? 0;
		const diff2 = badCountDiffMap.get(threadId) ?? 0;
		try {
			// good_count/bad_count は SMALLINT。上限で止めないと 32767 を超える加算が毎回失敗し続ける
			// （unj-reze も同じ列に LEAST で加算する）。$1::int は smallint 同士の加算で先に溢れないように
			await pool.query(
				"UPDATE threads SET good_count = LEAST(good_count + $1::int, 32767), bad_count = LEAST(bad_count + $2::int, 32767) WHERE id = $3",
				[diff, diff2, threadId],
			);
			const rest = (goodCountDiffMap.get(threadId) ?? 0) - diff;
			const rest2 = (badCountDiffMap.get(threadId) ?? 0) - diff2;
			if (rest === 0 && rest2 === 0) {
				goodCountDiffMap.delete(threadId);
				badCountDiffMap.delete(threadId);
			} else {
				goodCountDiffMap.set(threadId, rest);
				badCountDiffMap.set(threadId, rest2);
			}
		} catch (error) {
			logger.verbose(api);
			logger.error(error);
		}
	}, delay);
	neet.set(threadId, id);
};

/**
 * DB未反映のｲｲ/ｲｸﾅｲがあるか（スレのキャッシュを捨ててよいかの判定用）
 */
export const hasPendingLike = (threadId: number) =>
	goodCountDiffMap.has(threadId) || badCountDiffMap.has(threadId);

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const like = v.safeParse(likeSchema, data);
		if (!like.success) return;

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, like.output.nonce)) {
			logger.verbose(`🔒 ${like.output.nonce}`);
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(like.output.threadId);
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

			let goodCount = goodCountCache.get(threadId) ?? 0;
			let badCount = badCountCache.get(threadId) ?? 0;
			if (like.output.good) {
				goodCountCache.set(threadId, ++goodCount);
				lazyUpdate(threadId, 1, 0);
			} else {
				badCountCache.set(threadId, ++badCount);
				lazyUpdate(threadId, 0, 1);
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
			logger.verbose(api);
		} catch (error) {
			logger.error(error);
		} finally {
			nonce.unlock(socket);
		}
	});
};

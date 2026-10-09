import type { Socket } from "socket.io";
import * as v from "valibot";
import { SearchSchema } from "../../common/request/schema.js";
import type { SearchResult } from "../../common/response/schema.js";
import { encodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { TokenBucket } from "../mylib/token-bucket.js";

const api = "search";
const tokenBucket = new TokenBucket({
	capacity: 5, // burstあり（初回5連続検索可能）
	refillRate: 1 / 2, // 2秒で1トークン回復
	costPerAction: 1,
});

/**
 * LIKEのワイルドカード（% _）とエスケープ文字（\）を文字として検索させる
 */
const escapeLike = (str: string) => str.replace(/[\\%_]/g, (c) => `\\${c}`);

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const search = v.safeParse(SearchSchema, data);
		if (!search.success) return;

		const keyword = search.output.keyword.trim();
		if (keyword === "") return;

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, search.output.nonce)) {
			logger.verbose(`🔒 ${search.output.nonce}`);
			return;
		}

		const userId = auth.getUserId(socket);

		// レートリミット
		if (!tokenBucket.attempt(userId)) {
			logger.verbose(`⌛ ${tokenBucket.getCooldownSeconds(userId).toFixed(1)}`);
			return;
		}

		// 危険な処理
		try {
			nonce.lock(socket);
			nonce.update(socket);

			// レスの取得
			const values: (string | number)[] = [];
			values.push(`%${escapeLike(keyword)}%`);
			const like = `LIKE LOWER($${values.length}) ESCAPE '\\'`;
			const query = [
				"SELECT * FROM (",
				"SELECT",
				[
					"res.cc_user_id",
					"res.content_text",
					"res.content_url",
					"res.num",
					"res.created_at",
					"threads.id AS thread_id",
					"threads.title AS title",
					"threads.board_id AS board_id",
					"threads.res_count AS res_count",
					"threads.deleted_at AS deleted_at",
				].join(","),
				"FROM res",
				"INNER JOIN threads ON res.thread_id = threads.id",
				"WHERE (threads.deleted_at IS NULL OR threads.deleted_at > CURRENT_TIMESTAMP)",
				`AND (LOWER(res.cc_user_id) ${like}`,
				`OR LOWER(res.content_text) ${like}`,
				`OR LOWER(res.content_url) ${like})`,
				"UNION ALL",
				"SELECT",
				[
					"cc_user_id",
					"content_text",
					"content_url",
					"1 AS num",
					"created_at",
					"id AS thread_id",
					"title",
					"board_id",
					"res_count",
					"deleted_at",
				].join(","),
				"FROM threads",
				"WHERE (deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP)",
				`AND (LOWER(cc_user_id) ${like}`,
				`OR LOWER(content_text) ${like}`,
				`OR LOWER(content_url) ${like})`,
				") AS combined_results",
			];

			query.push("ORDER BY combined_results.created_at DESC");
			values.push(search.output.limit);
			query.push(`LIMIT $${values.length}`);

			const list: SearchResult[] = [];
			const { rows } = await pool.query(query.join(" "), values);
			for (const record of rows) {
				list.push({
					// 書き込み内容
					ccUserId: record.cc_user_id,
					contentText: record.content_text,
					contentUrl: record.content_url,
					// メタ情報
					resNum: record.num,
					createdAt: record.created_at,
					threadId: encodeThreadId(record.thread_id) ?? "",
					title: record.title,
					boardId: record.board_id,
					resCount: record.res_count,
				});
			}

			socket.emit(api, {
				ok: true,
				list,
			});
			logger.verbose(api);
		} catch (error) {
			logger.error(error);
		} finally {
			nonce.unlock(socket);
		}
	});
};

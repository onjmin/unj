import type { Socket } from "socket.io";
import * as v from "valibot";
import { SearchSchema } from "../../common/request/schema.js";
import type { SearchResult } from "../../common/response/schema.js";
import {
	decodeResId,
	encodeResId,
	encodeThreadId,
} from "../mylib/anti-debug.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";

const api = "search";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const search = v.safeParse(SearchSchema, data);
		if (!search.success) return;

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, search.output.nonce)) {
			logger.verbose(`🔒 ${search.output.nonce}`);
			return;
		}

		// 危険な処理
		try {
			nonce.lock(socket);
			nonce.update(socket);

			// レスの取得
			const values: (string | number)[] = [];
			const query = [
				"SELECT",
				[
					"res.*",
					"threads.id AS thread_id",
					"threads.title AS title",
					"threads.res_count AS res_count",
				].join(","),
				"FROM res",
				"INNER JOIN threads ON res.thread_id = threads.id",
				"WHERE (deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP)",
			];

			values.push(`%${search.output.keyword}%`);
			query.push(`AND (LOWER(res.cc_user_id) LIKE LOWER($${values.length})`);
			query.push(`OR LOWER(res.content_text) LIKE LOWER($${values.length})`);
			query.push(`OR LOWER(res.content_url) LIKE LOWER($${values.length}))`);

			const sinceResId = decodeResId(search.output.sinceResId ?? "");
			if (sinceResId !== null) {
				values.push(sinceResId);
				query.push(`AND id >= $${values.length}`);
			}
			const untilResId = decodeResId(search.output.untilResId ?? "");
			if (untilResId !== null) {
				values.push(untilResId);
				query.push(`AND id <= $${values.length}`);
			}
			query.push("ORDER BY created_at DESC");
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
					resId: encodeResId(record.id) ?? "",
					threadId: encodeThreadId(record.thread_id) ?? "",
					title: record.title,
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

import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { HeadlineSchema } from "../../common/request/schema.js";
import type { HeadlineThread } from "../../common/response/schema.js";
import {
	decodeThreadId,
	encodeResId,
	encodeThreadId,
} from "../mylib/anti-debug.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { sizeOf } from "../mylib/socket.js";

const api = "headline";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const headline = v.safeParse(HeadlineSchema, data);
		if (!headline.success) return;

		// cursorの復号
		let cursor: number | null = null;
		if (headline.output.cursor !== null) {
			cursor = decodeThreadId(headline.output.cursor);
			if (cursor === null) return;
		}
		const { size, desc } = headline.output;

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, headline.output.nonce)) {
			logger.verbose(`🔒 ${headline.output.nonce}`);
			return;
		}

		// 危険な処理
		try {
			nonce.lock(socket);
			nonce.update(socket);

			const query = [
				"SELECT * FROM threads WHERE deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP",
			];
			const values = [];
			if (cursor !== null) {
				if (desc) {
					query.push("AND id <= $1");
				} else {
					query.push("AND id >= $1");
				}
				values.push(cursor);
			}
			query.push(`ORDER BY latest_res_at ${desc ? "DESC" : "ASC"}`);
			query.push(`LIMIT $${values.length + 1}`);
			values.push(size);

			const { rows } = await pool.query(query.join(" "), values);

			const list: HeadlineThread[] = [];
			for (const record of rows) {
				const latestResAt = new Date(record.latest_res_at);
				const resCount = record.res_count;
				list.push({
					// 書き込み内容
					ccUserId: record.cc_user_id,
					// メタ情報
					id: encodeThreadId(record.id) ?? "",
					latestResAt,
					resCount,
					latestCursor: encodeResId(record.latest_cursor) ?? "",
					// 基本的な情報
					title: record.title,
					// 動的なデータ
					online: sizeOf(io, record.id),
					ikioi:
						Math.floor(
							(resCount * 3600_000_0) / (+new Date() - +record.created_at),
						) / 10,
					lolCount: record.lol_count,
					goodCount: record.good_count,
					badCount: record.bad_count,
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

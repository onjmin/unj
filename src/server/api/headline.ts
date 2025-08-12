import { format } from "date-fns";
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
import { getThreadRoom, sizeOf } from "../mylib/socket.js";

const api = "headline";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const headline = v.safeParse(HeadlineSchema, data);
		if (!headline.success) return;

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
				"SELECT * FROM threads WHERE",
				"(deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP)",
			];
			const { size, desc, cursor } = headline.output;
			const values = [];
			if (cursor !== null) {
				if (desc) {
					query.push("AND latest_res_at < $1");
				} else {
					query.push("AND latest_res_at > $1");
				}
				values.push(format(cursor, "yyyy-MM-dd HH:mm:ss"));
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
					latestRes: record.latest_res,
					latestResAt,
					resCount,
					latestCursor: encodeResId(record.latest_cursor) ?? "",
					// 基本的な情報
					title: record.title,
					// 動的なデータ
					online: sizeOf(io, getThreadRoom(record.id)),
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

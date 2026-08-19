import { format } from "date-fns";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { boardIdMap } from "../../common/request/board.js";
import { HeadlineSchema } from "../../common/request/schema.js";
import type { HeadlineThread } from "../../common/response/schema.js";
import { encodeThreadId } from "../mylib/anti-debug.js";
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

		const board = boardIdMap.get(headline.output.boardId);
		if (!board) return;

		// 危険な処理
		try {
			nonce.lock(socket);
			nonce.update(socket);

			const values: (number | string)[] = [board.id];
			const query = [
				"SELECT * FROM threads",
				"WHERE (deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP)",
				`AND board_id = $${values.length}`,
			];
			const { limit, sinceDate, untilDate } = headline.output;
			if (sinceDate !== null) {
				values.push(format(sinceDate, "yyyy-MM-dd HH:mm:ss"));
				query.push(`AND latest_res_at >= $${values.length}`);
			}
			if (untilDate !== null) {
				values.push(format(untilDate, "yyyy-MM-dd HH:mm:ss"));
				query.push(`AND latest_res_at <= $${values.length}`);
			}
			query.push("ORDER BY latest_res_at DESC");
			values.push(limit);
			query.push(`LIMIT $${values.length}`);

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
					// 基本的な情報
					title: record.title,
					// unj-reze発スレは title が空文字/NULLで保存される
					// （unj-reze側 lib/db/pg.ts createPost 参照）。一覧の見出しが空欄に
					// ならないよう、本文をクライアント側でフォールバック表示するために渡す。
					contentText: record.content_text ?? "",
					boardId: board.id,
					// 動的なデータ
					online: sizeOf(io, getThreadRoom(record.id)),
					ikioi:
						Math.floor(
							(resCount * 3600_000_0) / (Date.now() - +record.created_at),
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

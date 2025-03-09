import { neon } from "@neondatabase/serverless";
import { th } from "date-fns/locale";
import type { Socket } from "socket.io";
import * as v from "valibot";
import { ReadThreadSchema } from "../../common/request/schema.js";
import type { Res, Thread } from "../../common/response/schema.js";
import {
	decodeResId,
	decodeThreadId,
	encodeThreadId,
	encodeUserId,
} from "../mylib/anti-debug.js";
import { unjDefaultUserName } from "../mylib/cc.js";
import { DEV_MODE, NEON_DATABASE_URL } from "../mylib/env.js";
import Nonce from "../mylib/nonce.js";
import { badCounts, goodCounts } from "./like.js";
import { lolCounts } from "./lol.js";

const api = "readThread";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const readThread = v.safeParse(ReadThreadSchema, data);
		if (!readThread.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const id = decodeThreadId(readThread.output.threadId);
		if (id === null) {
			return;
		}

		// cursorの復号
		let cursor: number | null = null;
		if (readThread.output.cursor !== null) {
			cursor = decodeResId(readThread.output.cursor);
			if (cursor === null) {
				return;
			}
		}
		const { size, desc } = readThread.output;

		// Nonce値の完全一致チェック
		if (!Nonce.isValid(socket, readThread.output.nonce)) {
			return;
		}
		Nonce.lock(socket);
		Nonce.update(socket);

		// 危険な処理
		try {
			const sql = neon(NEON_DATABASE_URL);
			// スレッドの取得
			const records = await sql(`SELECT * FROM threads WHERE id = ${id}`);
			if (!records.length) {
				return;
			}
			const threadRecord = records[0];
			let deletedAt: Date | null = null;
			if (threadRecord.deleted_at !== null) {
				deletedAt = new Date(threadRecord.deleted_at);
				if (new Date() > deletedAt) {
					return;
				}
			}

			if (!lolCounts.has(id)) {
				lolCounts.set(id, threadRecord.lol_count);
				goodCounts.set(id, threadRecord.good_count);
				badCounts.set(id, threadRecord.bad_count);
			}

			// レスの取得
			const query = [`SELECT * FROM res WHERE thread_id = ${id}`];
			if (cursor !== null) {
				if (desc) {
					query.push(`AND id < ${cursor}`);
				} else {
					query.push(`AND id > ${cursor}`);
				}
			}
			query.push(`ORDER BY num ${desc ? "DESC" : "ASC"}`);
			query.push(`LIMIT ${size}`);
			const list: Res[] = [];
			for (const record of await sql(query.join(" "))) {
				list.push({
					isOwner: record.is_owner,
					num: record.num,
					createdAt: record.created_at,
					ccUserId: record.cc_user_id || "???",
					ccUserName: record.cc_user_name || unjDefaultUserName,
					ccUserAvatar: record.cc_user_avatar,
					content: record.content,
					contentUrl: record.content_url,
					contentType: record.content_type,
				});
			}

			const thread: Thread = {
				id: threadRecord.id,
				latestResAt: new Date(threadRecord.latest_res_at),
				resCount: threadRecord.res_count,
				title: threadRecord.title,
				lolCount: lolCounts.get(id) ?? 0,
				goodCount: goodCounts.get(id) ?? 0,
				badCount: badCounts.get(id) ?? 0,
				resList: list,
				deletedAt,
				ps: threadRecord.ps,
				resLimit: threadRecord.res_limit,
				ageRes: null, // TODO: 未実装
				varsan: threadRecord.varsan,
				sage: threadRecord.sage,
				threadType: threadRecord.thread_type,
				ccBitmask: threadRecord.cc_bitmask,
				contentTypesBitmask: threadRecord.content_types_bitmask,
			};

			socket.emit(api, {
				ok: true,
				thread,
			});
		} catch (error) {
			if (DEV_MODE) {
				console.error(error);
			}
		} finally {
			Nonce.unlock(socket);
		}
	});
};

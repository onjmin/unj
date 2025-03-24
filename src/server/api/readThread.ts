// pool
import { Pool, type PoolClient, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { NEON_DATABASE_URL } from "../mylib/env.js";
neonConfig.webSocketConstructor = ws;

import type { Socket } from "socket.io";
import * as v from "valibot";
import { ReadThreadSchema } from "../../common/request/schema.js";
import type { Res, Thread } from "../../common/response/schema.js";
import {
	decodeResId,
	decodeThreadId,
	encodeResId,
} from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import {
	ageResCache,
	ageResNumCache,
	badCountCache,
	balsResNumCache,
	bannedCache,
	bannedIPCache,
	ccBitmaskCache,
	contentTypesBitmaskCache,
	deletedAtCache,
	firstCursorCache,
	goodCountCache,
	isDeleted,
	latestCursorCache,
	lolCountCache,
	ownerIdCache,
	psCache,
	resCountCache,
	resLimitCache,
	sageCache,
	subbedCache,
	threadCached,
	varsanCache,
} from "../mylib/cache.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";

const api = "readThread";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const readThread = v.safeParse(ReadThreadSchema, data);
		if (!readThread.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(readThread.output.threadId);
		if (threadId === null) return;

		if (isDeleted(threadId)) return;

		// cursorの復号
		let cursor: number | null = null;
		if (readThread.output.cursor !== null) {
			cursor = decodeResId(readThread.output.cursor);
			if (cursor === null) return;
		}

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, readThread.output.nonce)) {
			logger.verbose(`🔒 ${readThread.output.nonce}`);
			return;
		}

		// 危険な処理
		let poolClient: PoolClient | null = null;
		try {
			nonce.lock(socket);
			nonce.update(socket);

			// pool
			const pool = new Pool({ connectionString: NEON_DATABASE_URL });
			pool.on("error", (error) => {
				throw error;
			});
			poolClient = await pool.connect();

			// スレッドの取得
			const { rows, rowCount } = await poolClient.query(
				"SELECT * FROM threads WHERE id = $1",
				[threadId],
			);
			if (rowCount === 0) return;
			const threadRecord = rows[0];

			// キャッシュの登録
			if (!threadCached.has(threadId)) {
				threadCached.set(threadId, true);
				firstCursorCache.set(threadId, threadRecord.first_cursor);
				latestCursorCache.set(threadId, threadRecord.latest_cursor);
				// 高度な設定
				varsanCache.set(threadId, threadRecord.varsan);
				sageCache.set(threadId, threadRecord.sage);
				ccBitmaskCache.set(threadId, threadRecord.cc_bitmask);
				contentTypesBitmaskCache.set(
					threadId,
					threadRecord.content_types_bitmask,
				);
				resLimitCache.set(threadId, threadRecord.res_limit);
				deletedAtCache.set(threadId, threadRecord.deleted_at);
				// 動的なデータ
				resCountCache.set(threadId, threadRecord.res_count);
				psCache.set(threadId, threadRecord.ps);
				ageResNumCache.set(threadId, threadRecord.age_res_num);
				ageResCache.set(threadId, null);
				balsResNumCache.set(threadId, threadRecord.bals_res_num);
				lolCountCache.set(threadId, threadRecord.lol_count);
				goodCountCache.set(threadId, threadRecord.good_count);
				badCountCache.set(threadId, threadRecord.bad_count);
				// スレ主
				ownerIdCache.set(threadId, threadRecord.user_id);
				// アク禁＆副主
				bannedCache.set(threadId, new Set());
				bannedIPCache.set(threadId, new Set());
				subbedCache.set(threadId, new Set());

				// !age
				if (
					threadRecord.age_res_num > 1 &&
					threadRecord.age_res_num <= threadRecord.res_count
				) {
					const { rows, rowCount } = await poolClient.query(
						"SELECT * FROM res WHERE thread_id = $1 AND num = $2",
						[threadId, threadRecord.age_res_num],
					);
					if (rowCount) {
						const record = rows[0];
						const ageRes: Res = {
							yours: false,
							// 書き込み内容
							ccUserId: record.cc_user_id,
							ccUserName: record.cc_user_name,
							ccUserAvatar: record.cc_user_avatar,
							content: record.content,
							contentUrl: record.content_url,
							contentType: record.content_type,
							commandResult: record.command_result,
							// メタ情報
							cursor: encodeResId(record.id) ?? "",
							num: record.num,
							createdAt: record.created_at,
							isOwner: record.is_owner,
							sage: record.sage,
						};
						ageResCache.set(threadId, ageRes);
					}
				}
			}

			if (isDeleted(threadId)) {
				logger.verbose(`🪦 ${threadId}`);
				return;
			}

			// レスの取得
			const query = [`SELECT * FROM res WHERE thread_id = ${threadId}`];
			const { size, desc } = readThread.output;
			if (cursor !== null) {
				if (desc) {
					query.push(`AND id <= ${cursor}`);
				} else {
					query.push(`AND id >= ${cursor}`);
				}
			}
			query.push(`ORDER BY num ${desc ? "DESC" : "ASC"}`);
			query.push(`LIMIT ${size}`);

			const userId = auth.getUserId(socket);
			const list: Res[] = [];
			for (const record of (await poolClient.query(query.join(" "))).rows) {
				const resId = encodeResId(record.id);
				if (resId === null) return;
				list.push({
					yours: record.user_id === userId,
					// 書き込み内容
					ccUserId: record.cc_user_id,
					ccUserName: record.cc_user_name,
					ccUserAvatar: record.cc_user_avatar,
					content: record.content,
					contentUrl: record.content_url,
					contentType: record.content_type,
					commandResult: record.command_result,
					// メタ情報
					cursor: resId,
					num: record.num,
					createdAt: record.created_at,
					isOwner: record.is_owner,
					sage: record.sage,
				});
			}

			const thread: Thread = {
				yours: threadRecord.user_id === userId,
				firstCursor: encodeResId(firstCursorCache.get(threadId) ?? 0) ?? "",
				latestCursor: encodeResId(latestCursorCache.get(threadId) ?? 0) ?? "",
				desc,
				// 書き込み内容
				ccUserId: threadRecord.cc_user_id,
				ccUserName: threadRecord.cc_user_name,
				ccUserAvatar: threadRecord.cc_user_avatar,
				content: threadRecord.content,
				contentUrl: threadRecord.content_url,
				contentType: threadRecord.content_type,
				// 基本的な情報
				title: threadRecord.title,
				threadType: threadRecord.thread_type,
				// 高度な設定
				varsan: varsanCache.get(threadId) ?? false,
				sage: sageCache.get(threadId) ?? false,
				ccBitmask: ccBitmaskCache.get(threadId) ?? 0,
				contentTypesBitmask: contentTypesBitmaskCache.get(threadId) ?? 0,
				resLimit: resLimitCache.get(threadId) ?? 0,
				deletedAt: deletedAtCache.get(threadId) ?? null,
				// 動的なデータ
				resCount: resCountCache.get(threadId) ?? 0,
				ps: psCache.get(threadId) ?? "",
				ageResNum: ageResNumCache.get(threadId) ?? 0,
				ageRes: ageResCache.get(threadId) ?? null,
				balsResNum: balsResNumCache.get(threadId) ?? 0,
				lolCount: lolCountCache.get(threadId) ?? 0,
				goodCount: goodCountCache.get(threadId) ?? 0,
				badCount: badCountCache.get(threadId) ?? 0,
				// メタ情報
				id: readThread.output.threadId,
				createdAt: threadRecord.created_at,
				resList: list,
			};

			socket.emit(api, {
				ok: true,
				thread,
			});
			logger.verbose(api);
		} catch (error) {
			logger.error(error);
		} finally {
			nonce.unlock(socket);
		}
	});
};

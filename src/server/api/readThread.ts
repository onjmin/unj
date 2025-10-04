import type { Socket } from "socket.io";
import * as v from "valibot";
import { ReadThreadSchema } from "../../common/request/schema.js";
import type { Res, Thread } from "../../common/response/schema.js";
import { decodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import {
	ageResCache,
	ageResNumCache,
	badCountCache,
	balsResNumCache,
	bannedCache,
	bannedIPCache,
	boardIdCache,
	ccBitmaskCache,
	ccUserAvatarCache,
	ccUserIdCache,
	ccUserNameCache,
	contentTextCache,
	contentTypeCache,
	contentTypesBitmaskCache,
	contentUrlCache,
	createdAtCache,
	deletedAtCache,
	goodCountCache,
	isDeleted,
	lolCountCache,
	ownerIdCache,
	ownerIpCache,
	psCache,
	resCountCache,
	resLimitCache,
	sageCache,
	subbedCache,
	threadCached,
	titleCache,
	userIdCache,
	varsanCache,
} from "../mylib/cache.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";

const api = "readThread";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const readThread = v.safeParse(ReadThreadSchema, data);
		if (!readThread.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(readThread.output.threadId);
		if (threadId === null) return;

		if (isDeleted(threadId)) return;

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, readThread.output.nonce)) {
			logger.verbose(`🔒 ${readThread.output.nonce}`);
			return;
		}

		// 危険な処理
		try {
			nonce.lock(socket);
			nonce.update(socket);

			// キャッシュの登録
			if (!threadCached.has(threadId)) {
				threadCached.set(threadId, true);
				// スレッドの取得
				const { rows, rowCount } = await pool.query(
					"SELECT * FROM threads WHERE id = $1",
					[threadId],
				);
				if (rowCount === 0) return;
				const threadRecord = rows[0];

				// 書き込み内容
				ccUserIdCache.set(threadId, threadRecord.cc_user_id);
				ccUserNameCache.set(threadId, threadRecord.cc_user_name);
				ccUserAvatarCache.set(threadId, threadRecord.cc_user_avatar);
				contentTextCache.set(threadId, threadRecord.content_text);
				contentUrlCache.set(threadId, threadRecord.content_url);
				contentTypeCache.set(threadId, threadRecord.content_type);
				// メタ情報
				createdAtCache.set(threadId, new Date(threadRecord.created_at));
				userIdCache.set(threadId, threadRecord.user_id);
				// 基本的な情報
				titleCache.set(threadId, threadRecord.title);
				boardIdCache.set(threadId, threadRecord.board_id);
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
				ownerIpCache.set(threadId, threadRecord.ip);
				// アク禁＆副主
				bannedCache.set(threadId, new Set());
				bannedIPCache.set(threadId, new Set());
				subbedCache.set(threadId, new Set());

				// !age
				let ageRes: Res | null;
				const ageResNum = ageResNumCache.get(threadId) ?? 0;
				if (ageResNum === 1) {
					ageRes = {
						yours: false,
						// 書き込み内容
						ccUserId: ccUserIdCache.get(threadId) ?? "",
						ccUserName: ccUserNameCache.get(threadId) ?? "",
						ccUserAvatar: ccUserAvatarCache.get(threadId) ?? 0,
						contentText: contentTextCache.get(threadId) ?? "",
						contentUrl: contentUrlCache.get(threadId) ?? "",
						contentType: contentTypeCache.get(threadId) ?? 0,
						commandResult: "",
						// メタ情報
						num: 1,
						createdAt: createdAtCache.get(threadId) ?? new Date(0),
						isOwner: true,
						sage: false,
					};
					ageResCache.set(threadId, ageRes);
				} else if (ageResNum > 1 && ageResNum <= threadRecord.res_count) {
					const { rows, rowCount } = await pool.query(
						"SELECT * FROM res WHERE thread_id = $1 AND num = $2",
						[threadId, ageResNum],
					);
					if (rowCount) {
						const record = rows[0];
						ageRes = {
							yours: false,
							// 書き込み内容
							ccUserId: record.cc_user_id,
							ccUserName: record.cc_user_name,
							ccUserAvatar: record.cc_user_avatar,
							contentText: record.content_text,
							contentUrl: record.content_url,
							contentType: record.content_type,
							commandResult: record.command_result,
							// メタ情報
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
			const values = [threadId];
			const query = ["SELECT * FROM res WHERE thread_id = $1"];
			const { limit, sinceResNum, untilResNum } = readThread.output;
			if (sinceResNum !== null) {
				values.push(sinceResNum);
				query.push(`AND num >= $${values.length}`);
			}
			if (untilResNum !== null) {
				values.push(untilResNum);
				query.push(`AND num <= $${values.length}`);
			}
			query.push("ORDER BY num");
			values.push(limit);
			query.push(`LIMIT $${values.length}`);

			const userId = auth.getUserId(socket);
			const list: Res[] = [];
			const { rows } = await pool.query(query.join(" "), values);
			for (const record of rows) {
				list.push({
					yours: record.user_id === userId,
					// 書き込み内容
					ccUserId: record.cc_user_id,
					ccUserName: record.cc_user_name,
					ccUserAvatar: record.cc_user_avatar,
					contentText: record.content_text,
					contentUrl: record.content_url,
					contentType: record.content_type,
					commandResult: record.command_result,
					// メタ情報
					num: record.num,
					createdAt: record.created_at,
					isOwner: record.is_owner,
					sage: record.sage,
				});
			}

			const thread: Thread = {
				yours: (userIdCache.get(threadId) ?? 0) === userId,
				// 書き込み内容
				ccUserId: ccUserIdCache.get(threadId) ?? "",
				ccUserName: ccUserNameCache.get(threadId) ?? "",
				ccUserAvatar: ccUserAvatarCache.get(threadId) ?? 0,
				contentText: contentTextCache.get(threadId) ?? "",
				contentUrl: contentUrlCache.get(threadId) ?? "",
				contentType: contentTypeCache.get(threadId) ?? 0,
				// 基本的な情報
				title: titleCache.get(threadId) ?? "",
				boardId: boardIdCache.get(threadId) ?? 0,
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
				createdAt: createdAtCache.get(threadId) ?? new Date(0),
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

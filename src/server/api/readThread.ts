import { neon } from "@neondatabase/serverless";
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
	badCountCache,
	cached,
	ccBitmaskCache,
	contentTypesBitmaskCache,
	deletedAtCache,
	goodCountCache,
	isExpired,
	lolCountCache,
	ownerIdCache,
	resCountCache,
	resLimitCache,
	sageCache,
	varsanCache,
} from "../mylib/cache.js";
import { unjDefaultUserName } from "../mylib/cc.js";
import { DEV_MODE, NEON_DATABASE_URL, PROD_MODE } from "../mylib/env.js";
import nonce from "../mylib/nonce.js";

const api = "readThread";

export default ({ socket }: { socket: Socket }) => {
	socket.on(api, async (data) => {
		const readThread = v.safeParse(ReadThreadSchema, data);
		if (!readThread.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(readThread.output.threadId);
		if (threadId === null) {
			return;
		}

		if (isExpired(threadId)) {
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

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, readThread.output.nonce)) {
			return;
		}

		// 危険な処理
		const sql = neon(NEON_DATABASE_URL);
		try {
			nonce.lock(socket);
			nonce.update(socket);

			// スレッドの取得
			const records = await sql("SELECT * FROM threads WHERE id = $1", [
				threadId,
			]);
			if (!records.length) {
				return;
			}
			const threadRecord = records[0];

			// キャッシュの登録
			if (!cached.has(threadId)) {
				cached.set(threadId, true);
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
				ageResCache.set(threadId, threadRecord.age_res);
				lolCountCache.set(threadId, threadRecord.lol_count);
				goodCountCache.set(threadId, threadRecord.good_count);
				badCountCache.set(threadId, threadRecord.bad_count);
				// スレ主
				ownerIdCache.set(threadId, threadRecord.user_id);
			}

			if (isExpired(threadId)) {
				return;
			}

			// レスの取得
			const query = [`SELECT * FROM res WHERE thread_id = ${threadId}`];
			const { size, desc } = readThread.output;
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
				const resId = encodeResId(record.id);
				if (resId === null) {
					return;
				}
				list.push({
					// 書き込み内容
					ccUserId: record.cc_user_id || "???",
					ccUserName: record.cc_user_name || unjDefaultUserName,
					ccUserAvatar: record.cc_user_avatar,
					content: record.content,
					contentUrl: record.content_url,
					contentType: record.content_type,
					// メタ情報
					id: resId,
					num: record.num,
					isOwner: record.is_owner,
					createdAt: record.created_at,
				});
			}

			const userId = auth.getUserId(socket);
			const isOwner = ownerIdCache.get(threadId) === userId;

			const thread: Thread = {
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
				ps: threadRecord.ps,
				ageRes: ageResCache.get(threadId) ?? null,
				lolCount: lolCountCache.get(threadId) ?? 0,
				goodCount: goodCountCache.get(threadId) ?? 0,
				badCount: badCountCache.get(threadId) ?? 0,
				// メタ情報
				id: readThread.output.threadId,
				isOwner,
				createdAt: threadRecord.created_at,
				resList: list,
			};

			socket.emit(api, {
				ok: true,
				thread,
			});
		} catch (error) {
			if (DEV_MODE || PROD_MODE) {
				console.error(error);
			}
		} finally {
			nonce.unlock(socket);
		}
	});
};

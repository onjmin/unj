import { neon } from "@neondatabase/serverless";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import { ResSchema } from "../../common/request/schema.js";
import { NeverSchema } from "../../common/request/util.js";
import type { Res } from "../../common/response/schema.js";
import { decodeThreadId, encodeResId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import {
	ccBitmaskCache,
	contentTypesBitmaskCache,
	isExpired,
	ownerIdCache,
	resCountCache,
	resLimitCache,
	sageCache,
	varsanCache,
} from "../mylib/cache.js";
import { makeCcUserAvatar, makeCcUserId, makeCcUserName } from "../mylib/cc.js";
import { DEV_MODE, NEON_DATABASE_URL, PROD_MODE } from "../mylib/env.js";
import nonce from "../mylib/nonce.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";

const api = "res";

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const res = v.safeParse(ResSchema, data);
		if (!res.success) {
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(res.output.threadId);
		if (threadId === null) {
			return;
		}

		if (isExpired(threadId)) {
			return;
		}

		const userId = auth.getUserId(socket);
		const isOwner = ownerIdCache.get(threadId) === userId;

		const resCount = resCountCache.get(threadId) ?? 0;
		const resLimit = resLimitCache.get(threadId) ?? 0;
		if (isOwner) {
			// 次スレ誘導のためにスレ主は+5まで投稿可能
			if (resCount >= resLimit + 5) {
				return;
			}
		} else {
			if (resCount >= resLimit) {
				return;
			}
		}

		// !バルサン
		if (!isOwner && varsanCache.get(threadId)) {
			// TODO: 忍法帖の実装後
		}

		// roomのチェック
		if (
			!exist(io, getThreadRoom(threadId)) ||
			!joined(socket, getThreadRoom(threadId))
		) {
			return;
		}

		// 投稿許可されたコンテンツなのか
		const { content, contentUrl, contentType } = res.output;
		const contentTypesBitmask = contentTypesBitmaskCache.get(threadId) ?? 0;
		if ((contentTypesBitmask & contentType) === 0) {
			return;
		}

		// 偽装されたコンテンツなのか
		const contentResult = v.safeParse(
			contentSchemaMap.get(contentType) ?? NeverSchema,
			data,
		);
		if (!contentResult.success) {
			return;
		}

		const ccBitmask = ccBitmaskCache.get(threadId) ?? 0;
		const ccUserId = makeCcUserId(ccBitmask, userId);
		const ccUserName = makeCcUserName(ccBitmask, res.output.userName);
		const ccUserAvatar = makeCcUserAvatar(ccBitmask, res.output.userAvatar);

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, res.output.nonce)) {
			return;
		}

		// 危険な処理
		const sql = neon(NEON_DATABASE_URL);
		try {
			nonce.lock(socket);
			nonce.update(socket);

			await sql("BEGIN"); // トランザクション開始

			const next = resCount + 1;
			resCountCache.set(threadId, next);

			// レスの作成
			const records = await sql(
				[
					`INSERT INTO res (${[
						// 書き込み内容
						"user_id",
						"cc_user_id",
						"cc_user_name",
						"cc_user_avatar",
						"content",
						"content_url",
						"content_type",
						// メタ情報
						"thread_id",
						"num",
						"is_owner",
					].join(",")})`,
					"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
					"RETURNING *",
				].join(" "),
				[
					// 書き込み内容
					userId,
					ccUserId,
					ccUserName,
					ccUserAvatar,
					content,
					contentUrl,
					contentType,
					// メタ情報
					threadId,
					next,
					isOwner,
				],
			);
			if (!records.length) {
				return;
			}
			const { id, created_at } = records[0];
			const resId = encodeResId(id);
			if (resId === null) {
				return;
			}

			// スレッドの更新
			// TODO: スレ主による高度な設定の更新などここで行う
			await sql(
				[
					`UPDATE threads SET${sageCache.get(threadId) ? "" : " latest_res_at = NOW(),"}`,
					"res_count = $1",
					"WHERE id = $2",
				].join(" "),
				[next, threadId],
			);

			const newRes: Res = {
				// 書き込み内容
				ccUserId,
				ccUserName,
				ccUserAvatar,
				content,
				contentUrl,
				contentType,
				// メタ情報
				id: resId,
				num: next,
				isOwner,
				createdAt: created_at,
			};

			socket.emit(api, {
				ok: true,
				new: newRes,
				yours: true,
			});
			socket.to(getThreadRoom(threadId)).emit(api, {
				ok: true,
				new: newRes,
				yours: false,
			});

			await sql("COMMIT"); // 問題なければコミット
		} catch (error) {
			await sql("ROLLBACK"); // エラーが発生した場合はロールバック
			if (DEV_MODE || PROD_MODE) {
				console.error(error);
			}
		} finally {
			nonce.unlock(socket);
		}
	});
};

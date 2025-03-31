import type { PoolClient } from "@neondatabase/serverless";
import { addSeconds, isBefore } from "date-fns";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import { ResSchema, myConfig } from "../../common/request/schema.js";
import type { Meta, Res } from "../../common/response/schema.js";
import { randInt } from "../../common/util.js";
import { decodeThreadId, encodeResId, flaky } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import {
	ageResCache,
	ageResNumCache,
	balsResNumCache,
	bannedCache,
	bannedIPCache,
	ccBitmaskCache,
	contentTypesBitmaskCache,
	firstCursorCache,
	isDeleted,
	isMax,
	latestCursorCache,
	ninja,
	ninjaPokemonCache,
	ninjaScoreCache,
	ownerIdCache,
	psCache,
	resCountCache,
	sageCache,
	userCached,
	userIPCache,
	varsanCache,
} from "../mylib/cache.js";
import { makeCcUserAvatar, makeCcUserId, makeCcUserName } from "../mylib/cc.js";
import { parseCommand } from "../mylib/command.js";
import { PROD_MODE } from "../mylib/env.js";
import { getIP } from "../mylib/ip.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { isSameSimhash } from "../mylib/simhash.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";

const api = "res";
const coolTimes: Map<number, Date> = new Map();

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		// 共通のバリデーション
		const res = v.safeParse(ResSchema, data, myConfig);
		if (!res.success) return;

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(res.output.threadId);
		if (threadId === null) return;

		// 共通のバリデーション2
		const contentTypesBitmask = contentTypesBitmaskCache.get(threadId) ?? 0;
		if ((contentTypesBitmask & res.output.contentType) === 0) return;
		const schema = contentSchemaMap.get(res.output.contentType);
		if (!schema) return;
		const content = v.safeParse(schema, data, myConfig);
		if (!content.success) return;

		if (isDeleted(threadId)) return;
		if (balsResNumCache.get(threadId)) return;

		const userId = auth.getUserId(socket);
		const isOwner = ownerIdCache.get(threadId) === userId;

		if (isMax(threadId, isOwner)) return;

		// アク禁チェック
		if (bannedCache.get(threadId)?.has(userId)) return;
		if (bannedIPCache.get(threadId)?.has(getIP(socket))) return;

		// simhashチェック
		if (isSameSimhash(content.output.contentText, userId)) return;

		// roomのチェック
		if (
			!exist(io, getThreadRoom(threadId)) ||
			!joined(socket, getThreadRoom(threadId))
		)
			return;

		// レートリミット
		if (isBefore(new Date(), coolTimes.get(userId) ?? 0)) {
			logger.verbose(`⌛ ${coolTimes.get(userId)}`);
			return;
		}

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, res.output.nonce)) {
			logger.verbose(`🔒 ${res.output.nonce}`);
			return;
		}

		// 危険な処理
		let poolClient: PoolClient | null = null;
		try {
			nonce.lock(socket);
			nonce.update(socket);

			if (PROD_MODE) {
				coolTimes.set(userId, addSeconds(new Date(), randInt(8, 32)));
			}

			// pool
			pool.on("error", (error) => {
				throw error;
			});
			poolClient = await pool.connect();

			// 忍法帖の読み込み
			if (!userCached.has(userId)) {
				const { rows, rowCount } = await poolClient.query(
					"SELECT ninja_pokemon, ninja_score FROM users WHERE id = $1",
					[userId],
				);
				if (rowCount === 0) return;
				const record = rows[0];
				userCached.set(userId, true);
				userIPCache.set(userId, getIP(socket));
				ninjaPokemonCache.set(userId, record.ninja_pokemon);
				ninjaScoreCache.set(userId, record.ninja_score);
				ninja(socket);
			}
			const ninjaScore = ninjaScoreCache.get(userId) ?? 0;

			// レス毎ランダムにBAN対象IPを最新化
			flaky(() => userIPCache.set(userId, getIP(socket)));

			// !バルサン
			if (!isOwner && varsanCache.get(threadId) && ninjaScore < 8) return;

			const nextResNum = (resCountCache.get(threadId) ?? 0) + 1;
			resCountCache.set(threadId, nextResNum);

			// cc
			const ccBitmask = ccBitmaskCache.get(threadId) ?? 0;
			const ccUserId = makeCcUserId({
				ccBitmask,
				userId,
				socket,
			});
			const ccUserName = makeCcUserName({
				ccBitmask,
				userName: res.output.userName,
				socket,
				ninja: res.output.ninja,
			});
			const ccUserAvatar = makeCcUserAvatar({
				ccBitmask,
				userAvatar: res.output.userAvatar,
			});

			const parsedResult = await parseCommand({
				ccUserId,
				contentText: content.output.contentText,
				isOwner,
				nextResNum,
				ninjaScore,
				socket,
				threadId,
				userId,
				poolClient,
			});

			await poolClient.query("BEGIN"); // トランザクション開始

			// レスの作成
			const { rows, rowCount } = await poolClient.query(
				[
					`INSERT INTO res (${[
						// 書き込み内容
						"user_id",
						"cc_user_id",
						"cc_user_name",
						"cc_user_avatar",
						"content_text",
						"content_url",
						"content_type",
						"command_result",
						// メタ情報
						"thread_id",
						"num",
						"is_owner",
					].join(",")})`,
					"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
					"RETURNING *",
				].join(" "),
				[
					// 書き込み内容
					userId,
					ccUserId,
					ccUserName,
					ccUserAvatar,
					content.output.contentText,
					content.output.contentUrl,
					content.output.contentType,
					parsedResult.msg,
					// メタ情報
					threadId,
					nextResNum,
					isOwner,
				],
			);
			if (rowCount === 0) return;
			const { id, created_at } = rows[0];
			const resId = encodeResId(id);
			if (resId === null) return;

			const query = new Map();
			if (nextResNum === 2) {
				query.set("first_cursor", id);
				firstCursorCache.set(threadId, id);
			}
			query.set("latest_cursor", id);
			latestCursorCache.set(threadId, id);

			query.set("res_count", nextResNum);

			if (parsedResult.shouldUpdateMeta) {
				query.set("varsan", varsanCache.get(threadId) ?? false);
				query.set("sage", sageCache.get(threadId) ?? false);
				query.set("cc_bitmask", ccBitmaskCache.get(threadId) ?? 0);
				query.set(
					"content_types_bitmask",
					contentTypesBitmaskCache.get(threadId) ?? 0,
				);
				query.set("ps", psCache.get(threadId) ?? "");
				query.set("age_res_num", ageResNumCache.get(threadId) ?? 0);
				query.set("bals_res_num", balsResNumCache.get(threadId) ?? 0);
			}

			const sage = sageCache.get(threadId) || res.output.sage;

			// スレッドの更新
			await poolClient.query(
				[
					`UPDATE threads SET ${sage ? "" : "latest_res_at = NOW(),"}`,
					[...query.keys()].map((v, i) => `${v}=$${i + 1}`).join(","),
					`WHERE id = $${query.size + 1}`,
				].join(" "),
				[...query.values(), threadId],
			);

			const newRes: Res = {
				yours: true,
				// 書き込み内容
				ccUserId,
				ccUserName,
				ccUserAvatar,
				contentText: content.output.contentText,
				contentUrl: content.output.contentUrl,
				contentType: content.output.contentType,
				commandResult: parsedResult.msg,
				// メタ情報
				cursor: resId,
				num: nextResNum,
				createdAt: created_at,
				isOwner,
				sage,
			};

			socket.emit(api, {
				ok: true,
				new: newRes,
				yours: true,
			});
			newRes.yours = false;
			socket.to(getThreadRoom(threadId)).emit(api, {
				ok: true,
				new: newRes,
				yours: false,
			});

			// !age
			let ageRes: Res | null;
			const ageResNum = ageResNumCache.get(threadId) ?? 0;
			if (ageResNum === nextResNum) {
				ageRes = {
					yours: false,
					// 書き込み内容
					ccUserId,
					ccUserName,
					ccUserAvatar,
					contentText: content.output.contentText,
					contentUrl: content.output.contentUrl,
					contentType: content.output.contentType,
					commandResult: parsedResult.msg,
					// メタ情報
					cursor: resId,
					num: nextResNum,
					createdAt: created_at,
					isOwner,
					sage,
				};
				ageResCache.set(threadId, ageRes);
			}

			if (parsedResult.shouldUpdateMeta) {
				// !age
				if (ageResNum > 1 && ageResNum < nextResNum) {
					const { rows, rowCount } = await poolClient.query(
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
							cursor: encodeResId(record.id) ?? "",
							num: record.num,
							createdAt: record.created_at,
							isOwner: record.is_owner,
							sage: record.sage,
						};
						ageResCache.set(threadId, ageRes);
					}
				}

				const newMeta: Meta = {
					// 高度な設定
					varsan: varsanCache.get(threadId) ?? false,
					sage: sageCache.get(threadId) ?? false,
					ccBitmask: ccBitmaskCache.get(threadId) ?? 0,
					contentTypesBitmask: contentTypesBitmaskCache.get(threadId) ?? 0,
					// 動的なデータ
					ps: psCache.get(threadId) ?? "",
					ageResNum,
					ageRes: ageResCache.get(threadId) ?? null,
					balsResNum: balsResNumCache.get(threadId) ?? 0,
				};
				io.to(getThreadRoom(threadId)).emit("updateMeta", {
					ok: true,
					new: newMeta,
				});
			}

			await poolClient.query("COMMIT"); // 問題なければコミット
			logger.verbose(api);
		} catch (error) {
			await poolClient?.query("ROLLBACK"); // エラーが発生した場合はロールバック
			logger.error(error);
		} finally {
			nonce.unlock(socket);
			poolClient?.release();
		}
	});
};

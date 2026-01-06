import type { PoolClient } from "@neondatabase/serverless";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { boardIdMap } from "../../common/request/board.js";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import {
	ResSchema,
	myConfig,
	unjBeginDate,
} from "../../common/request/schema.js";
import type {
	HeadlineThread,
	Meta,
	Player,
	Res,
} from "../../common/response/schema.js";
import {
	decodeThreadId,
	encodeThreadId,
	encodeUserId,
	flaky,
} from "../mylib/anti-debug.js";
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
	goodCountCache,
	isDeleted,
	isMax,
	lolCountCache,
	ninja,
	ninjaPokemonCache,
	ninjaScoreCache,
	ownerIdCache,
	psCache,
	resCountCache,
	sageCache,
	threadCached,
	titleCache,
	userCached,
	userIPCache,
	varsanCache,
} from "../mylib/cache.js";
import { makeCcUserAvatar, makeCcUserId, makeCcUserName } from "../mylib/cc.js";
import { parseCommand } from "../mylib/command.js";
import { getIP } from "../mylib/ip.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { pool } from "../mylib/pool.js";
import { doppelgangers, humans } from "../mylib/rpg.js";
import { isSameSimhash } from "../mylib/simhash.js";
import {
	broadcastLimit,
	exist,
	getHeadlineRoom,
	getThreadRoom,
	joined,
	sizeOf,
} from "../mylib/socket.js";
import { TokenBucket } from "../mylib/token-bucket.js";

const api = "res";
const tokenBucket = new TokenBucket({
	capacity: 3, // burstあり（最大3回連投可能）
	refillRate: 1 / 5, // 5秒で1トークン回復
	costPerAction: 1,
});

export default ({ socket, io }: { socket: Socket; io: Server }) => {
	socket.on(api, async (data) => {
		const res = v.safeParse(ResSchema, data, myConfig);
		if (!res.success) return;

		// Nonce値の完全一致チェック
		if (!nonce.isValid(socket, res.output.nonce)) {
			logger.verbose(`🔒 ${res.output.nonce}`);
			return;
		}

		// フロントエンド上のスレッドIDを復号する
		const threadId = decodeThreadId(res.output.threadId);
		if (threadId === null) return;

		const contentTypesBitmask = contentTypesBitmaskCache.get(threadId) ?? 0;
		if ((contentTypesBitmask & res.output.contentType) === 0) return;
		const schema = contentSchemaMap.get(res.output.contentType);
		if (!schema) return;
		const content = v.safeParse(schema, data, myConfig);
		if (!content.success) return;

		const board = boardIdMap.get(boardIdCache.get(threadId) ?? 0);
		if (!board) return;
		if (!board.avatarMap.has(res.output.userAvatar)) return;

		if (isDeleted(threadId)) return;
		if (balsResNumCache.get(threadId)) return;

		const userId = auth.getUserId(socket);
		const isOwner = ownerIdCache.get(threadId) === userId;

		if (isMax(threadId, isOwner)) return;

		// アク禁チェック
		if (!(isOwner && content.output.contentText.includes("!kaijo"))) {
			if (bannedCache.get(threadId)?.has(userId)) return;
			if (bannedIPCache.get(threadId)?.has(getIP(socket))) return;
		}

		// roomのチェック
		if (
			!exist(io, getThreadRoom(threadId)) ||
			!joined(socket, getThreadRoom(threadId))
		)
			return;

		// simhashチェック
		if (isSameSimhash(content.output.contentText, userId)) return;

		// レートリミット
		if (!tokenBucket.attempt(userId)) {
			logger.verbose(`⌛ ${tokenBucket.getCooldownSeconds(userId).toFixed(1)}`);
			return;
		}

		// 危険な処理
		let poolClient: PoolClient | null = null;
		try {
			nonce.lock(socket);
			nonce.update(socket);

			poolClient = await pool.connect();

			// 忍法帖の読み込み
			if (!userCached.has(userId)) {
				userCached.set(userId, true);
				const { rows, rowCount } = await poolClient.query(
					"SELECT ninja_pokemon, ninja_score FROM users WHERE id = $1",
					[userId],
				);
				if (rowCount === 0) return;
				const record = rows[0];

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
				boardId: board.id,
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

			const sage = sageCache.get(threadId) || res.output.sage;

			await poolClient.query("BEGIN"); // トランザクション開始

			// レスの作成
			const { rows, rowCount } = await poolClient.query(
				[
					`INSERT INTO res (${[
						"thread_id",
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
						"is_owner",
						"sage",
						"ip",
						"num",
					].join(",")})`,
					"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,",
					"(SELECT COALESCE(MAX(num), 1) + 1 FROM res WHERE thread_id = $1)",
					")",
					"RETURNING *",
				].join(" "),
				[
					threadId,
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
					isOwner,
					sage,
					getIP(socket),
				],
			);
			if (rowCount === 0) return;
			const { created_at, num } = rows[0];

			const query = new Map();

			query.set("res_count", num);

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

			const latestRes = content.output.contentText || content.output.contentUrl;
			query.set("latest_res", latestRes);

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

			// ヘッドライン更新
			if (threadCached.has(threadId)) {
				const createdAt = createdAtCache.get(threadId) ?? new Date(0);
				const newHeadline: HeadlineThread = {
					// 書き込み内容
					ccUserId,
					// メタ情報
					id: encodeThreadId(threadId) ?? "",
					latestRes,
					latestResAt: new Date(),
					resCount: nextResNum,
					// 基本的な情報
					title: titleCache.get(threadId) ?? "",
					boardId: board.id,
					// 動的なデータ
					online: sizeOf(io, getThreadRoom(threadId)),
					ikioi:
						Math.floor((nextResNum * 3600_000_0) / (Date.now() - +createdAt)) /
						10,
					lolCount: lolCountCache.get(threadId) ?? 0,
					goodCount: goodCountCache.get(threadId) ?? 0,
					badCount: badCountCache.get(threadId) ?? 0,
				};

				// ヘッドラインの更新を全体通知
				if (io.sockets.sockets.size >= broadcastLimit) {
					socket
						.to(getHeadlineRoom(board.id))
						.emit("newHeadline", { ok: true, new: newHeadline, yours: false });
				} else {
					io.emit("newHeadline", {
						ok: true,
						new: newHeadline,
						yours: false,
					});
				}
			}

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
					num: nextResNum,
					createdAt: created_at,
					isOwner,
					sage,
				};
				ageResCache.set(threadId, ageRes);
			}

			if (parsedResult.shouldUpdateMeta) {
				// !age
				if (ageResNum !== nextResNum) {
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
					} else if (ageResNum < nextResNum) {
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
								num: record.num,
								createdAt: record.created_at,
								isOwner: record.is_owner,
								sage: record.sage,
							};
							ageResCache.set(threadId, ageRes);
						}
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

			// RPG
			if (humans.has(userId)) {
				const human = humans.get(userId);
				if (human) {
					const msg = content.output.contentText;
					if (msg.length > 64) {
						human.msg = `${msg.slice(0, 64)}…`;
					} else {
						human.msg = msg;
					}
					const m = doppelgangers.get(threadId);
					if (!m) return;
					const d = m.get(userId);
					if (!d) return;
					const player: Player = {
						userId: encodeUserId(userId, unjBeginDate) ?? "",
						sAnimsId: d.human.sAnimsId,
						msg: d.human.msg,
						x: d.x,
						y: d.y,
						direction: d.direction,
						updatedAt: d.updatedAt,
					};
					io.to(getThreadRoom(threadId)).emit("rpgPatch", {
						ok: true,
						player,
					});
				}
			}

			await poolClient.query("COMMIT"); // 問題なければコミット
			logger.verbose(api);
		} catch (error) {
			await poolClient?.query("ROLLBACK"); // エラーが発生した場合はロールバック
			logger.error(error);
		} finally {
			poolClient?.release();
			nonce.unlock(socket);
		}
	});
};

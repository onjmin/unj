// pool
import { Pool, type PoolClient, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { NEON_DATABASE_URL, PROD_MODE } from "../mylib/env.js";
neonConfig.webSocketConstructor = ws;

import { addMinutes, addSeconds, isBefore } from "date-fns";
import type { Server, Socket } from "socket.io";
import * as v from "valibot";
import { contentSchemaMap } from "../../common/request/content-schema.js";
import { ResSchema } from "../../common/request/schema.js";
import type { Res } from "../../common/response/schema.js";
import { randInt } from "../../common/util.js";
import { decodeThreadId, encodeResId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import {
	balseCache,
	ccBitmaskCache,
	contentTypesBitmaskCache,
	isDeleted,
	isMax,
	ninja,
	ninjaPokemonCache,
	ninjaScoreCache,
	ownerIdCache,
	resCountCache,
	sageCache,
	userCached,
	varsanCache,
} from "../mylib/cache.js";
import { makeCcUserAvatar, makeCcUserId, makeCcUserName } from "../mylib/cc.js";
import { getIP } from "../mylib/ip.js";
import { logger } from "../mylib/log.js";
import nonce from "../mylib/nonce.js";
import { exist, getThreadRoom, joined } from "../mylib/socket.js";
import { coolTimes as makeThreadCoolTimes } from "./makeThread.js";

const api = "res";
const coolTimes: Map<number, Date> = new Map();

const delay = 1000 * 60 * 4; // Glitchは5分放置でスリープする
const neet: Map<number, NodeJS.Timeout> = new Map();
const lazyUpdate = (userId: number, ninjaScore: number, ip: string) => {
	clearTimeout(neet.get(userId));
	const id = setTimeout(async () => {
		// pool
		const pool = new Pool({ connectionString: NEON_DATABASE_URL });
		pool.on("error", (error) => {
			logger.error(error);
		});
		const poolClient = await pool.connect();
		await poolClient.query(
			"UPDATE users SET updated_at = NOW(), ip = $1, ninja_score = $2 WHERE id = $3",
			[ip, ninjaScore, userId],
		);
	}, delay);
	neet.set(userId, id);
};

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

		if (isDeleted(threadId)) {
			return;
		}

		const userId = auth.getUserId(socket);
		const isOwner = ownerIdCache.get(threadId) === userId;

		if (isMax(threadId, isOwner)) {
			return;
		}

		// roomのチェック
		if (
			!exist(io, getThreadRoom(threadId)) ||
			!joined(socket, getThreadRoom(threadId))
		) {
			return;
		}

		// 投稿許可されたコンテンツなのか
		const contentTypesBitmask = contentTypesBitmaskCache.get(threadId) ?? 0;
		if ((contentTypesBitmask & res.output.contentType) === 0) {
			return;
		}

		// 偽装されたコンテンツなのか
		const schema = contentSchemaMap.get(res.output.contentType);
		if (!schema) {
			return;
		}
		const contentResult = v.safeParse(schema, data);
		if (!contentResult.success) {
			return;
		}

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
			const pool = new Pool({ connectionString: NEON_DATABASE_URL });
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
				if (rowCount === 0) {
					return;
				}
				const { ninja_pokemon, ninja_score } = rows[0];
				userCached.set(userId, true);
				ninjaPokemonCache.set(userId, ninja_pokemon);
				ninjaScoreCache.set(userId, ninja_score);
				ninja(socket);
			}
			let ninjaScore = ninjaScoreCache.get(userId) ?? 0;
			const _ninjaLv = (ninjaScore ** (1 / 3)) | 0;
			let ninjaLv = _ninjaLv;

			// !バルサン
			if (!isOwner && varsanCache.get(threadId) && ninjaScore < 256) {
				return;
			}

			// コマンドの解釈
			let commandResult = "";
			const cmds = contentResult.output.content.match(/![^!\s]+/g);
			if (cmds && cmds.length < 8) {
				const results = [];
				for (const cmd of new Set(cmds)) {
					if (isOwner) {
						switch (cmd) {
							case "!aku":
								break;
							case "!kaijo":
								break;
							case "!reset":
								break;
							case "!バルサン":
								results.push(
									"！荒らし撃退呪文『バルサン』発動！\nしばらくの間、忍法帖lv4未満による投稿を禁ず。。",
								);
								varsanCache.set(threadId, true);
								break;
							case "!sage":
								{
									const sage = !sageCache.get(threadId);
									sageCache.set(threadId, sage);
									results.push(sage ? "強制sage" : "強制sage解除");
								}
								break;
							case "!jien":
								break;
							case "!ngk":
								break;
							case "!nopic":
								{
									const contentTypesBitmask =
										contentTypesBitmaskCache.get(threadId);
									// sageCache.set(threadId, sage);
									results.push(
										"！画像禁止『nopic』発動！\nしばらくの間、画像投稿を禁ず。。",
									);
								}
								break;
							case "!add":
								break;
							case "!age":
								break;
							case "!バルス":
								if (ninjaLv < 3) {
									results.push(
										`禁断呪文バルス発動失敗。。忍法帖のレベル不足。(lv:${ninjaLv})`,
									);
									break;
								}
								ninjaLv -= 2;
								results.push(
									"！禁断呪文バルス発動！\nこのスレは崩壊しますた。。",
								);
								balseCache.set(threadId, true);
								makeThreadCoolTimes.set(
									userId,
									addMinutes(new Date(), randInt(120, 180)),
								);
								break;
						}
					}
					switch (cmd) {
						case "!ping":
							results.push("pong");
							break;
						case "!check":
							if (ninjaLv < 2) break;
							ninjaLv--;
							break;
					}
				}
				commandResult = results.map((v) => `★${v}`).join("\n");
			}

			if (_ninjaLv !== ninjaLv) {
				ninjaScore = ninjaLv ** 3;
				commandResult = `(lv:${_ninjaLv}→${ninjaLv})`;
			} else {
				ninjaScore++;
			}

			// コマンド実行後に反映
			lazyUpdate(userId, ninjaScore, getIP(socket));
			ninjaScoreCache.set(userId, ninjaScore);
			ninja(socket);

			const ccBitmask = ccBitmaskCache.get(threadId) ?? 0;
			const ccUserId = makeCcUserId(ccBitmask, userId);
			const ccUserName = makeCcUserName(ccBitmask, res.output.userName);
			const ccUserAvatar = makeCcUserAvatar(ccBitmask, res.output.userAvatar);

			if (isMax(threadId, isOwner)) {
				return;
			}

			const next = (resCountCache.get(threadId) ?? 0) + 1;
			resCountCache.set(threadId, next);

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
						"content",
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
					contentResult.output.content,
					contentResult.output.contentUrl,
					contentResult.output.contentType,
					commandResult,
					// メタ情報
					threadId,
					next,
					isOwner,
				],
			);
			if (rowCount === 0) {
				return;
			}
			const { id, created_at } = rows[0];
			const resId = encodeResId(id);
			if (resId === null) {
				return;
			}

			const sage = sageCache.get(threadId) || res.output.sage;

			// スレッドの更新
			// TODO: スレ主による高度な設定の更新なども
			await poolClient.query(
				[
					`UPDATE threads SET${sage ? "" : " latest_res_at = NOW(),"}`,
					"res_count = $1",
					"WHERE id = $2",
				].join(" "),
				[next, threadId],
			);

			const newRes: Res = {
				yours: true,
				// 書き込み内容
				ccUserId,
				ccUserName,
				ccUserAvatar,
				content: contentResult.output.content,
				contentUrl: contentResult.output.contentUrl,
				contentType: contentResult.output.contentType,
				commandResult,
				// メタ情報
				id: resId,
				num: next,
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

			await poolClient.query("COMMIT"); // 問題なければコミット
			logger.verbose(api);
		} catch (error) {
			await poolClient?.query("ROLLBACK"); // エラーが発生した場合はロールバック
			logger.error(error);
		} finally {
			nonce.unlock(socket);
		}
	});
};

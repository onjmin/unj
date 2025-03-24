// pool
import { Pool, type PoolClient, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { NEON_DATABASE_URL, PROD_MODE } from "../mylib/env.js";
neonConfig.webSocketConstructor = ws;

import { addMinutes } from "date-fns";
import type { Socket } from "socket.io";
import { randInt } from "../../common/util.js";
import { coolTimes as makeThreadCoolTimes } from "../api/makeThread.js";
import {
	ageResCache,
	ageResNumCache,
	balsResNumCache,
	bannedCache,
	bannedIPCache,
	ccBitmaskCache,
	contentTypesBitmaskCache,
	ninja,
	ninjaScoreCache,
	psCache,
	sageCache,
	subbedCache,
	userIPCache,
	varsanCache,
} from "../mylib/cache.js";
import { getIP } from "../mylib/ip.js";
import { logger } from "../mylib/log.js";
import { flaky } from "./anti-debug.js";

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

type ParsedResult = {
	msg: string;
	shouldUpdateMeta: boolean;
};

type Ref = {
	num: number;
	isOwner: boolean;
	userId: number;
};

export const parseCommand = async ({
	contentText,
	isOwner,
	nextResNum,
	ninjaScore,
	socket,
	threadId,
	userId,
	poolClient,
}: {
	contentText: string;
	isOwner: boolean;
	nextResNum: number;
	ninjaScore: number;
	socket: Socket;
	threadId: number;
	userId: number;
	poolClient: PoolClient;
}): Promise<ParsedResult> => {
	const _ninjaLv = (ninjaScore ** (1 / 3)) | 0;
	let ninjaLv = _ninjaLv;

	const fetchRefArray = (() => {
		let result: Ref[] | null = null;
		return async (anka: number[]): Promise<Ref[] | null> => {
			if (result !== null) return result;
			const { rows } = await poolClient.query(
				`SELECT num,is_owner,user_id FROM res WHERE thread_id = $1 AND num IN (${anka.join(",")})`,
				[threadId],
			);
			// 重複排除
			const arr: Ref[] = [];
			const set = new Set();
			for (const record of rows) {
				if (set.has(record.user_id)) continue;
				set.add(record.user_id);
				arr.push({
					num: record.num,
					isOwner: record.is_owner,
					userId: record.user_id,
				});
			}
			result = arr;
			return result;
		};
	})();

	// コマンドの解釈
	let msg = "";
	let shouldUpdateMeta = false;
	const cmds = contentText.replace(/！/g, "!").match(/![^!\s]+/g);
	const withoutCmds = contentText
		.replace(/！/g, "!")
		.replace(/![^!\s]+/g, "")
		.trim();
	const isModerator = isOwner || subbedCache.get(threadId)?.has(userId);
	if (cmds && cmds.length < 4) {
		const results = [];
		const anka = contentText
			.match(/>>[0-9]{1,4}/g)
			?.map((v) => v.slice(2))
			.map(Number)
			.filter((v) => !Number.isNaN(v))
			.filter((v) => v > 0 && v < 1024);
		for (const cmd of new Set(cmds)) {
			if (isOwner) {
				switch (cmd) {
					case "!reset":
						bannedCache.get(threadId)?.clear();
						bannedIPCache.get(threadId)?.clear();
						subbedCache.get(threadId)?.clear();
						results.push("すべての副主＆akuを解除");
						break;
					case "!sage":
						{
							const sage = !sageCache.get(threadId);
							sageCache.set(threadId, sage);
							results.push(sage ? "強制sage発動" : "強制sage解除");
						}
						shouldUpdateMeta = true;
						break;
					case "!jien":
						{
							const bit = (ccBitmaskCache.get(threadId) ?? 0) ^ 2;
							ccBitmaskCache.set(threadId, bit);
							results.push(
								bit & 2 ? "自演防止モード発動" : "自演防止モード解除",
							);
						}
						shouldUpdateMeta = true;
						break;
					case "!add":
						{
							const ps = psCache.get(threadId) ?? "";
							psCache.set(threadId, withoutCmds);
							if (withoutCmds.length) {
								results.push(`>>1に追記(${ps.length ? "上書き" : "1回目"})`);
							} else {
								results.push(">>1の追記を削除");
							}
						}
						shouldUpdateMeta = true;
						break;
					case "!バルス":
						if (ninjaLv < 3) {
							results.push(
								`禁断呪文バルス発動失敗。。忍法帖のレベル不足。(lv:${ninjaLv})`,
							);
							break;
						}
						ninjaLv -= 2;
						results.push("！禁断呪文バルス発動！\nこのスレは崩壊しますた。。");
						balsResNumCache.set(threadId, nextResNum);
						if (PROD_MODE) {
							makeThreadCoolTimes.set(
								userId,
								addMinutes(new Date(), randInt(120, 180)),
							);
						}
						shouldUpdateMeta = true;
						break;
				}
			}
			switch (cmd) {
				// 副主権限が必要なコマンド
				case "!aku":
					{
						if (!isModerator) break;
						if (!anka) break;
						if (anka.length > 8) break;
						const refArray = await fetchRefArray([...new Set(anka)]);
						const cache1 = bannedCache.get(threadId);
						const cache2 = bannedIPCache.get(threadId);
						if (!refArray || !refArray.length || !cache1 || !cache2) break;
						if (!isOwner && refArray.some((v) => v.isOwner)) {
							subbedCache.get(threadId)?.delete(userId);
							results.push("▼無念：副は主をアクできぬい（副解雇の刑に処する）");
							break;
						}
						const banned = [];
						for (const ref of refArray) {
							cache1.add(ref.userId);
							cache2.add(userIPCache.get(ref.userId) ?? "");
							banned.push(ref.num);
						}
						results.push(
							`アク禁${isOwner ? "" : "(副)"}：${banned.map((v) => `>>${v}`).join(" ")}`,
						);
					}
					break;
				case "!kaijo":
					{
						if (!isModerator) break;
						if (!anka) break;
						if (anka.length > 8) break;
						const refArray = await fetchRefArray([...new Set(anka)]);
						const cache1 = bannedCache.get(threadId);
						const cache2 = bannedIPCache.get(threadId);
						if (!refArray || !refArray.length || !cache1 || !cache2) break;
						const banned = [];
						for (const ref of refArray) {
							cache1.delete(ref.userId);
							cache2.delete(userIPCache.get(ref.userId) ?? "");
							banned.push(ref.num);
						}
						results.push(
							`アク禁解除${isOwner ? "" : "(副)"}：${banned.map((v) => `>>${v}`).join(" ")}`,
						);
					}
					break;
				case "!sub":
					{
						if (!isModerator) break;
						if (!anka) break;
						if (anka.length > 8) break;
						const refArray = await fetchRefArray([...new Set(anka)]);
						const cache = subbedCache.get(threadId);
						if (!refArray || !refArray.length || !cache) break;
						const added = [];
						const removed = [];
						for (const ref of refArray) {
							if (cache.has(ref.userId)) {
								cache.delete(ref.userId);
								removed.push(ref.userId);
							} else {
								cache.add(ref.userId);
								added.push(ref.userId);
							}
						}
						if (added.length) {
							results.push(`副主に追加${added.map((v) => `>>${v}`).join(" ")}`);
						}
						if (removed.length) {
							results.push(
								`副主を解雇${removed.map((v) => `>>${v}`).join(" ")}`,
							);
						}
					}
					break;
				case "!バルサン":
					{
						if (!isModerator) break;
						const varsan = !varsanCache.get(threadId);
						varsanCache.set(threadId, varsan);
						results.push(
							varsan
								? "！荒らし撃退呪文『バルサン』発動！\nしばらくの間、忍法帖lv4未満による投稿を禁ず。。"
								: "バルサンを解除した",
						);
					}
					shouldUpdateMeta = true;
					break;
				case "!ngk":
					{
						if (!isModerator) break;
						const bit = (ccBitmaskCache.get(threadId) ?? 0) ^ 4;
						ccBitmaskCache.set(threadId, bit);
						results.push(bit & 4 ? "コテ禁止発動" : "コテ禁止解除");
					}
					shouldUpdateMeta = true;
					break;
				case "!nopic":
					{
						if (!isModerator) break;
						const picbit = 8 | 16;
						let bit = contentTypesBitmaskCache.get(threadId) ?? 0;
						if (bit & picbit) {
							bit &= ~picbit;
						} else {
							bit |= picbit;
						}
						contentTypesBitmaskCache.set(threadId, bit);
						results.push(
							bit & picbit
								? "！画像禁止『nopic』発動！\nしばらくの間、画像投稿を禁ず。。"
								: "画像禁止を解除した",
						);
					}
					shouldUpdateMeta = true;
					break;
				case "!age":
					{
						if (!isModerator) break;
						if (!anka) break;
						if (anka.length > 1) break;
						const num = anka[0];
						const setNum = ageResNumCache.get(threadId) === num ? 0 : num;
						ageResNumCache.set(threadId, setNum);
						ageResCache.set(threadId, null);
						results.push(
							setNum !== 0 ? `[${num}]をage` : `[${num}]のageを解除`,
						);
					}
					shouldUpdateMeta = true;
					break;
				// 副主権限が不要なコマンド
				case "!ping":
					results.push("pong");
					break;
				case "!check":
					if (ninjaLv < 2) break;
					ninjaLv--;
					break;
			}
		}
		msg = results.map((v) => (v[0] === "▼" ? v : `★${v}`)).join("\n");
	}

	let next = ninjaScore;
	if (_ninjaLv !== ninjaLv) {
		next = ninjaLv ** 3;
		msg += `(lv:${_ninjaLv}→${ninjaLv})`;
	} else {
		flaky(() => next++);
	}

	// コマンド実行後に反映
	lazyUpdate(userId, next, getIP(socket));
	ninjaScoreCache.set(userId, next);
	ninja(socket);

	return { msg, shouldUpdateMeta };
};

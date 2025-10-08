import type { PoolClient } from "@neondatabase/serverless";
import type { Socket } from "socket.io";
import { Enum, ankaRegex } from "../../common/request/content-schema.js";
import { tokenBucket } from "../api/makeThread.js";
import {
	ageResCache,
	ageResNumCache,
	balsResNumCache,
	bannedCache,
	bannedIPCache,
	ccBitmaskCache,
	ccUserIdCache,
	contentTypesBitmaskCache,
	ninja,
	ninjaScoreCache,
	ownerIpCache,
	psCache,
	sageCache,
	subbedCache,
	userIPCache,
	userIdCache,
	varsanCache,
} from "../mylib/cache.js";
import { getIP, sliceIPRange } from "../mylib/ip.js";
import { pool } from "../mylib/pool.js";
import { flaky } from "./anti-debug.js";

const delay = 1000 * 60 * 4; // Glitchは5分放置でスリープする
const neet: Map<number, NodeJS.Timeout> = new Map();
const lazyUpdate = (userId: number, ninjaScore: number, ip: string) => {
	clearTimeout(neet.get(userId));
	const id = setTimeout(async () => {
		await pool.query(
			"UPDATE users SET updated_at = NOW(), ip = $1, ninja_score = $2 WHERE id = $3",
			[ip, ninjaScore, userId],
		);
	}, delay);
	neet.set(userId, id);
};

const fetchUserIP = async (
	userId: number,
	poolClient: PoolClient,
): Promise<string | null> => {
	const { rows, rowCount } = await poolClient.query(
		"SELECT ip FROM users WHERE id = $1",
		[userId],
	);
	return rowCount ? rows[0].ip : null;
};

type ParsedResult = {
	msg: string;
	shouldUpdateMeta: boolean;
};

type Ref = {
	userId: number;
	num: number;
	ip: string;
	isOwner: boolean;
	ccUserId: string;
};

export const parseCommand = async ({
	ccUserId,
	contentText,
	isOwner,
	nextResNum,
	ninjaScore,
	socket,
	threadId,
	userId,
	poolClient,
}: {
	ccUserId: string;
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
		const cache: Map<string, Ref[]> = new Map();
		return async (anka: number[]): Promise<Ref[] | null> => {
			const query = anka.join(",");
			if (cache.has(query)) return cache.get(query) ?? null;

			// 重複排除
			const arr: Ref[] = [];
			const set: Set<number> = new Set();

			if (anka.includes(1)) {
				const userId = userIdCache.get(threadId) ?? 0;
				set.add(userId);
				arr.push({
					userId,
					num: 1,
					ip: ownerIpCache.get(threadId) ?? "0.0.0.0",
					isOwner: true,
					ccUserId: ccUserIdCache.get(threadId) ?? "",
				});
			}
			const without1 = anka.filter((v) => v !== 1);
			if (without1.length) {
				const { rows } = await poolClient.query(
					`SELECT num,ip,is_owner,user_id,cc_user_id FROM res WHERE thread_id = $1 AND num IN (${without1.map((v, i) => `$${i + 2}`).join(",")})`,
					[threadId, ...without1],
				);
				for (const record of rows) {
					const userId = record.user_id;
					if (set.has(userId)) continue;
					set.add(userId);
					arr.push({
						userId,
						num: record.num,
						ip: record.ip,
						isOwner: record.is_owner,
						ccUserId: record.cc_user_id,
					});
				}
			}
			cache.set(query, arr);
			return arr;
		};
	})();

	const isValidRangeAnka = (n: number) => !Number.isNaN(n) && n > 0 && n < 1024;

	// コマンドの解釈
	let msg = "";
	let shouldUpdateMeta = false;
	const str = contentText.replace(/！/g, "!");
	const cmds = str.match(/![^!\s]+/g);
	const withoutCmds = str.replace(/![^!\s]+/g, "").trim();
	const isModerator = isOwner || subbedCache.get(threadId)?.has(userId);
	if (cmds && cmds.length < 8) {
		const results = [];
		const multiAnka = str
			.match(ankaRegex)
			?.map((v) => v.slice(2))
			.map(Number)
			.filter(isValidRangeAnka);
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
						tokenBucket.applyLongRandomLimit(userId);
						shouldUpdateMeta = true;
						break;
				}
			}
			const oneAnka = cmd.match(/[0-9]{1,4}/)?.[0] ?? null;
			switch (oneAnka ? cmd.replace(oneAnka, "") : cmd) {
				// 副主権限が必要なコマンド
				case "!aku":
					{
						if (!isModerator) break;
						let anka: number[];
						if (oneAnka !== null) {
							const n = Number(oneAnka);
							if (!isValidRangeAnka(n)) break;
							anka = [n];
						} else if (multiAnka && multiAnka.length < 8) {
							anka = multiAnka;
						} else break;
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
						let anka: number[];
						if (oneAnka !== null) {
							const n = Number(oneAnka);
							if (!isValidRangeAnka(n)) break;
							anka = [n];
						} else if (multiAnka && multiAnka.length < 8) {
							anka = multiAnka;
						} else break;
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
						let anka: number[];
						if (oneAnka !== null) {
							const n = Number(oneAnka);
							if (!isValidRangeAnka(n)) break;
							anka = [n];
						} else if (multiAnka && multiAnka.length < 8) {
							anka = multiAnka;
						} else break;
						const refArray = await fetchRefArray([...new Set(anka)]);
						const cache = subbedCache.get(threadId);
						if (!refArray || !refArray.length || !cache) break;
						const added = [];
						const removed = [];
						for (const ref of refArray) {
							if (cache.has(ref.userId)) {
								cache.delete(ref.userId);
								removed.push(ref.num);
							} else {
								cache.add(ref.userId);
								added.push(ref.num);
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
						const picbit = Enum.Image | Enum.Gif;
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
						if (!multiAnka) break;
						if (multiAnka.length > 1) break;
						const num = multiAnka[0];
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
					{
						if (ninjaLv < 2) break;
						const refArray = await fetchRefArray([...new Set(multiAnka)]);
						if (!refArray || !refArray.length) break;
						const ref = refArray[0];
						let userIP1: string | null = userIPCache.get(ref.userId) ?? null;
						if (!userIP1) userIP1 = ref.ip;
						if (!userIP1) userIP1 = await fetchUserIP(ref.userId, poolClient);
						if (!userIP1 || userIP1 === "0.0.0.0") break;
						let userIP2: string | null = userIPCache.get(userId) ?? null;
						if (!userIP2) userIP2 = await fetchUserIP(userId, poolClient);
						if (!userIP2 || userIP2 === "0.0.0.0") break;
						const tests = [];
						tests.push(userIP1 === userIP2 ? "〇IP同一" : "×IP別人");
						tests.push(ref.userId === userId ? "〇UID同一" : "×UID別人");
						tests.push(ref.ccUserId === ccUserId ? "〇ID同一" : "×ID別人");
						tests.push(
							sliceIPRange(userIP1) === sliceIPRange(userIP2)
								? "〇プロバイダ同一"
								: "×プロバイダ別人",
						);
						const score = tests.filter((v) => /同一/.test(v)).length;
						let msg = "";
						if (score >= 4) msg = "100%同一人物デス。";
						else if (score >= 3) msg = "同一ノ可能性高メデス。";
						else msg = "別回線、デス。";
						results.push(
							`🤖判定：${tests.join("、")}\n＜${msg}\nご利用アリガトウゴザイマシタ`,
						);
						ninjaLv--;
					}
					break;
			}
		}
		msg = results.map((v) => (v[0] === "▼" ? v : `★${v}`)).join("\n");
	}

	let next = ninjaScore;
	if (_ninjaLv !== ninjaLv) {
		next = ninjaLv ** 3 + 1;
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

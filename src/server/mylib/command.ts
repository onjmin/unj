// pool
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { NEON_DATABASE_URL, PROD_MODE } from "../mylib/env.js";
neonConfig.webSocketConstructor = ws;

import { addMinutes } from "date-fns";
import type { Socket } from "socket.io";
import { randInt } from "../../common/util.js";
import { coolTimes as makeThreadCoolTimes } from "../api/makeThread.js";
import {
	balsResNumCache,
	ccBitmaskCache,
	contentTypesBitmaskCache,
	ninja,
	ninjaScoreCache,
	sageCache,
	varsanCache,
} from "../mylib/cache.js";
import { getIP } from "../mylib/ip.js";
import { logger } from "../mylib/log.js";

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

export const parseCommand = ({
	content,
	isOwner,
	nextResNum,
	ninjaScore,
	socket,
	threadId,
	userId,
}: {
	content: string;
	isOwner: boolean;
	nextResNum: number;
	ninjaScore: number;
	socket: Socket;
	threadId: number;
	userId: number;
}): ParsedResult => {
	const _ninjaLv = (ninjaScore ** (1 / 3)) | 0;
	let ninjaLv = _ninjaLv;

	// コマンドの解釈
	let msg = "";
	let shouldUpdateMeta = false;
	const cmds = content.replace(/！/g, "!").match(/![^!\s]+/g);
	if (cmds && cmds.length < 4) {
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
						{
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
					case "!ngk":
						{
							const bit = (ccBitmaskCache.get(threadId) ?? 0) ^ 4;
							ccBitmaskCache.set(threadId, bit);
							results.push(bit & 4 ? "コテ禁止発動" : "コテ禁止解除");
						}
						shouldUpdateMeta = true;
						break;
					case "!nopic":
						{
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
				case "!ping":
					results.push("pong");
					break;
				case "!check":
					if (ninjaLv < 2) break;
					ninjaLv--;
					break;
			}
		}
		msg = results.map((v) => `★${v}`).join("\n");
	}

	let next = ninjaScore;
	if (_ninjaLv !== ninjaLv) {
		next = ninjaLv ** 3;
		msg += `(lv:${_ninjaLv}→${ninjaLv})`;
	} else {
		next++;
	}

	// コマンド実行後に反映
	lazyUpdate(userId, next, getIP(socket));
	ninjaScoreCache.set(userId, next);
	ninja(socket);

	return { msg, shouldUpdateMeta };
};

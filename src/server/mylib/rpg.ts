import { Direction } from "@rpgja/rpgen-map";
import { addMinutes, isAfter } from "date-fns";
import { HEIGHT, WIDTH } from "../../common/request/rpg-schema.js";
import { randInt } from "../../common/util.js";
import { getJstDate, hmacCcId } from "./cc.js";

export const humans: Map<number, Human> = new Map();
export const doppelgangers: Map<number, Map<number, Doppelganger>> = new Map();

export class Human {
	sAnimsId;
	constructor() {
		this.sAnimsId = 0;
	}
}

export class Doppelganger {
	x;
	y;
	direction: number;
	updatedAt: Date;
	msg: string; // 吹き出し。別スレの書き込みで紐付けられないようスレ単位で持つ
	constructor(public human: Human) {
		this.human = human;
		this.x = randInt(0, WIDTH - 1);
		this.y = randInt(0, HEIGHT - 1);
		this.direction = Direction.South;
		this.updatedAt = new Date();
		this.msg = "";
	}
}

/**
 * フロントエンドに晒すユーザー識別子
 * スレ・日ごとに変わる鍵付きハッシュなので、別スレ・別日の同一人物とは紐付けられない
 */
export const genRpgUserId = (userId: number, threadId: number): string =>
	hmacCcId(["rpg", userId, threadId, getJstDate()].join("###"))
		.toString("hex")
		.slice(0, 16);

const threadsLimit = 256; // doppelgangersに保持するスレ数の上限
const humansLimit = 4096;
const threadsPerUser = 3; // 1人がドッペルゲンガーを置けるスレ数（socket.tsのlimitByUserIdと同じ）

/**
 * 期限切れ（4分）のドッペルゲンガーと空のスレ、どこにもいないHumanを掃除する
 */
const sweep = () => {
	const now = new Date();
	const alive: Set<number> = new Set();
	for (const [threadId, m] of doppelgangers) {
		for (const [userId, d] of m) {
			if (isAfter(now, addMinutes(d.updatedAt, 4))) m.delete(userId);
			else alive.add(userId);
		}
		if (m.size === 0) doppelgangers.delete(threadId);
	}
	for (const userId of humans.keys()) {
		if (!alive.has(userId)) humans.delete(userId);
	}
};

/**
 * スレのドッペルゲンガー一覧を取得（無ければ作る）。上限に達していればnull
 */
export const prepareDoppelgangers = (
	threadId: number,
): Map<number, Doppelganger> | null => {
	if (doppelgangers.size >= threadsLimit || humans.size >= humansLimit) {
		sweep();
	}
	let m = doppelgangers.get(threadId);
	if (!m) {
		if (doppelgangers.size >= threadsLimit) return null;
		m = new Map();
		doppelgangers.set(threadId, m);
	}
	return m;
};

/**
 * 1人で大量のスレに居座ってthreadsLimitを埋められないよう、
 * 新しく置く前に別スレの古いドッペルゲンガーから消す
 */
export const limitDoppelgangersPerUser = (userId: number, threadId: number) => {
	const others: [number, Date][] = [];
	for (const [k, m] of doppelgangers) {
		if (k === threadId) continue;
		const d = m.get(userId);
		if (d) others.push([k, d.updatedAt]);
	}
	if (others.length < threadsPerUser) return;
	others.sort((a, b) => a[1].getTime() - b[1].getTime());
	for (const [k] of others.slice(0, others.length - threadsPerUser + 1)) {
		const m = doppelgangers.get(k);
		if (!m) continue;
		m.delete(userId);
		if (m.size === 0) doppelgangers.delete(k);
	}
};

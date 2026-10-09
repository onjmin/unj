import { createHash, createHmac } from "node:crypto";
import { createTrip } from "2ch-trip";
import baseX from "base-x";
import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { pokemonMap } from "../../common/pokemon.js";
import { kimchiBoard } from "../../common/request/board.js";
import { unjBeginDate } from "../../common/request/schema.js";
import { encodeUserId } from "./anti-debug.js";
import auth from "./auth.js";
import { ninjaPokemonCache, ninjaScoreCache } from "./cache.js";
import { getIP, sliceIPRange } from "./ip.js";
import { logger } from "./log.js";
import { formatInTimeZone } from "date-fns-tz";

const base62 = baseX(
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);

const getAuthPepper = () => process.env.UNJ_AUTH_SECRET_PEPPER ?? "";

/**
 * 表示用IDの鍵（サーバー専用）。UNJ_AUTH_SECRET_PEPPERから用途を分けて導出する。
 * env読み込み順に左右されないよう初回利用時に作る
 */
let ccIdKey: Buffer | null = null;
const getCcIdKey = (): Buffer => {
	if (!ccIdKey) {
		ccIdKey = createHash("sha256")
			.update(`unj-ccid:${getAuthPepper()}`)
			.digest();
	}
	return ccIdKey;
};

/**
 * 鍵付きハッシュ（HMAC-SHA256）
 * 表示されたIDから userId やIP帯を総当たりで逆算させないため、秘密なしのsha256は使わない
 */
export const hmacCcId = (data: string): Buffer =>
	createHmac("sha256", getCcIdKey()).update(data).digest();

export const getJstDate = (): string =>
	formatInTimeZone(new Date(), "Asia/Tokyo", "yyyy-MM-dd");

const genId = (userId: number, boardId: number): string => {
	const bytes = hmacCcId([userId, boardId, getJstDate()].join("###"));
	return base62.encode(new Uint8Array(bytes));
};

export const makeCcUserId = ({
	ccBitmask,
	userId,
	boardId,
	socket,
}: {
	ccBitmask: number;
	userId: number;
	boardId: number;
	socket: Socket;
}): string => {
	// IDが非表示になる（板固有機能）
	if (boardId === kimchiBoard.id) {
		return "";
	}

	if ((ccBitmask & 2) !== 0) {
		// 2: 自演防止ID表示 # （ID:8z.8u.L60）
		const ip = getIP(socket);
		const ipRange = sliceIPRange(ip);
		const ninjaScore = ninjaScoreCache.get(userId) ?? 0;
		const ninjaLv = (ninjaScore ** (1 / 3)) | 0;
		// 「IDの最初の2文字」「プロパイダを基にした文字」「忍法帖レベル」
		return [
			genId(userId, boardId).slice(0, 2),
			hmacCcId(["ip", ipRange].join("###")).toString("hex").slice(0, 2),
			`L${ninjaLv}`,
		].join(".");
	}
	if ((ccBitmask & 1) !== 0) {
		// 1: ID表示 # （ID:byNL）
		return genId(userId, boardId).slice(0, 4);
	}
	// 0: ID非表示
	return "";
};

const escapeUserName = (str: string) =>
	str
		.replace(/◆/g, "◇")
		.replace(/■/g, "□")
		.replace(/★/g, "☆")
		.replace(/●/g, "○")
		.replace(/【/g, "｛")
		.replace(/】/g, "｝");

/**
 * 名前に付加される系のコマンドもここで作成する
 */
export const makeCcUserName = ({
	ccBitmask,
	userName,
	socket,
	ninja,
}: {
	ccBitmask: number;
	userName: string;
	socket: Socket;
	ninja: boolean;
}): string => {
	if ((ccBitmask & 4) !== 0) {
		const index = userName.indexOf("#");
		if (index === -1) {
			let suffix = "";
			if (ninja) {
				const userId = auth.getUserId(socket);
				const ninjaScore = ninjaScoreCache.get(userId) ?? 0;
				const ninjaLv = (ninjaScore ** (1 / 3)) | 0;
				const pokemon =
					pokemonMap.get(ninjaPokemonCache.get(userId) ?? 0) ?? "けつばん";
				const ninjaId = (encodeUserId(userId, unjBeginDate) ?? "XX")
					.slice(0, 2)
					.toUpperCase();
				suffix = `■忍【LV${ninjaLv},${pokemon},${ninjaId}】`;
			}
			const name = escapeUserName(userName);
			return `${name}${suffix}`;
		}
		const tripKey = userName.slice(index);
		const name = escapeUserName(userName.slice(0, index));
		const cap = findCap(tripKey);
		if (cap) return `${cap} ★`;
		const trip = tripKey === "#" ? "fnkquv7jY2" : createTrip(tripKey);
		return `${name}◆${trip.replace(/^.+◆/, "")}`;
	}
	return "";
};

/**
 * 旧方式（saltなしsha256の先頭16桁）。UNJ_CAP_HASHES未設定のときだけ使う
 */
const legacyCapList = new Map([
	["2853d762556dee5d", "管理人"],
	["93cd0aba6b362647", "電撃少女"],
	["07139d4ce3c06b56", "ひろゆき"],
	["d410440f501dc573", "wiki編集者"],
]);

/**
 * キャップ一覧をenv UNJ_CAP_HASHESから読む。設定されていればこれだけを使う。
 * 書式: 「HMAC値:キャップ名」のカンマ区切り（例: 0123…cdef:管理人,89ab…4567:wiki編集者）
 * HMAC値 = HMAC-SHA256(鍵=UNJ_AUTH_SECRET_PEPPER, 名前欄の#以降（#を含む）) の16進64桁
 */
const loadEnvCapList = (): Map<string, string> | null => {
	const raw = process.env.UNJ_CAP_HASHES?.trim();
	if (!raw) return null;
	const m: Map<string, string> = new Map();
	for (const entry of raw.split(",")) {
		const i = entry.indexOf(":");
		if (i === -1) continue;
		const hash = entry.slice(0, i).trim().toLowerCase();
		const name = entry.slice(i + 1).trim();
		if (!/^[0-9a-f]{64}$/.test(hash) || !name) continue;
		m.set(hash, name);
	}
	if (!m.size) logger.warn("⚠️ UNJ_CAP_HASHES has no valid entries");
	return m;
};

let envCapList: Map<string, string> | null | undefined; // undefined: 未読込
const findCap = (tripKey: string): string | undefined => {
	if (envCapList === undefined) envCapList = loadEnvCapList();
	if (envCapList) {
		const hash = createHmac("sha256", getAuthPepper())
			.update(tripKey)
			.digest("hex");
		return envCapList.get(hash);
	}
	return legacyCapList.get(sha256(tripKey).slice(0, 16));
};

export const makeCcUserAvatar = ({
	ccBitmask,
	userAvatar,
}: {
	ccBitmask: number;
	userAvatar: number;
}): number => {
	if ((ccBitmask & 8) !== 0) {
		return userAvatar;
	}
	return 0;
};

import { createTrip } from "2ch-trip";
import baseX from "base-x";
import { differenceInDays } from "date-fns";
import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { pokemonMap } from "../../common/pokemon.js";
import { kimchiBoard } from "../../common/request/board.js";
import { unjBeginDate } from "../../common/request/schema.js";
import { encodeUserId } from "./anti-debug.js";
import auth from "./auth.js";
import { ninjaPokemonCache, ninjaScoreCache } from "./cache.js";
import { getIP, sliceIPRange } from "./ip.js";
import { formatInTimeZone } from "date-fns-tz";

const base62 = baseX(
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);

const genId = (userId: number, boardId: number): string => {
	const jstDate = formatInTimeZone(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
	const bytes = sha256.array([userId, boardId, jstDate].join("###"));
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
			sha256(ipRange).slice(0, 2),
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
		const cap = capList.get(sha256(tripKey).slice(0, 16));
		if (cap) return `${cap} ★`;
		const trip = tripKey === "#" ? "fnkquv7jY2" : createTrip(tripKey);
		return `${name}◆${trip.replace(/^.+◆/, "")}`;
	}
	return "";
};

const capList = new Map([
	["2853d762556dee5d", "カン・ニリン"],
	["93cd0aba6b362647", "電撃少女"],
	["07139d4ce3c06b56", "ひろゆき"],
]);

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

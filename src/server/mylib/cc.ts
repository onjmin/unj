import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { pokemonMap } from "../../common/pokemon.js";
import { encodeUserId } from "./anti-debug.js";
import auth from "./auth.js";
import { ninjaPokemonCache, ninjaScoreCache } from "./cache.js";
import { getIP, sliceIPRange } from "./ip.js";

export const makeCcUserId = ({
	ccBitmask,
	userId,
	socket,
}: {
	ccBitmask: number;
	userId: number;
	socket: Socket;
}): string => {
	if ((ccBitmask & 2) !== 0) {
		// 2: 自演防止ID表示 # （ID:8z.8u.L60）
		const result = encodeUserId(userId, new Date());
		if (result !== null) {
			const ip = getIP(socket);
			const ipRange = sliceIPRange(ip);
			const ninjaScore = ninjaScoreCache.get(userId) ?? 0;
			const ninjaLv = (ninjaScore ** (1 / 3)) | 0;
			// 「IDの最初の2文字」「プロパイダを基にした文字」「忍法帖レベル」
			return [
				result.slice(0, 2),
				sha256(ipRange).slice(0, 2),
				`L${ninjaLv}`,
			].join(".");
		}
	} else if ((ccBitmask & 1) !== 0) {
		// 1: ID表示 # （ID:byNL）
		const result = encodeUserId(userId, new Date());
		if (result !== null) {
			return result.slice(0, 4);
		}
	}
	// 0: ID非表示
	return "";
};

const escapeUserName = (str: string) =>
	str
		.replace(/◆/g, "◇")
		.replace(/■/g, "□")
		.replace(/【/g, "｛")
		.replace(/】/g, "｝");

const bigDay = new Date(Date.UTC(2025, 3 - 1, 21));

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
				const ninjaId = (encodeUserId(userId, bigDay) ?? "XX")
					.slice(0, 2)
					.toUpperCase();
				suffix = `■忍【LV${ninjaLv},${pokemon},${ninjaId}】`;
			}
			const name = escapeUserName(userName);
			return `${name}${suffix}`;
		}
		const tripKey = userName.slice(index);
		let trip = "";
		if (tripKey.startsWith("#############")) {
			trip = "???";
		} else {
			trip = btoa(
				String.fromCharCode(...new Uint8Array(sha256.arrayBuffer(tripKey))),
			)
				.slice(0, 10)
				.replace(/\+/g, ".");
		}
		const name = escapeUserName(userName.slice(0, index));
		return `${name}◆${trip}`;
	}
	return "";
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

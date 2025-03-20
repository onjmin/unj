import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { encodeUserId } from "./anti-debug.js";
import { ninjaScoreCache } from "./cache.js";
import { getIP } from "./ip.js";

export const makeCcUserId = (
	ccBitmask: number,
	userId: number,
	socket: Socket,
): string => {
	if ((ccBitmask & 2) === 2) {
		// 2: 自演防止ID表示 # （ID:8z.8u.L60）
		const result = encodeUserId(userId, new Date());
		if (result !== null) {
			const ip = getIP(socket);
			const delimiter = ip.includes(".") ? "." : ":";
			const ipRange = ip.split(delimiter).slice(0, 2).join(delimiter);
			const ninjaScore = ninjaScoreCache.get(userId) ?? 0;
			const ninjaLv = (ninjaScore ** (1 / 3)) | 0;
			// 「IDの最初の2文字」「プロパイダを基にした文字」「忍法帖レベル」
			return [
				result.slice(0, 2),
				sha256(ipRange).slice(0, 2),
				`L${ninjaLv}`,
			].join(".");
		}
	} else if ((ccBitmask & 1) === 1) {
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

/**
 * 名前に付加される系のコマンドもここで作成する
 * ToDo: 忍法帖
 */
export const makeCcUserName = (ccBitmask: number, userName: string): string => {
	if ((ccBitmask & 4) === 4) {
		const index = userName.indexOf("#");
		if (index === -1) {
			return escapeUserName(userName);
		}
		const name = escapeUserName(userName.slice(0, index));
		const tripKey = userName.slice(index);
		let output = name;
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
		output = `${name}◆${trip}`;
		return output;
	}
	return "";
};

export const makeCcUserAvatar = (
	ccBitmask: number,
	userAvatar: number,
): number => {
	if ((ccBitmask & 8) === 8) {
		return userAvatar;
	}
	return 0;
};

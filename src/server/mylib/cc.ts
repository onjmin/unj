import crypto from "node:crypto";
import baseX from "base-x";
import { differenceInDays } from "date-fns";
import iconv from "iconv-lite";
import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { pokemonMap } from "../../common/pokemon.js";
import { unjBeginDate } from "../../common/request/schema.js";
import { encodeUserId } from "./anti-debug.js";
import auth from "./auth.js";
import { ninjaPokemonCache, ninjaScoreCache } from "./cache.js";
import { getIP, sliceIPRange } from "./ip.js";

// @ts-ignore
import unixCrypt from "unix-crypt-td-js";

const base62 = baseX(
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);

const genId = (userId: number, boardId: number): string => {
	const basedTime = differenceInDays(new Date(), new Date(0));
	const bytes = sha256.array([userId, boardId, basedTime].join("###"));
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
	// IDが非表示になる板
	if ([2, 3].includes(boardId)) {
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
		let trip = "";
		if (tripKey.startsWith("#############")) {
			trip = "???";
		} else {
			trip = makeTrip(tripKey);
		}
		return `${name}◆${trip}`;
	}
	return "";
};

const capList = new Map([
	["2853d762556dee5d", "カン・ニリン"],
	["93cd0aba6b362647", "電撃少女"],
	["07139d4ce3c06b56", "ひろゆき"],
]);

/**
 * 2ch非互換トリップの生成
 */
const makeTrip = (tripKeyUtf8: string) => {
	return btoa(
		String.fromCharCode(...new Uint8Array(sha256.arrayBuffer(tripKeyUtf8))),
	)
		.slice(0, 10)
		.replace(/\+/g, ".");
};

/**
 * 2ch互換トリップの生成（未完成）
 */
const _makeTrip = (tripKeyUtf8: string): string => {
	const tripKey = iconv.encode(tripKeyUtf8, "Shift_JIS");

	let trip = "???";

	if (tripKey.length >= 12) {
		const firstChar = tripKey[0];
		const tripKeyStr = tripKeyUtf8;

		// 10桁トリップ2 (#16進数指定)
		if (firstChar === 0x23) {
			// '#'
			const m = tripKeyStr.match(/^#([0-9a-fA-F]{16})([./0-9a-zA-Z]{0,2})$/);
			if (m) {
				const hex = m[1];
				const salt = (m[2] || "..").padEnd(2, ".");
				const key = Buffer.from(hex, "hex");
				trip = unixCrypt(key.toString("latin1"), salt).slice(-10);
			} else {
				trip = "???";
			}
		} else if (firstChar === 0x24) {
			// '$' 予約
			trip = "???";
		} else {
			// 12桁トリップ SHA-1 + Base64
			const hash = crypto.createHash("sha1").update(tripKey).digest();
			trip = hash.toString("base64").slice(0, 12).replace(/\+/g, ".");
		}
	} else {
		// 10桁トリップ旧プロトコル
		trip = makeOldTrip(tripKeyUtf8);
	}

	return trip;
};

// toSaltChar関数は使用せず、Perlのtr///相当の処理をインラインで実現します。
// Saltの特殊文字マッピングはそのまま利用します。
const saltMap: Record<string, string> = {
	":": "A",
	";": "B",
	"<": "C",
	"=": "D",
	">": "E",
	"?": "F",
	"@": "G",
	"[": "a",
	"\\": "b",
	"]": "c",
	"^": "d",
	_: "e",
	"`": "f",
};

const makeOldTrip = (tripKeyUtf8: string): string => {
	// 1. トリップキーから'#'を除去（Perlの substr $tripkey, 1; に相当）
	//    ※ makeTripで既に tripKeyUtf8.length < 12 の判定を経ているため、
	//       ここでは # の有無に関わらず、旧プロトコルとして処理を継続。
	const tripKeyWithoutSharp = tripKeyUtf8.startsWith("#")
		? tripKeyUtf8.slice(1)
		: tripKeyUtf8;

	// 2. Saltの生成: キーに"H."を付加し、2文字目から2文字を抽出
	//    Perl: $salt = substr $tripkey . "H.", 1, 2; に相当
	//    slice(1, 3)でインデックス1と2の文字（2文字目と3文字目）を取得
	const saltBase = `${tripKeyWithoutSharp}H.`.slice(1, 3);

	// 3. Saltの文字変換（Perlのtr///の再現）
	const salt = Array.from(saltBase)
		.map((char) => {
			// [^\.-z]/\./g の再現: '.' (0x2e) から 'z' (0x7a) までの範囲外を '.' に置換
			const code = char.charCodeAt(0);
			if (code < 0x2e || code > 0x7a) {
				return ".";
			}
			// tr/:;<=>?@[\\]^_`/A-Ga-f/ の再現
			return saltMap[char] ?? char;
		})
		.join("");

	// 4. キーのエンコード: トリップキー（#なし）をShift_JISでエンコード
	//    ※ Perlのcryptは、渡された文字列をShift_JIS相当のバイト列として処理する
	const tripKeySJIS = iconv.encode(tripKeyWithoutSharp, "Shift_JIS");

	// unix-crypt-td-js は Latin-1 文字列として渡す
	const keyLatin1 = tripKeySJIS.toString("latin1");
	const crypted = unixCrypt(keyLatin1, salt);

	return crypted.slice(-10);
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

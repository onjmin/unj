import Hashids from "hashids";
import { get, set } from "idb-keyval";
import { sha256 } from "js-sha256";
import { DEV_MODE } from "./env.js";

const delimiter = "###";

const VITE_UNJ_STORAGE_KEY_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_STORAGE_KEY_SECRET_PEPPER ?? "";
const VITE_UNJ_STORAGE_VALUE_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_STORAGE_VALUE_SECRET_PEPPER ?? "";
const VITE_UNJ_STORAGE_VALUE_CHECKSUM_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_STORAGE_VALUE_CHECKSUM_SECRET_PEPPER ?? "";

/**
 * IndexedDBの安全なキーを計算する
 */
const calcUnjStorageKey = (key: string): string => {
	if (DEV_MODE) {
		return key;
	}
	const token = sha256(
		[VITE_UNJ_STORAGE_KEY_SECRET_PEPPER, key].join(delimiter),
	);
	return token.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

/**
 * IndexedDBの値の安全なチェックサムを計算する
 *
 * IndexedDBの符号化の安全性を高めるため。
 * ユーザーにとって総当たりの試行が容易なのでチェックサムにしては多めに取る。
 * 桁数の判定がし易いように最終的な文字長は4の倍数+3とする。
 */
const calcUnjStorageValueCheckSum = (encoded: string): string => {
	const token = sha256(
		[VITE_UNJ_STORAGE_VALUE_CHECKSUM_SECRET_PEPPER, encoded].join(delimiter),
	);
	return token.slice(0, CHECKSUM_LENGTH);
};

const CHECKSUM_LENGTH = 3; // 桁数を判定し易くするために最終的な文字長は4の倍数+3
const HASHIDS_UNIT = 4; // 62^4=14,776,336なので、CodePoint(0x10FFFF)の範囲では衝突しない
const regexpHashids =
	/[^abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890]/; // hashidsの文字セット以外が入る場合

/**
 * IndexedDBが人為的に改ざんされていないか簡単なテスト
 *
 * そもそも保存する形式が誤っていた場合も検出したいため。
 */
const isSecureValue = (str: string) => {
	if (
		str.length < HASHIDS_UNIT + CHECKSUM_LENGTH ||
		str.length % HASHIDS_UNIT !== CHECKSUM_LENGTH
	) {
		return false;
	}
	if (regexpHashids.test(str)) {
		return false;
	}
	return true;
};

/**
 * IndexedDBから平文で取得する
 *
 * 生の値を返すため危険。
 * 大容量のデータの場合に使う。
 */
export const dangerousLoad = (key: string) =>
	get(calcUnjStorageKey(key)).then(String);

/**
 * IndexedDBに平文で保存する
 *
 * 生の値を保存するため危険。
 * 大容量のデータの場合に使う。
 */
export const dangerousSave = async (
	key: string,
	value: string,
): Promise<void> => set(calcUnjStorageKey(key), value);

/**
 * IndexedDBから取得する
 */
export const load = async (key: string): Promise<string | null> => {
	if (DEV_MODE) {
		return dangerousLoad(key);
	}
	const secureValue = await dangerousLoad(key);
	if (!isSecureValue(secureValue)) {
		return null;
	}
	// チェックサム
	const checksum = secureValue.slice(-CHECKSUM_LENGTH);
	const encoded = secureValue.slice(0, -CHECKSUM_LENGTH);
	if (calcUnjStorageValueCheckSum(encoded) !== checksum) {
		return null;
	}
	// 複号
	const hashids = new Hashids(
		VITE_UNJ_STORAGE_VALUE_SECRET_PEPPER,
		HASHIDS_UNIT,
	);
	const encodedArray = Array.from(encoded).flatMap((_, i, arr) =>
		i % HASHIDS_UNIT === 0 ? [arr.slice(i, i + HASHIDS_UNIT).join("")] : [],
	);
	const decoded = encodedArray
		.map((v) => hashids.decode(v))
		.map((v) => String.fromCodePoint(Number(v)))
		.join("");
	return decoded;
};

/**
 * IndexedDBに保存する
 */
export const save = async (key: string, value: string): Promise<void> => {
	if (DEV_MODE) {
		return dangerousSave(key, value);
	}
	const hashids = new Hashids(
		VITE_UNJ_STORAGE_VALUE_SECRET_PEPPER,
		HASHIDS_UNIT,
	);
	const encoded = [...value]
		.map((v) => String(v.codePointAt(0))) // 危険なキャストだが、組み込み関数なので信用する
		.map((v) => hashids.encode(v))
		.join("");
	const secureValue = encoded + calcUnjStorageValueCheckSum(encoded);
	if (!isSecureValue(secureValue)) {
		return;
	}
	dangerousSave(key, secureValue);
};

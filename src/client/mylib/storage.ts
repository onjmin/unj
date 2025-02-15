import Hashids from "hashids";
import { openDB } from "idb";
import { sha256 } from "js-sha256";

const delimiter = "###";

const VITE_UNJ_STORAGE_KEY_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_STORAGE_KEY_SECRET_PEPPER ?? "";
const VITE_UNJ_STORAGE_VALUE_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_STORAGE_VALUE_SECRET_PEPPER ?? "";

/**
 * IndexedDBの安全なキーを計算する
 */
const calcUnjStorageKey = (key: string): string => {
	const token = sha256(
		[VITE_UNJ_STORAGE_KEY_SECRET_PEPPER, key].join(delimiter),
	);
	return token.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

/**
 * IndexedDBの本来の使い方ならSQL風の設計をしてパフォーマンスチューニングできそうだが、
 * あえて間違ったlocalStorage風の使い方で実装している。
 *
 * SafariのlocalStorageは7日間で消えるため、IndexedDBを採用した。
 */

const dbName = "unj-database";
const tableName = "salad-bowl";

/**
 * IndexedDBに保存する
 *
 * 生の値を保存するため危険。
 * 大容量のデータの場合に使う。
 */
export const dangerousSave = async (
	key: string,
	value: string,
): Promise<boolean> => {
	try {
		const db = await openDB(dbName, 1, {
			upgrade(db) {
				db.createObjectStore(tableName);
			},
		});
		await db.put(tableName, value, calcUnjStorageKey(key));
		return true;
	} catch (err) {
		return false;
	}
};

/**
 * IndexedDBから取得する
 *
 * 生の値を返すため危険。
 * 大容量のデータの場合に使う。
 */
export const dangerousLoad = async (key: string): Promise<string | null> => {
	try {
		const db = await openDB(dbName, 1);
		const result = await db.get(tableName, calcUnjStorageKey(key));
		return String(result);
	} catch (err) {
		return null;
	}
};

const HASHIDS_UNIT = 4; // 62^4=14,776,336なので、CodePoint(0x10FFFF)の範囲では衝突しない

/**
 * IndexedDBに保存する
 */
export const save = async (key: string, value: string): Promise<boolean> => {
	const hashids = new Hashids(
		VITE_UNJ_STORAGE_VALUE_SECRET_PEPPER,
		HASHIDS_UNIT,
	);
	const encoded = [...value]
		.map((v) => String(v.codePointAt(0))) // 危険なキャストだが、組み込み関数なので信用する
		.map((v) => hashids.encode(v))
		.join("");
	return dangerousSave(key, encoded);
};

const regexpHashids =
	/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890/; // hashidsの文字セット

/**
 * IndexedDBから取得する
 */
export const load = async (key: string): Promise<string | null> => {
	const encoded = await dangerousLoad(key);
	if (encoded === null) {
		return null;
	}
	if (encoded.length % HASHIDS_UNIT !== 0) {
		return null;
	}
	if (!regexpHashids.test(encoded)) {
		return null;
	}
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

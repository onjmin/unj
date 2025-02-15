import Hashids from "hashids";
import { openDB } from "idb";
import { sha256 } from "js-sha256";

const delimiter = "###";

const VITE_UNJ_STORAGE_KEY_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_STORAGE_KEY_SECRET_PEPPER ?? "";

/**
 * IndexedDBの安全なキーを計算する
 */
const calcUnjStorageKey = (key: string): string => {
	return sha256(
		[VITE_UNJ_STORAGE_KEY_SECRET_PEPPER, key].join(delimiter),
	).slice(0, 8); // 衝突の心配が低いので8文字に削減
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
): Promise<undefined> => {
	const db = await openDB(dbName, 1, {
		upgrade(db) {
			db.createObjectStore(tableName);
		},
	});
	await db.put(tableName, value, calcUnjStorageKey(key));
};

/**
 * IndexedDBから取得する
 *
 * 生の値を返すため危険。
 * 大容量のデータの場合に使う。
 */
export const dangerousLoad = async (key: string): Promise<string> => {
	const db = await openDB(dbName, 1);
	const result = await db.get(tableName, calcUnjStorageKey(key));
	return String(result);
};

/**
 * IndexedDBに保存する
 */
export const save = async (key: string, value: string): Promise<undefined> => {
	dangerousSave(key, value);
};

/**
 * IndexedDBから取得する
 */
export const load = async (key: string): Promise<string> => {
	return dangerousLoad(key);
};

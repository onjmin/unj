import { del, get, set } from "idb-keyval";
import { sha256 } from "js-sha256";
import { decode, encode } from "../../../common/anti-debug.js";
import { DEV_MODE, decodeEnv } from "../env.js";

const delimiter = "###";
const VITE_UNJ_HASHIDS_SECRET_PEPPER = decodeEnv(
	import.meta.env.VITE_UNJ_HASHIDS_SECRET_PEPPER,
);

/**
 * IndexedDBの安全なキーを計算する
 */
const genSecureKey = (key: string): string => {
	if (DEV_MODE) return key;
	const str = sha256([VITE_UNJ_HASHIDS_SECRET_PEPPER, key].join(delimiter));
	return str.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

/**
 * IndexedDBから平文で取得する
 *
 * 生の値を返すため危険。
 * 大容量のデータの場合に使う。
 */
export const dangerousLoad = (key: string): Promise<string | null> =>
	get(genSecureKey(key)).then((v) => (v === undefined ? null : v));

/**
 * IndexedDBに平文で保存する
 *
 * 生の値を保存するため危険。
 * 大容量のデータ保存時に直接呼び出す。
 */
export const dangerousSave = async (
	key: string,
	value: string | null,
): Promise<void> =>
	value === null ? del(genSecureKey(key)) : set(genSecureKey(key), value);

/**
 * IndexedDBから取得する
 */
export const load = async (key: string): Promise<string | null> =>
	dangerousLoad(key).then((v) =>
		DEV_MODE ? v : decode(v, VITE_UNJ_HASHIDS_SECRET_PEPPER),
	);

/**
 * IndexedDBに保存する
 */
export const save = async (key: string, value: string | null): Promise<void> =>
	dangerousSave(
		key,
		DEV_MODE || value === null
			? value
			: encode(value, VITE_UNJ_HASHIDS_SECRET_PEPPER),
	);

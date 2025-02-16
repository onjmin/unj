import { sha256 } from "js-sha256";

const delimiter = "###";

const VITE_UNJ_API_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_API_SECRET_PEPPER ?? "";

const user_a = "user_a";

/**
 * うんｊAPI投稿用トークンを計算する
 */
const calcUnjApiToken = (): string => {
	const token = sha256([VITE_UNJ_API_SECRET_PEPPER, user_a].join(delimiter));
	return token.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

const VITE_UNJ_API_FLAKY_RATE = Number(import.meta.env.VITE_UNJ_API_FLAKY_RATE);
export const flaky = (func: () => void): boolean => {
	if (Math.random() > VITE_UNJ_API_FLAKY_RATE) {
		func();
		return true;
	}
	return false;
};

const VITE_UNJ_BAN_RESTORE_CODE_KEY_PEPPER =
	import.meta.env.VITE_UNJ_BAN_RESTORE_CODE_KEY_PEPPER ?? "";
const VITE_UNJ_BAN_RESTORE_CODE_PEPPER =
	import.meta.env.VITE_UNJ_BAN_RESTORE_CODE_PEPPER ?? "";

/**
 * BAN解除コード鍵の生成
 */
export const genBanRestoreCodeKey = () => {
	const base = Math.random().toString(); // TODO: Number.prototype.toString()を書き換えるだけで脆弱性を突けてしまう
	const token = sha256(
		[VITE_UNJ_BAN_RESTORE_CODE_KEY_PEPPER, base].join(delimiter),
	);
	return token.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

/**
 * BAN解除コードの生成
 */
export const genBanRestoreCode = (key: string) => {
	const token = sha256([VITE_UNJ_BAN_RESTORE_CODE_PEPPER, key].join(delimiter));
	return token.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

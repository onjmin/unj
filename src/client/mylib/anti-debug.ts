import { differenceInDays } from "date-fns";
import { sha256 } from "js-sha256";

const VITE_UNJ_FLAKY_RATE = Number(import.meta.env.VITE_UNJ_FLAKY_RATE);

/**
 * 再現性を下げる
 */
export const flaky = (func: () => void): boolean => {
	if (Math.random() > VITE_UNJ_FLAKY_RATE) {
		func();
		return true;
	}
	return false;
};

const delimiter = "###";

const VITE_UNJ_API_SECRET_PEPPER = String(
	import.meta.env.VITE_UNJ_API_SECRET_PEPPER,
);

/**
 * うんｊAPI投稿用トークンを計算する
 */
const genUnjApiToken = (key: string): string => {
	const token = sha256([VITE_UNJ_API_SECRET_PEPPER, key].join(delimiter));
	return token.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

const VITE_UNJ_BAN_VERIFY_CODE_PEPPER = String(
	import.meta.env.VITE_UNJ_BAN_VERIFY_CODE_PEPPER,
);

/**
 * BAN解除コードの生成
 */
export const genBanVerifyCode = (date: Date, key: string) => {
	const basedKey = key || Math.random().toString(); // TODO: Number.prototype.toString()を書き換えるだけで脆弱性を突けてしまう
	const basedTime = differenceInDays(date, new Date(0));
	const token = sha256(
		[VITE_UNJ_BAN_VERIFY_CODE_PEPPER, basedTime, basedKey].join(delimiter),
	);
	return token.slice(0, 8); // UXに関わるので8文字に削減
};

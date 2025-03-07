import { differenceInDays } from "date-fns";
import { sha256 } from "js-sha256";
import { nonceLength } from "../../common/request/schema.js";

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

const VITE_UNJ_NONCE_SECRET_PEPPER = String(
	import.meta.env.VITE_UNJ_NONCE_SECRET_PEPPER,
);

/**
 * Nonce値の生成
 */
export const genNonce = (key: string): string => {
	const str = sha256([VITE_UNJ_NONCE_SECRET_PEPPER, key].join(delimiter));
	return str.slice(0, nonceLength);
};

const VITE_UNJ_BAN_VERIFY_CODE_PEPPER = String(
	import.meta.env.VITE_UNJ_BAN_VERIFY_CODE_PEPPER,
);

/**
 * BAN解除コードの生成
 */
export const genBanVerifyCode = (date: Date, key: string) => {
	const basedKey = key || Math.random().toString(36); // TODO: Number.prototype.toString()を書き換えるだけで脆弱性を突けてしまう
	const basedTime = differenceInDays(date, new Date(0));
	const str = sha256(
		[VITE_UNJ_BAN_VERIFY_CODE_PEPPER, basedTime, basedKey].join(delimiter),
	);
	return str.slice(0, 8); // UXに関わるので8文字に削減
};

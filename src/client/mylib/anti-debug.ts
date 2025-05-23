import { sha256 } from "js-sha256";
import { nonceLength } from "../../common/request/schema.js";
import { antiTreeShaking } from "./dummy.js";
import { VITE_BASE_URL, decodeEnv } from "./env.js";

const VITE_UNJ_FLAKY_RATE = Number(
	decodeEnv(import.meta.env.VITE_UNJ_FLAKY_RATE),
);

/**
 * 再現性を下げる
 */
export const flaky = (func: () => void): boolean => {
	if (Math.random() < VITE_UNJ_FLAKY_RATE) {
		func();
		return true;
	}
	return false;
};

const delimiter = "###";

const VITE_UNJ_NONCE_SECRET_PEPPER = decodeEnv(
	import.meta.env.VITE_UNJ_NONCE_SECRET_PEPPER,
);

/**
 * Nonce値の生成
 */
export const genNonce = (key: string): string => {
	const str = sha256([VITE_UNJ_NONCE_SECRET_PEPPER, key].join(delimiter));
	return str.slice(0, nonceLength);
};

const VITE_UNJ_BAN_VERIFY_CODE_PEPPER = decodeEnv(
	import.meta.env.VITE_UNJ_BAN_VERIFY_CODE_PEPPER,
);

/**
 * BAN解除コードの生成
 */
export const genBanVerifyCode = (key: string): string => {
	const basedKey = key || sha256(Math.random().toString());
	const str = sha256(
		[VITE_UNJ_BAN_VERIFY_CODE_PEPPER, basedKey].join(delimiter),
	);
	return str.slice(0, 8); // UXに関わるので8文字に削減
};

// アンチデバッグ機構
if (
	antiTreeShaking() || // Tree shaking対策
	window.location.href === window.location.href.replace(VITE_BASE_URL, "") || // 本番ビルド盗難対策
	navigator.webdriver // ブラウザ自動化ツール対策
)
	window.location.href = "about:blank";

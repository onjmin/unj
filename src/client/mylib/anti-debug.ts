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
export const flakyAction = (func: () => void) => {
	if (Math.random() > VITE_UNJ_API_FLAKY_RATE) {
		func();
	}
};

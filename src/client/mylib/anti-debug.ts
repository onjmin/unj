import { sha256 } from "js-sha256";

const delimiter = "###";

const VITE_UNJ_API_SECRET_PEPPER =
	import.meta.env.VITE_UNJ_API_SECRET_PEPPER ?? "";

const user_a = "user_a";

/**
 * うんｊAPI投稿用トークンを計算する
 */
const calcUnjApiToken = (): string => {
	return sha256([VITE_UNJ_API_SECRET_PEPPER, user_a].join(delimiter));
};

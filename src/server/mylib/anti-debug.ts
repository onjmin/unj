import { sha256 } from "js-sha256";

const UNJ_API_SECRET_PEPPER = process.env.VITE_UNJ_API_SECRET_PEPPER ?? "";
const delimiter = "###";

const user_a = "user_a";

/**
 * うんｊAPI投稿用トークンを計算する
 */
export const calcUnjApiToken = () => {
	return sha256(`${UNJ_API_SECRET_PEPPER}${delimiter}${user_a}`);
};

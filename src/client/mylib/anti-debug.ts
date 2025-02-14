import { sha256 } from "js-sha256";

const UNJ_API_SECRET_PEPPER = import.meta.env.VITE_UNJ_API_SECRET_PEPPER ?? "";
const delimiter = "###";

const user_a = "user_a";

/**
 * うんｊAPI投稿用トークンを計算する
 */
export const calcUnjApiToken = () => {
	return sha256([UNJ_API_SECRET_PEPPER, user_a].join(delimiter));
};

const PIPEDREAM_API_SECRET_INTERVAL = Number(
	import.meta.env.VITE_PIPEDREAM_API_SECRET_INTERVAL,
);

/**
 * Pipedream用の時限式トークンを計算する
 */
export const calcPipedreamApiToken = () => {
	const basedTime = String(
		Math.floor(Date.now() / 1000 / PIPEDREAM_API_SECRET_INTERVAL),
	);
	return sha256([UNJ_API_SECRET_PEPPER, basedTime].join(delimiter));
};

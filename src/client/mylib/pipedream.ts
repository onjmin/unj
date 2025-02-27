import { differenceInSeconds } from "date-fns";
import { sha256 } from "js-sha256";

const delimiter = "###";

const PIPEDREAM_API_SECRET_PEPPER = String(
	import.meta.env.PIPEDREAM_API_SECRET_PEPPER,
);
const PIPEDREAM_API_SECRET_INTERVAL = Number(
	import.meta.env.VITE_PIPEDREAM_API_SECRET_INTERVAL,
);

/**
 * Pipedream用の時限式トークンを計算する
 */
const calcPipedreamApiToken = (): string => {
	const secondsSinceEpoch = differenceInSeconds(new Date(), new Date(0));
	const basedTime = Math.floor(
		secondsSinceEpoch / PIPEDREAM_API_SECRET_INTERVAL,
	);
	const token = sha256(
		[PIPEDREAM_API_SECRET_PEPPER, basedTime].join(delimiter),
	);
	return token.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

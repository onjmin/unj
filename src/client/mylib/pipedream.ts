import { differenceInSeconds } from "date-fns";
import { sha256 } from "js-sha256";

const delimiter = "###";

const PIPEDREAM_API_SECRET_PEPPER =
	import.meta.env.PIPEDREAM_API_SECRET_PEPPER ?? "";
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
	return sha256([PIPEDREAM_API_SECRET_PEPPER, basedTime].join(delimiter));
};

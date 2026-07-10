import { createDtmStudio, type DtmStudio } from "@onjmin/dtm";
import { decodeEnv } from "./env.js";

const VITE_RPGEN_SEARCH_TOKEN = decodeEnv(
	import.meta.env.VITE_RPGEN_SEARCH_TOKEN,
);

export const getStudio = (): Promise<DtmStudio> =>
	createDtmStudio({
		midiSearch: { apiKey: VITE_RPGEN_SEARCH_TOKEN },
	});

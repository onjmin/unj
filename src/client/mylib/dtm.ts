import type { DtmStudio } from "@onjmin/dtm";
import { decodeEnv } from "./env.js";
import { applyMasterVolume, subscribeMasterVolume } from "./master-volume.js";

const VITE_RPGEN_SEARCH_TOKEN = decodeEnv(
	import.meta.env.VITE_RPGEN_SEARCH_TOKEN,
);

let studioPromise: Promise<DtmStudio> | null = null;

export const getStudio = async (): Promise<DtmStudio> => {
	if (studioPromise) return studioPromise;
	studioPromise = (async () => {
		const { createDtmStudio } = await import("@onjmin/dtm");
		const studio = await createDtmStudio({
			midiSearch: { apiKey: VITE_RPGEN_SEARCH_TOKEN },
			masterVolume: applyMasterVolume(100),
		});
		subscribeMasterVolume(() => {
			studio.setVolume(applyMasterVolume(100));
		});
		return studio;
	})();
	return studioPromise;
};

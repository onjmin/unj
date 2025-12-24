import { sha256 } from "js-sha256";
import { decode, encode } from "../../common/anti-debug.js";
import { DEV_MODE, decodeEnv } from "./env.js";

const delimiter = "###";
const VITE_UNJ_HASHIDS_SECRET_PEPPER = decodeEnv(
	import.meta.env.VITE_UNJ_HASHIDS_SECRET_PEPPER,
);

let randomKey = localStorage.getItem("randomKey");
if (randomKey === null) {
	randomKey = Math.random().toString(36).slice(2);
	localStorage.setItem("randomKey", randomKey);
}

const uniquePepper = [randomKey, VITE_UNJ_HASHIDS_SECRET_PEPPER].join(
	delimiter,
);

const genSecureKey = (key: string): string => {
	if (DEV_MODE) return key;
	const str = sha256([uniquePepper, key].join(delimiter));
	return str.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

const load = (key: string): string | null => {
	const k = genSecureKey(key);
	const v = localStorage.getItem(k);
	return DEV_MODE ? v : decode(v, uniquePepper);
};

const save = (key: string, value: string | null): void => {
	const k = genSecureKey(key);
	const v = DEV_MODE ? value : encode(value, uniquePepper);
	if (v === null) {
		localStorage.removeItem(k);
	} else {
		localStorage.setItem(k, v);
	}
};

export class UnjStorage {
	#key;
	constructor(key: string) {
		this.#key = key;
	}
	get value() {
		return load(this.#key);
	}
	set value(value: string | null) {
		if (this.value !== value) save(this.#key, value);
	}
}

// BAN
export const banStatus = new UnjStorage("banStatus");
export const ipInfoJson = new UnjStorage("ipInfoJson");
export const banReport = new UnjStorage("banReport");

// Sound
export const soundVolume = new UnjStorage("soundVolume");
export const newResSound = new UnjStorage("newResSound");
export const replyResSound = new UnjStorage("replyResSound");

// Menu
export const openLeft = new UnjStorage("openLeft");
export const openRight = new UnjStorage("openRight");

// theme
export const theme = new UnjStorage("theme");

// customBackground
export const customBackground = new UnjStorage("customBackground");

// RPG
export const rpgMode = new UnjStorage("rpgMode");
export const sAnimsId = new UnjStorage("sAnimsId");

// oekaki
export const tool = new UnjStorage("tool");
export const color = new UnjStorage("color");
export const brushSize = new UnjStorage("brushSize");
export const penSize = new UnjStorage("penSize");
export const eraserSize = new UnjStorage("eraserSize");
export const dotPenScale = new UnjStorage("dotPenScale");
export const oekakiUploaded = new UnjStorage("oekakiUploaded");

// other
export const latestReadThreadId = new UnjStorage("latestReadThreadId");
export const termsAgreement = new UnjStorage("termsAgreement");
export const contactedAt = new UnjStorage("contactedAt");
export const authToken = new UnjStorage("authToken");
export const authTokenUpdatedAt = new UnjStorage("authTokenUpdatedAt");
export const nonceKey = new UnjStorage("nonceKey");
export const ninjaPokemon = new UnjStorage("ninjaPokemon");
export const ninjaScore = new UnjStorage("ninjaScore");
export const adsDeletedAt = new UnjStorage("adsDeletedAt");
export const resFormExpand = new UnjStorage("resFormExpand");

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
	#reactive?: () => void;
	constructor(key: string, reactive?: () => void) {
		this.#key = key;
		this.#reactive = reactive;
	}
	get value() {
		return load(this.#key);
	}
	set value(value: string | null) {
		save(this.#key, value);
		this.#reactive?.();
	}
}

// BAN
export const banStatus = new UnjStorage("banStatus");
export const banReason = new UnjStorage("banReason");
export const traversalTarget = new UnjStorage("traversalTarget");
export const ipInfoJson = new UnjStorage("ipInfoJson");
export const banVerifyCode = new UnjStorage("banVerifyCode");
export const banReport = new UnjStorage("banReport");

// Sound
export const soundVolume = new UnjStorage("soundVolume");
export const newResSound = new UnjStorage("newResSound");
export const replyResSound = new UnjStorage("replyResSound");

// Guide
export const showThreadGuide = new UnjStorage("showThreadGuide");
export const showTermsGuide = new UnjStorage("showTermsGuide");
export const showContactGuide = new UnjStorage("showContactGuide");

// theme-color
export const theme = new UnjStorage("theme", () => {
	const v = theme.value ?? "";
	const href = `https://cdn.jsdelivr.net/npm/svelte-material-ui@8.0.0-beta.3/themes/${v}.min.css`;
	document.getElementById("unj-theme")?.setAttribute("href", href);
	if (v.slice(-4) === "dark") {
		document.body.classList.add("dark");
	} else {
		document.body.classList.remove("dark");
	}
});
theme.value = theme.value ?? "unity";

// other
export const latestReadThreadId = new UnjStorage("latestReadThreadId");
export const termsAgreement = new UnjStorage("termsAgreement");
export const contactedAt = new UnjStorage("contactedAt");
export const authToken = new UnjStorage("authToken");
export const nonceKey = new UnjStorage("nonceKey");
export const ninjaPokemon = new UnjStorage("ninjaPokemon");
export const ninjaScore = new UnjStorage("ninjaScore");

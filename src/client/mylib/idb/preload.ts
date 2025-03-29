import { load, save } from "./keyval.js";

/**
 * 事前読み込み
 */
export class Preload {
	static promises: Promise<void>[] = [];
	#key;
	#value: string | null = null;
	#reactive?: () => void;
	constructor(key: string, reactive?: () => void) {
		this.#key = key;
		this.#reactive = reactive;
		Preload.promises.push(
			load(key).then((v) => {
				this.#value = v;
				this.#reactive?.();
			}),
		);
	}
	get value() {
		return this.#value;
	}
	set value(value: string | null) {
		this.#value = value;
		this.#reactive?.();
		save(this.#key, value);
	}
}

// BAN
export const banStatus = new Preload("banStatus");
export const banReason = new Preload("banReason");
export const traversalTarget = new Preload("traversalTarget");
export const ipInfoJson = new Preload("ipInfoJson");
export const banVerifyCode = new Preload("banVerifyCode");
export const banReport = new Preload("banReport");

// Sound
export const soundVolume = new Preload("soundVolume");
export const newResSound = new Preload("newResSound");
export const replyResSound = new Preload("replyResSound");

// Guide
export const showThreadGuide = new Preload("showThreadGuide");
export const showTermsGuide = new Preload("showTermsGuide");
export const showContactGuide = new Preload("showContactGuide");

// theme-color
export const theme = new Preload("theme", () => {
	if (!theme.value) theme.value = "metro-dark";
	const href = `https://cdn.jsdelivr.net/npm/svelte-material-ui@8.0.0-beta.3/themes/${theme.value}.min.css`;
	document.getElementById("unj-theme")?.setAttribute("href", href);
	if (theme.value.slice(-4) === "dark") {
		document.body.classList.add("dark");
	} else {
		document.body.classList.remove("dark");
	}
});

// other
export const termsAgreement = new Preload("termsAgreement");
export const contactedAt = new Preload("contactedAt");
export const authToken = new Preload("authToken");
export const nonceKey = new Preload("nonceKey");
export const ninjaPokemon = new Preload("ninjaPokemon");
export const ninjaScore = new Preload("ninjaScore");

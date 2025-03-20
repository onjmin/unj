import { load, save } from "./keyval.js";

/**
 * 事前読み込み
 */
export class Preload {
	static promises: Promise<void>[] = [];
	#key;
	#value: string | null = null;
	constructor(key: string) {
		this.#key = key;
		Preload.promises.push(
			load(key).then((v) => {
				this.#value = v;
			}),
		);
	}
	get value() {
		return this.#value;
	}
	set value(value: string | null) {
		this.#value = value;
		save(this.#key, value);
	}
}

export const banStatus = new Preload("banStatus");
export const banReason = new Preload("banReason");
export const traversalTarget = new Preload("traversalTarget");
export const ipInfoJson = new Preload("ipInfoJson");
export const banVerifyCode = new Preload("banVerifyCode");
export const banReport = new Preload("banReport");

export const soundVolume = new Preload("soundVolume");
export const newResSound = new Preload("newResSound");
export const replyResSound = new Preload("replyResSound");

export const destinationPathname = new Preload("destinationPathname");
export const termsAgreement = new Preload("termsAgreement");
export const contactedAt = new Preload("contactedAt");

export const authToken = new Preload("authToken");
export const nonceKey = new Preload("nonceKey");
export const ninjaPokemon = new Preload("ninjaPokemon");
export const ninjaScore = new Preload("ninjaScore");

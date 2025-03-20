import { load, save } from "./keyval.js";

/**
 * 事後読み込み
 */
export class Postload {
	promise: Promise<void>;
	#key;
	#value: string | null = null;
	constructor(key: string) {
		this.#key = key;
		this.promise = load(key).then((v) => {
			this.#value = v;
		});
	}
	get value() {
		return this.#value;
	}
	set value(value: string | null) {
		this.#value = value;
		save(this.#key, value);
	}
}

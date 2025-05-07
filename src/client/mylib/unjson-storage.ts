const delimiter = "###";

const load = (key: string): string | null => {
	return localStorage.getItem(key);
};

const save = (key: string, value: string | null): void => {
	if (value === null) {
		localStorage.removeItem(key);
	} else {
		localStorage.setItem(key, value);
	}
};

export class UnjsonStorage {
	#key;
	#reactive?: () => void;
	constructor(key: string, reactive?: () => void) {
		this.#key = key;
		this.#reactive = reactive;
	}
	get value(): string | null {
		return load(this.#key);
	}
	set value(value: string | null) {
		if (this.value === value) return;
		save(this.#key, value);
		this.#reactive?.();
	}
	get json(): object | null {
		try {
			const value = load(this.#key);
			if (!value) return null;
			return JSON.parse(value);
		} catch (err) {
			this.value = null;
			return null;
		}
	}
	set json(value: object | null) {
		if (value === null) {
			save(this.#key, null);
			return;
		}
		this.value = JSON.stringify(value);
	}
}

export const headline = new UnjsonStorage("headline");

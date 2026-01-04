import localforage from "localforage";

localforage.config({
	name: "unj.v25.5.8",
	storeName: "cache.objects",
});

export class ObjectStorage<T> {
	constructor(private key: string) {}
	async get(): Promise<T | null> {
		return (await localforage.getItem<T>(this.key)) ?? null;
	}
	set(value: T | null): void {
		try {
			localforage.setItem(this.key, JSON.parse(JSON.stringify(value)));
		} catch {}
	}
}

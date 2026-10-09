/**
 * 件数上限＋有効期限つきのMap（長期稼働で増え続けるMap/Setの対策）
 *
 * - setした順に並び、上限を超えたら古いものから捨てる（setし直すと最新扱い）
 * - ttl（ミリ秒）を過ぎたものは見えなくなり、set時に古い順から掃除される
 * - ttlにInfinityを渡すと件数上限だけで捨てる
 */
export class TtlMap<K, V> {
	private map: Map<K, { value: V; expiresAt: number }> = new Map();
	private max: number;
	private ttl: number;

	constructor(options: {
		max: number;
		ttl: number; // ミリ秒
	}) {
		this.max = options.max;
		this.ttl = options.ttl;
	}

	get size(): number {
		return this.map.size;
	}

	public has(key: K): boolean {
		const entry = this.map.get(key);
		if (!entry) return false;
		if (entry.expiresAt <= Date.now()) {
			this.map.delete(key);
			return false;
		}
		return true;
	}

	public get(key: K): V | undefined {
		if (!this.has(key)) return undefined;
		return this.map.get(key)?.value;
	}

	public set(key: K, value: V): this {
		this.map.delete(key); // 末尾（最新）に付け直す
		this.map.set(key, { value, expiresAt: Date.now() + this.ttl });
		this.prune();
		return this;
	}

	public delete(key: K): boolean {
		return this.map.delete(key);
	}

	/**
	 * 先頭（古い順）から、期限切れ・上限超過の分を捨てる
	 */
	private prune(): void {
		const now = Date.now();
		for (const [key, entry] of this.map) {
			if (this.map.size <= this.max && entry.expiresAt > now) break;
			this.map.delete(key);
		}
	}
}

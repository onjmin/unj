import { TtlMap } from "./ttl-map.js";

/**
 * スレごとに「このユーザーは済み」を覚える（ｲｲや草を1人1回にする用）
 *
 * userId###threadId を1つのMapに入れると、全体の上限から古いものが捨てられ、
 * 別のスレで数を稼いでから同じスレに押し直せてしまう。
 * スレ単位に分けて、スレの数と1スレあたりの人数の両方に上限を設ける。
 * 1スレの上限に達したら、それ以上の人は「済み」扱いにする（覚えきれない分を押し直させないため）。
 */
export class OncePerThread {
	private threads: TtlMap<number, Set<number>>;
	private maxUsersPerThread: number;

	constructor(options: {
		maxThreads: number;
		maxUsersPerThread: number;
		ttl: number; // ミリ秒（最後に押されてからこの時間で、そのスレの記録を捨てる）
	}) {
		this.threads = new TtlMap({ max: options.maxThreads, ttl: options.ttl });
		this.maxUsersPerThread = options.maxUsersPerThread;
	}

	/**
	 * まだなら記録して true、済み（または上限）なら false
	 */
	public attempt(threadId: number, userId: number): boolean {
		const users = this.threads.get(threadId) ?? new Set<number>();
		if (users.has(userId) || users.size >= this.maxUsersPerThread) {
			return false;
		}
		users.add(userId);
		this.threads.set(threadId, users); // 押されたスレを最新扱いにする
		return true;
	}
}

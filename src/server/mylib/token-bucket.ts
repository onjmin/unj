import { randInt } from "../../common/util.js";

type Bucket = { tokens: number; lastRefill: Date };

const sweepInterval = 1000 * 60; // 満タンのバケツを掃除する間隔

/**
 * 一般的なトークンバケットアルゴリズム。
 * capacity: バケツの最大容量（保持できるトークン数）
 * refillRate: 秒あたりのトークン回復速度
 * costPerAction: 1操作で消費するトークン数
 *
 * キーはユーザーIDのほか、IPなどの文字列も使える。
 */
export class TokenBucket {
	private buckets: Map<number | string, Bucket> = new Map();
	private capacity: number;
	private refillRate: number;
	private costPerAction: number;
	private lastSweep = Date.now();

	constructor(options: {
		capacity: number;
		refillRate: number; // 秒あたりのトークン回復量
		costPerAction: number;
	}) {
		this.capacity = options.capacity;
		this.refillRate = options.refillRate;
		this.costPerAction = options.costPerAction;
	}

	/**
	 * 経過時間ぶん回復した現在のトークン数
	 */
	private currentTokens(bucket: Bucket, now: Date): number {
		const elapsed = (now.getTime() - bucket.lastRefill.getTime()) / 1000; // 秒（小数込み。1秒未満の間隔でも回復させる）
		return Math.min(this.capacity, bucket.tokens + elapsed * this.refillRate);
	}

	/**
	 * 満タンまで回復したバケツは未作成と同じなので捨てる（Mapが増え続けないように）
	 */
	private sweep(now: Date): void {
		if (now.getTime() - this.lastSweep < sweepInterval) return;
		this.lastSweep = now.getTime();
		for (const [key, bucket] of this.buckets) {
			if (this.currentTokens(bucket, now) >= this.capacity) {
				this.buckets.delete(key);
			}
		}
	}

	/**
	 * トークンバケットを更新し、操作可能かチェックする。
	 * @param userId ユーザーID（またはIPなどのキー）
	 * @returns 操作できる場合 true、制限中なら false
	 */
	public attempt(userId: number | string = 0): boolean {
		const now = new Date();
		this.sweep(now);
		const bucket = this.buckets.get(userId) ?? {
			tokens: this.capacity,
			lastRefill: now,
		};

		// 経過時間に応じてトークンを回復
		bucket.tokens = this.currentTokens(bucket, now);
		bucket.lastRefill = now;

		// トークンが足りるか確認
		if (bucket.tokens < this.costPerAction) {
			this.buckets.set(userId, bucket);
			return false; // 制限中
		}

		// トークン消費
		bucket.tokens -= this.costPerAction;
		this.buckets.set(userId, bucket);
		return true;
	}

	/**
	 * 次に投稿可能になるまでの秒数を返す
	 * @param userId ユーザーID（またはIPなどのキー）
	 * @returns 残り秒数（投稿可能なら0）
	 */
	public getCooldownSeconds(userId: number | string = 0): number {
		const now = new Date();
		const bucket = this.buckets.get(userId);

		if (!bucket) {
			// バケツ未作成なら最大トークン数があるので投稿可能
			return 0;
		}

		// 経過時間に応じて回復トークン数を計算
		const currentTokens = this.currentTokens(bucket, now);

		// トークンが足りていれば即投稿可能
		if (currentTokens >= this.costPerAction) return 0;

		// 足りないトークン分の待ち時間を秒単位で返す
		const missingTokens = this.costPerAction - currentTokens;
		return missingTokens / this.refillRate;
	}

	/**
	 * スレ立てなどに長いクールタイムを追加（特別措置）
	 */
	public applyLongRandomLimit(userId: number | string = 0): void {
		// トークンをゼロにして、回復を止める代わりに一時的にlastRefillを未来に飛ばす
		const bucket = this.buckets.get(userId) ?? {
			tokens: this.capacity,
			lastRefill: new Date(),
		};
		const randomMinutes = randInt(120, 180);
		const future = new Date(Date.now() + randomMinutes * 60 * 1000);
		bucket.tokens = 0;
		bucket.lastRefill = future;
		this.buckets.set(userId, bucket);
	}
}

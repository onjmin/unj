import { differenceInSeconds } from "date-fns";
import { randInt } from "../../common/util.js";

/**
 * 一般的なトークンバケットアルゴリズム。
 * capacity: バケツの最大容量（保持できるトークン数）
 * refillRate: 秒あたりのトークン回復速度
 * costPerAction: 1操作で消費するトークン数
 */
export class TokenBucket {
	private buckets: Map<number, { tokens: number; lastRefill: Date }> =
		new Map();
	private capacity: number;
	private refillRate: number;
	private costPerAction: number;

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
	 * トークンバケットを更新し、操作可能かチェックする。
	 * @param userId ユーザーID
	 * @returns 操作できる場合 true、制限中なら false
	 */
	public attempt(userId = 0): boolean {
		const now = new Date();
		const bucket = this.buckets.get(userId) ?? {
			tokens: this.capacity,
			lastRefill: now,
		};

		// 経過時間に応じてトークンを回復
		const elapsed = differenceInSeconds(now, bucket.lastRefill);
		const refillAmount = elapsed * this.refillRate;

		bucket.tokens = Math.min(this.capacity, bucket.tokens + refillAmount);
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
	 * @param userId ユーザーID
	 * @returns 残り秒数（投稿可能なら0）
	 */
	public getCooldownSeconds(userId = 0): number {
		const now = new Date();
		const bucket = this.buckets.get(userId);

		if (!bucket) {
			// バケツ未作成なら最大トークン数があるので投稿可能
			return 0;
		}

		// 経過時間に応じて回復トークン数を計算
		const elapsed = (now.getTime() - bucket.lastRefill.getTime()) / 1000; // 秒
		const currentTokens = Math.min(
			this.capacity,
			bucket.tokens + elapsed * this.refillRate,
		);

		// トークンが足りていれば即投稿可能
		if (currentTokens >= this.costPerAction) return 0;

		// 足りないトークン分の待ち時間を秒単位で返す
		const missingTokens = this.costPerAction - currentTokens;
		return missingTokens / this.refillRate;
	}

	/**
	 * スレ立てなどに長いクールタイムを追加（特別措置）
	 */
	public applyLongRandomLimit(userId = 0): void {
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

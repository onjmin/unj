import { addMinutes, addSeconds, isBefore } from "date-fns";
import { randInt } from "../../common/util.js";

/**
 * トークンバケットアルゴリズムによるレートリミッタ。
 * coolTimesには、次に操作が可能になる未来日時を保存する。
 */
export class TokenBucket {
	private coolTimes: Map<number, Date> = new Map();
	private capacity: number;
	private refillRate: number;
	private costPerAction: number;

	constructor(
		capacitySeconds: number,
		refillRatePerSecond: number,
		costPerAction: number,
	) {
		this.capacity = capacitySeconds / refillRatePerSecond; // バケツ容量を秒単位の最大遅延時間として扱う
		this.refillRate = refillRatePerSecond;
		this.costPerAction = costPerAction;
	}

	/**
	 * ユーザーIDに対してレートリミットをチェックし、問題なければクールタイムを更新します。
	 * @param userId チェックするユーザーのID
	 * @returns リミットに達していない場合は true、達している場合は false (投稿不可)
	 */
	public attempt(userId: number): boolean {
		const now = new Date();
		const currentCoolTime = this.coolTimes.get(userId) ?? now;

		// 1. リミットチェック: 現在時刻がクールタイムを過ぎていないか
		if (isBefore(now, currentCoolTime)) {
			// クールタイム中なのでリミット
			return false;
		}

		// 2. 新しいクールタイムの計算 (トークン消費)

		// 消費したコストの回復に必要な時間 (秒)
		const refillTime = this.costPerAction / this.refillRate;

		let newCoolTime: Date;

		if (isBefore(currentCoolTime, now)) {
			// バケツが満タンまたは回復途中の場合 (前回のクールタイムが過ぎている)
			// 次のクールタイムは現在時刻に回復時間を加算
			newCoolTime = addSeconds(now, refillTime);
		} else {
			// バケツが枯渇している途中 (前回のクールタイムがまだ未来)
			// 既存のクールタイムに回復時間を加算 (さらに枯渇させる)
			newCoolTime = addSeconds(currentCoolTime, refillTime);
		}

		// 3. 最大キャパシティの適用 (クールタイムが過去の投稿で無限に未来へ伸びるのを防ぐ)
		// クールタイムが「現在時刻 + 最大遅延時間 (バケツ容量)」を超えないようにクリップする。
		const maxFutureCoolTime = addSeconds(now, this.capacity);
		if (isBefore(maxFutureCoolTime, newCoolTime)) {
			newCoolTime = maxFutureCoolTime;
		}

		// 4. クールタイムを更新
		this.coolTimes.set(userId, newCoolTime);
		return true;
	}

	/**
	 * 現在のユーザーのクールタイム (次に投稿可能になる日時) を取得します。
	 */
	public getCoolTime(userId: number): Date | undefined {
		return this.coolTimes.get(userId);
	}

	/**
	 * 現在のクールタイムに加えて、2〜3時間 (120分〜180分) のランダムなクールタイムを上乗せします。
	 * このメソッドは、スレ立て成功時などの特別なイベントでのみ使用します。
	 * @param userId クールタイムを延長するユーザーのID
	 */
	public applyLongRandomLimit(userId: number): void {
		const now = new Date();
		const currentCoolTime = this.coolTimes.get(userId) ?? now;

		// 1. ランダムな待ち時間 (120分〜180分) を生成
		const randomMinutes = randInt(120, 180);

		// 2. クールタイムの基準を決定:
		// 既存のクールタイムが現在時刻より未来ならそれを基準に、そうでなければ現在時刻を基準にする。
		const startTime = isBefore(currentCoolTime, now) ? now : currentCoolTime;

		// 3. 長時間リミットを加算
		const longCoolTime = addMinutes(startTime, randomMinutes);

		// 4. coolTimesを新しい長時間のクールタイムで上書き
		this.coolTimes.set(userId, longCoolTime);
	}
}

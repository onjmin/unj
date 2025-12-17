import { addYears, isWithinInterval, set } from "date-fns";

/**
 * 月日指定
 */
export type MonthDay = {
	month: number; // 1-12
	day: number; // 1-31
};

/**
 * 記念日レンジ定義
 */
export type AnniversaryRange = {
	from: MonthDay;
	to: MonthDay;
};

/**
 * 記念日一覧
 */
export const Anniversary = {
	/**
	 * 年末年始
	 * UI切替・軽量モード・挨拶文変更などに使う想定
	 */
	NEW_YEAR: {
		from: { month: 1, day: 1 },
		to: { month: 1, day: 3 },
	},

	/**
	 * バレンタインデー
	 * 単日イベント（2月14日）
	 */
	VALENTINE: {
		from: { month: 2, day: 14 },
		to: { month: 2, day: 14 },
	},

	/**
	 * ホワイトデー
	 * 単日イベント（3月14日）
	 * バレンタインの対となる日
	 */
	WHITE_DAY: {
		from: { month: 3, day: 14 },
		to: { month: 3, day: 14 },
	},

	/**
	 * エイプリルフール
	 * 単日イベント
	 */
	APRIL_FOOL: {
		from: { month: 4, day: 1 },
		to: { month: 4, day: 1 },
	},

	/**
	 * ハロウィン
	 * 当日単体ではなく、直前数日を含める
	 */
	HALLOWEEN: {
		from: { month: 10, day: 25 },
		to: { month: 10, day: 31 },
	},

	/**
	 * クリスマス
	 * イブ〜当日
	 */
	CHRISTMAS: {
		from: { month: 12, day: 24 },
		to: { month: 12, day: 25 },
	},

	/**
	 * 大晦日
	 * 年末演出専用
	 */
	NEW_YEARS_EVE: {
		from: { month: 12, day: 31 },
		to: { month: 12, day: 31 },
	},

	/**
	 * 七夕（日本向け）
	 */
	TANABATA: {
		from: { month: 7, day: 7 },
		to: { month: 7, day: 7 },
	},

	/**
	 * ※ 注意：
	 * イースター（復活祭）は「可変日」。
	 * 年ごとに日付が変わるため、この定数には含めない。
	 *
	 * → 別途 calculateEaster(year) のような関数で算出し、
	 *   ifAnniversary に直接 range を渡す想定。
	 */
} as const satisfies Record<string, AnniversaryRange>;

/* ------------------------------------------------------------------ */
/* 内部ユーティリティ                                                    */
/* ------------------------------------------------------------------ */

const cache = new Map<string, boolean>();

function todayKey(date: Date): string {
	return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function rangeKey(range: AnniversaryRange): string {
	return `${range.from.month}/${range.from.day}-${range.to.month}/${range.to.day}`;
}

/**
 * 指定した日付が記念日レンジ内か判定する
 */
function isInAnniversaryRange(date: Date, range: AnniversaryRange): boolean {
	const year = date.getFullYear();

	const from = set(date, {
		year,
		month: range.from.month - 1,
		date: range.from.day,
		hours: 0,
		minutes: 0,
		seconds: 0,
		milliseconds: 0,
	});

	let to = set(date, {
		year,
		month: range.to.month - 1,
		date: range.to.day,
		hours: 23,
		minutes: 59,
		seconds: 59,
		milliseconds: 999,
	});

	// 年跨ぎ（例: 12/28 → 1/3）
	if (to < from) {
		to = addYears(to, 1);
	}

	const target = date < from ? addYears(date, 1) : date;

	return isWithinInterval(target, { start: from, end: to });
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * 指定した記念日レンジのいずれかに一致する場合は onTrue、
 * 一致しない場合は onFalse の戻り値を返す。
 *
 * 判定結果は「日付単位」でメモ化される。
 */
export function ifAnniversary<T>(
	ranges: readonly AnniversaryRange[],
	onTrue: () => T,
	onFalse: () => T,
): T {
	// const now = new Date();
	const now = new Date(2025, 2 - 1, 14);
	const key = `${todayKey(now)}:${ranges.map(rangeKey).join("|")}`;

	let matched = cache.get(key);

	if (matched === undefined) {
		matched = ranges.some((range) => isInAnniversaryRange(now, range));
		cache.set(key, matched);
	}

	return matched ? onTrue() : onFalse();
}

/**
 * 現在日時が指定した記念日レンジ内か判定する
 */
export function isAnniversary(ranges: readonly AnniversaryRange[]): boolean {
	return ifAnniversary(
		ranges,
		() => true,
		() => false,
	);
}

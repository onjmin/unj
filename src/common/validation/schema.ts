import * as v from "valibot";

const SMALLINT = v.pipe(
	v.number(),
	v.integer(),
	v.minValue(0),
	v.maxValue(32767),
);

const THREAD_ID = v.pipe(v.string(), v.length(8), v.hexadecimal());
const THREAD_TITLE = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1),
	v.maxLength(32),
);
const RES_ID = v.pipe(v.string(), v.length(8), v.hexadecimal());
const RES_NUM = v.pipe(
	v.number(),
	v.integer(),
	v.minValue(1),
	v.maxValue(1005),
);
const USER_NAME = v.pipe(v.string(), v.trim(), v.maxLength(32));
const USER_ID = v.pipe(v.string(), v.maxLength(4), v.hexadecimal());

/**
 * スレ立てのスキーマ
 */
export const MakeThreadSchema = v.object({
	ref_thread_id: THREAD_ID,
	title: THREAD_TITLE,
	res_limit: v.pipe(v.number(), v.integer(), v.minValue(10), v.maxValue(1000)),
	cc_type: SMALLINT,
	content_types_bitmask: SMALLINT,
});

/**
 * レスのスキーマ
 */
export const ResSchema = v.object({
	token: v.pipe(v.string(), v.length(8), v.hexadecimal()),
	user_name: USER_NAME,
	user_icon: SMALLINT,
	content: v.string(), // この段階では簡易的にしか見ない
	content_url: v.string(), // この段階では簡易的にしか見ない
	content_type: v.pipe(
		SMALLINT,
		v.check<number>((n) => (n & (n - 1)) === 0),
	),
});

/**
 * スレ閲覧のスキーマ
 */
export const ReadThreadSchema = v.object({
	cursor: RES_NUM,
	size: RES_NUM,
	desc: v.boolean(),
	thread_id: THREAD_ID,
});

/**
 * ヘッドライン取得のスキーマ
 */
export const HeadlineSchema = v.object({
	cursor: THREAD_ID,
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(64)),
	desc: v.boolean(),
});

/**
 * スレ検索のスキーマ
 */
export const SearchThreadSchema = v.object({
	cursor: THREAD_ID,
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(64)),
	desc: v.boolean(),
	from: v.date(),
	to: v.date(),
	title: THREAD_TITLE,
});

/**
 * レス検索のスキーマ
 */
export const SearchResSchema = v.object({
	cursor: RES_ID,
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(64)),
	desc: v.boolean(),
	from: v.date(),
	to: v.date(),
	user_id: USER_ID,
	user_name: USER_NAME,
	user_icon: SMALLINT,
	content_types_bitmask: SMALLINT,
});

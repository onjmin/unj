import * as v from "valibot";

export const tokenLength = 8;
export const userIdLength = 4;
export const threadIdLength = 8;

const TOKEN = v.pipe(v.string(), v.length(8), v.hexadecimal());
const SMALLINT = v.pipe(
	v.number(),
	v.integer(),
	v.minValue(0),
	v.maxValue(32767),
);

const THREAD_ID = v.pipe(v.string(), v.length(threadIdLength), v.hexadecimal());
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
const USER_ID = v.pipe(v.string(), v.maxLength(userIdLength), v.hexadecimal());

/**
 * コストが低い処理のためtokenの検証は不要
 */
export const getTokenSchema = v.strictObject({});
export const joinHeadlineSchema = v.strictObject({});
export const joinThreadSchema = v.strictObject({
	thread_id: THREAD_ID,
});

/**
 * 草ボタンのスキーマ
 */
export const lolSchema = v.object({
	token: TOKEN,
	thread_id: THREAD_ID,
});

/**
 * ｲｲ!(・∀・)(・Ａ・)ｲｸﾅｲ!
 */
export const likeSchema = v.object({
	token: TOKEN,
	thread_id: THREAD_ID,
	good: v.boolean(),
});

/**
 * スレ立てのスキーマ
 */
export const MakeThreadSchema = v.object({
	title: THREAD_TITLE,
	sage: v.boolean(),
	cc_type: SMALLINT,
	content_types_bitmask: SMALLINT,
	res_limit: v.pipe(v.number(), v.integer(), v.minValue(10), v.maxValue(1000)),
	timer: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(168)),
	ref_thread_id: THREAD_ID,
});

/**
 * レスのスキーマ
 */
export const ResSchema = v.object({
	token: TOKEN,
	thread_id: THREAD_ID,
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
export const ReadThreadSchema = v.strictObject({
	token: TOKEN,
	cursor: v.nullable(RES_NUM),
	size: RES_NUM,
	desc: v.boolean(),
	thread_id: THREAD_ID,
});

/**
 * ヘッドライン取得のスキーマ
 */
export const HeadlineSchema = v.strictObject({
	token: TOKEN,
	cursor: v.nullable(THREAD_ID),
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(16)),
	desc: v.boolean(),
});

/**
 * スレ検索のスキーマ
 */
export const SearchThreadSchema = v.strictObject({
	token: TOKEN,
	cursor: v.nullable(THREAD_ID),
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(16)),
	desc: v.boolean(),
	from: v.date(),
	to: v.date(),
	title: THREAD_TITLE,
});

/**
 * レス検索のスキーマ
 */
export const SearchResSchema = v.strictObject({
	token: TOKEN,
	cursor: v.nullable(RES_ID),
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(16)),
	desc: v.boolean(),
	from: v.date(),
	to: v.date(),
	user_id: USER_ID,
	user_name: USER_NAME,
	user_icon: SMALLINT,
	content_types_bitmask: SMALLINT,
});

import * as v from "valibot";
import { avatarMap } from "./avatar.js";
import { SAFE_TEXT } from "./content-schema.js";

const smallintMax = 2 ** 15 - 1;
const intMax = 2 ** 31 - 1;

export const nonceLength = 16;
export const userIdLength = 16;
export const threadIdLength = 16;
export const resIdLength = 16;
export const hashidsRegex = /^[0-9A-Za-z]+$/;

const SMALLINT = v.pipe(
	v.number(),
	v.integer(),
	v.minValue(0),
	v.maxValue(smallintMax),
);
const INT = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(intMax));

export const SMALLSERIAL = v.pipe(SMALLINT, v.minValue(1));
export const SERIAL = v.pipe(INT, v.minValue(1));

const NONCE = v.pipe(v.string(), v.length(nonceLength), v.hexadecimal());
const USER_ID = v.pipe(
	v.string(),
	v.length(userIdLength),
	v.regex(hashidsRegex),
);
const THREAD_ID = v.pipe(
	v.string(),
	v.length(threadIdLength),
	v.regex(hashidsRegex),
);
const RES_ID = v.pipe(v.string(), v.length(resIdLength), v.regex(hashidsRegex));

const USER_NAME = v.pipe(SAFE_TEXT, v.maxLength(32));
const USER_AVATAR = v.pipe(
	SMALLINT,
	v.check((n) => avatarMap.has(n)),
);
const THREAD_TITLE = v.pipe(SAFE_TEXT, v.minLength(1), v.maxLength(32));
const RES_NUM = v.pipe(
	v.number(),
	v.integer(),
	v.minValue(1),
	v.maxValue(1005),
);

/**
 * コストが低い処理のためNonce値の検証は不要
 */
export const getNonceKeySchema = v.strictObject({});
export const joinHeadlineSchema = v.strictObject({});
export const joinThreadSchema = v.strictObject({
	threadId: THREAD_ID,
});

/**
 * 草ボタンのスキーマ
 */
export const lolSchema = v.object({
	nonce: NONCE,
	threadId: THREAD_ID,
});

/**
 * ｲｲ!(・∀・)(・Ａ・)ｲｸﾅｲ!
 */
export const likeSchema = v.object({
	nonce: NONCE,
	threadId: THREAD_ID,
	good: v.boolean(),
});

/**
 * スレ立てのスキーマ
 */
export const MakeThreadSchema = v.object({
	title: THREAD_TITLE,
	varsan: v.boolean(),
	sage: v.boolean(),
	ccBitmask: SMALLINT,
	contentTypesBitmask: SMALLSERIAL,
	max: v.pipe(v.number(), v.integer(), v.minValue(10), v.maxValue(1000)),
	timer: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(168)),
});

/**
 * レスのスキーマ
 */
export const ResSchema = v.object({
	nonce: NONCE,
	threadId: v.nullable(THREAD_ID), // スレ立てのスキーマにも使うため
	userName: USER_NAME,
	userAvatar: USER_AVATAR,
	content: v.string(), // この段階では簡易的にしか見ない
	contentUrl: v.string(), // この段階では簡易的にしか見ない
	contentType: v.pipe(
		SMALLINT,
		v.check<number>((n) => (n & (n - 1)) === 0),
	),
});

/**
 * スレ閲覧のスキーマ
 */
export const ReadThreadSchema = v.strictObject({
	nonce: NONCE,
	cursor: v.nullable(RES_NUM),
	size: RES_NUM,
	desc: v.boolean(),
	threadId: THREAD_ID,
});

/**
 * ヘッドライン取得のスキーマ
 */
export const HeadlineSchema = v.strictObject({
	nonce: NONCE,
	cursor: v.nullable(THREAD_ID),
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(16)),
	desc: v.boolean(),
});

/**
 * スレ検索のスキーマ
 */
export const SearchThreadSchema = v.strictObject({
	nonce: NONCE,
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
	nonce: NONCE,
	cursor: v.nullable(RES_ID),
	size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(16)),
	desc: v.boolean(),
	from: v.date(),
	to: v.date(),
	userId: USER_ID,
	userName: USER_NAME,
	userAvatar: USER_AVATAR,
	contentTypesBitmask: SMALLSERIAL,
});

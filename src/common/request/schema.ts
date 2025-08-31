import { addDays } from "date-fns";
import * as v from "valibot";
import { avatarMap } from "./avatar.js";
import { SAFE_TEXT_SINGLELINE } from "./content-schema.js";

/**
 * うんJリリース日
 *
 * Date型のバリデーションの下限値や
 * 日数の起算日などに使用する。
 */
export const unjBeginDate = new Date(Date.UTC(2025, 2 - 1, 14));

/**
 * サ終予定日
 *
 * Date型のバリデーションの上限値に使用する。
 */
export const unjEndDate = addDays(unjBeginDate, 114514);

/**
 * valibotに早期リターンさせるためのオプション
 */
export const myConfig = {
	abortEarly: true,
	abortPipeEarly: true,
};

/**
 * 一度に取得できるレコード数上限
 */
export const queryResultLimit = 32;

const smallintMax = 2 ** 15 - 1;
const intMax = 2 ** 31 - 1;

export const nonceLength = 16;
export const userIdLength = 16;
export const threadIdLength = 16;
export const resIdLength = 16;
export const authSignLength = 16;
export const authLimitLength = 16;
export const hashidsRegex = /^[0-9A-Za-z]+$/;

export const SMALLINT = v.pipe(
	v.number(),
	v.integer(),
	v.minValue(0),
	v.maxValue(smallintMax),
);
const INT = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(intMax));

export const SMALLSERIAL = v.pipe(SMALLINT, v.minValue(1));
export const SERIAL = v.pipe(INT, v.minValue(1));

export const isSerial = (n: number) => v.safeParse(SERIAL, n).success;

const NONCE = v.pipe(v.string(), v.length(nonceLength), v.hexadecimal());
const USER_ID = v.pipe(
	v.string(),
	v.length(userIdLength),
	v.regex(hashidsRegex),
);
export const THREAD_ID = v.pipe(
	v.string(),
	v.length(threadIdLength),
	v.regex(hashidsRegex),
);
const RES_ID = v.pipe(v.string(), v.length(resIdLength), v.regex(hashidsRegex));

const AUTH_SIGN = v.pipe(v.string(), v.length(nonceLength), v.hexadecimal());
const AUTH_LIMIT = v.pipe(
	v.string(),
	v.length(authLimitLength),
	v.regex(hashidsRegex),
);

const USER_NAME = v.pipe(SAFE_TEXT_SINGLELINE, v.maxLength(32));
const USER_AVATAR = v.pipe(
	SMALLINT,
	v.check((n) => avatarMap.has(n)),
);
const THREAD_TITLE = v.pipe(
	SAFE_TEXT_SINGLELINE,
	v.minLength(1),
	v.maxLength(32),
);
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
export const lolSchema = v.strictObject({
	nonce: NONCE,
	threadId: THREAD_ID,
});

/**
 * ｲｲ!(・∀・)(・Ａ・)ｲｸﾅｲ!
 */
export const likeSchema = v.strictObject({
	nonce: NONCE,
	threadId: THREAD_ID,
	good: v.boolean(),
});

/**
 * スレ立てのスキーマ
 */
export const MakeThreadSchema = v.strictObject({
	nonce: NONCE,
	title: THREAD_TITLE,
	varsan: v.boolean(),
	sage: v.boolean(),
	ccBitmask: SMALLINT,
	contentTypesBitmask: SMALLSERIAL,
	max: v.pipe(v.number(), v.integer(), v.minValue(10), v.maxValue(1000)),
	timer: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(8760)),
	// 書き込み内容
	userName: USER_NAME,
	userAvatar: USER_AVATAR,
	contentText: v.string(), // この段階では簡易的にしか見ない
	contentUrl: v.string(), // この段階では簡易的にしか見ない
	contentMeta: v.object({}), // この段階では簡易的にしか見ない
	contentType: v.pipe(
		SMALLINT,
		v.check<number>((n) => (n & (n - 1)) === 0),
	),
});

/**
 * レスのスキーマ
 */
export const ResSchema = v.strictObject({
	nonce: NONCE,
	threadId: THREAD_ID,
	// 書き込み内容
	userName: USER_NAME,
	userAvatar: USER_AVATAR,
	contentText: v.string(), // この段階では簡易的にしか見ない
	contentUrl: v.string(), // この段階では簡易的にしか見ない
	contentMeta: v.object({}), // この段階では簡易的にしか見ない
	contentType: v.pipe(
		SMALLINT,
		v.check<number>((n) => (n & (n - 1)) === 0),
	),
	sage: v.boolean(),
	ninja: v.boolean(),
});

/**
 * スレ閲覧のスキーマ
 */
export const ReadThreadSchema = v.strictObject({
	nonce: NONCE,
	cursor: v.nullable(RES_ID),
	limit: v.pipe(RES_NUM, v.maxValue(queryResultLimit)),
	desc: v.boolean(),
	threadId: THREAD_ID,
});

/**
 * ヘッドライン取得のスキーマ
 */
export const HeadlineSchema = v.strictObject({
	nonce: NONCE,
	cursor: v.nullable(
		v.pipe(
			v.string(),
			v.transform((s) => new Date(s)),
			v.date(),
			v.toMinValue(unjBeginDate),
			v.toMaxValue(unjEndDate),
		),
	),
	limit: v.pipe(
		v.number(),
		v.integer(),
		v.minValue(1),
		v.maxValue(queryResultLimit),
	),
	desc: v.boolean(),
});

/**
 * JWT風トークンのスキーマ
 */
export const AuthSchema = v.strictObject({
	sign: AUTH_SIGN,
	userId: USER_ID,
	limit: AUTH_LIMIT,
});

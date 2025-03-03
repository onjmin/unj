import { differenceInDays } from "date-fns";
import Hashids from "hashids";
import { sha256 } from "js-sha256";

const VITE_UNJ_FLAKY_RATE = Number(process.env.VITE_UNJ_FLAKY_RATE);

/**
 * 再現性を下げる
 */
export const flaky = (func: () => void): boolean => {
	if (Math.random() > VITE_UNJ_FLAKY_RATE) {
		func();
		return true;
	}
	return false;
};

const delimiter = "###";

const VITE_UNJ_API_SECRET_PEPPER = String(
	process.env.VITE_UNJ_API_SECRET_PEPPER,
);

/**
 * うんｊAPIトークンの生成
 */
export const genUnjApiToken = (key: string): string => {
	const token = sha256([VITE_UNJ_API_SECRET_PEPPER, key].join(delimiter));
	return token.slice(0, 8); // 衝突の心配が低いので8文字に削減
};

const HASHIDS_SECRET_PEPPER = process.env.HASHIDS_SECRET_PEPPER ?? "";
const USER_ID_LENGTH = Number(process.env.USER_ID_LENGTH);
const THREAD_ID_LENGTH = Number(process.env.THREAD_ID_LENGTH);

/**
 * フロントエンドに晒せるようにユーザーIDを符号化する
 */
export const encodeUserId = (userId: string): string => {
	const basedTime = differenceInDays(new Date(), new Date(0));
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER, basedTime].join(delimiter),
		USER_ID_LENGTH,
	);
	return hashids.encode(userId);
};

/**
 * フロントエンド上のユーザーIDを復号する
 */
export const decodeUserId = (userId: string): string => {
	const basedTime = differenceInDays(new Date(), new Date(0));
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER, basedTime].join(delimiter),
		USER_ID_LENGTH,
	);
	return String(hashids.decode(userId)[0]);
};

/**
 * フロントエンドに晒せるようにスレッドIDを符号化する
 */
export const encodeThreadId = (threadId: string): string => {
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER].join(delimiter),
		THREAD_ID_LENGTH,
	);
	return hashids.encode(threadId);
};

/**
 * フロントエンド上のスレッドIDを復号する
 */
export const decodeThreadId = (threadId: string): string => {
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER].join(delimiter),
		THREAD_ID_LENGTH,
	);
	return String(hashids.decode(threadId)[0]);
};

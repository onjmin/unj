import { differenceInDays } from "date-fns";
import Hashids from "hashids";
import { sha256 } from "js-sha256";
import {
	nonceLength,
	resIdLength,
	threadIdLength,
	userIdLength,
} from "../../common/request/schema.js";

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

const VITE_UNJ_NONCE_SECRET_PEPPER = String(
	process.env.VITE_UNJ_NONCE_SECRET_PEPPER,
);

/**
 * Nonce値の生成
 */
export const genNonce = (key: string): string => {
	const str = sha256([VITE_UNJ_NONCE_SECRET_PEPPER, key].join(delimiter));
	return str.slice(0, nonceLength);
};

const HASHIDS_SECRET_PEPPER = process.env.HASHIDS_SECRET_PEPPER ?? "";

/**
 * フロントエンドに晒せるようにユーザーIDを符号化する
 */
export const encodeUserId = (userId: number, date: Date): string => {
	const basedTime = differenceInDays(date, new Date(0));
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER, basedTime].join(delimiter),
		userIdLength,
	);
	return hashids.encode(userId);
};

/**
 * フロントエンド上のユーザーIDを復号する
 */
export const decodeUserId = (userId: string, date: Date): number | null => {
	const basedTime = differenceInDays(date, new Date(0));
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER, basedTime].join(delimiter),
		userIdLength,
	);
	const n = hashids.decode(userId)?.[0];
	return n ? Number(n) : null;
};

/**
 * フロントエンドに晒せるようにスレッドIDを符号化する
 */
export const encodeThreadId = (threadId: number): string => {
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER].join(delimiter),
		threadIdLength,
	);
	return hashids.encode(threadId);
};

/**
 * フロントエンド上のスレッドIDを復号する
 */
export const decodeThreadId = (threadId: string): number | null => {
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER].join(delimiter),
		threadIdLength,
	);
	const n = hashids.decode(threadId)?.[0];
	return n ? Number(n) : null;
};

/**
 * フロントエンドに晒せるようにレスIDを符号化する
 */
export const encodeResId = (resId: number): string => {
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER].join(delimiter),
		resIdLength,
	);
	return hashids.encode(resId);
};

/**
 * フロントエンド上のレスIDを復号する
 */
export const decodeResId = (resId: string): number | null => {
	const hashids = new Hashids(
		[HASHIDS_SECRET_PEPPER].join(delimiter),
		resIdLength,
	);
	const n = hashids.decode(resId)?.[0];
	return n ? Number(n) : null;
};

import Hashids from "hashids";
import { sha256 } from "js-sha256";
import { hashidsRegex } from "./request/schema.js";

const delimiter = "###";

/**
 * 安全なチェックサムを計算する
 *
 * ユーザーにとって総当たりの試行が容易なのでチェックサムにしては多めに取る。
 * 桁数の判定がし易いように最終的な文字長は4の倍数+3とする。
 */
const genCheckSum = (encoded: string, pepper: string): string => {
	const str = sha256([pepper, encoded].join(delimiter));
	return str.slice(0, CHECKSUM_LENGTH);
};

const CHECKSUM_LENGTH = 3; // 桁数を判定し易くするために最終的な文字長は4の倍数+3
const HASHIDS_UNIT = 4; // 62^4=14,776,336なので、CodePoint(0x10FFFF)の範囲では衝突しない

/**
 * 人為的に改ざんされていないか簡単なテスト
 */
export const isSecureValue = (str: string) => {
	if (
		str.length < HASHIDS_UNIT + CHECKSUM_LENGTH ||
		str.length % HASHIDS_UNIT !== CHECKSUM_LENGTH
	) {
		return false;
	}
	return hashidsRegex.test(str);
};

/**
 * 複号
 */
export const decode = (value: string | null, pepper: string): string | null => {
	if (value === null || !isSecureValue(value)) {
		return null;
	}
	const checksum = value.slice(-CHECKSUM_LENGTH);
	const encoded = value.slice(0, -CHECKSUM_LENGTH);
	if (genCheckSum(encoded, pepper) !== checksum) {
		return null;
	}
	const hashids = new Hashids(pepper, HASHIDS_UNIT);
	const encodedArray = Array.from(encoded).flatMap((_, i, arr) =>
		i % HASHIDS_UNIT === 0 ? [arr.slice(i, i + HASHIDS_UNIT).join("")] : [],
	);
	const decoded = encodedArray
		.map((v) => hashids.decode(v))
		.map((v) => String.fromCodePoint(Number(v)))
		.join("");
	return decoded;
};

/**
 * 符号化
 */
export const encode = (value: string | null, pepper: string): string | null => {
	if (value === null) {
		return null;
	}
	const hashids = new Hashids(pepper, HASHIDS_UNIT);
	const encoded = [...value]
		.map((v) => String(v.codePointAt(0))) // 危険なキャストだが、組み込み関数なので信用する
		.map((v) => hashids.encode(v))
		.join("");
	const secureValue = encoded + genCheckSum(encoded, pepper);
	if (!isSecureValue(secureValue)) {
		return null;
	}
	return secureValue;
};

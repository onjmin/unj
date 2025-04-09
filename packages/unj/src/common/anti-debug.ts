import Hashids from "hashids";
import { sha256 } from "js-sha256";
import { hashidsRegex } from "./request/schema.js";

const delimiter = "###";

/**
 * 安全なチェックサムを計算する
 *
 * ユーザーにとって総当たりの試行が容易なのでチェックサムにしては多めに取る。
 */
const genCheckSum = (encoded: string, pepper: string): string => {
	const str = sha256([pepper, encoded].join(delimiter));
	return str.slice(0, CHECKSUM_LENGTH);
};

const CHECKSUM_LENGTH = 4; // 桁数を判定し易くするために最終的な文字長は5の倍数+4
const HASHIDS_UNIT = 5; // 0x10FFFFを変換すると5文字になる

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
		.map((v) => v.codePointAt(0) ?? 0)
		.map((v) => hashids.encode(v))
		.join("");
	const secureValue = encoded + genCheckSum(encoded, pepper);
	if (!isSecureValue(secureValue)) {
		return null;
	}
	return secureValue;
};

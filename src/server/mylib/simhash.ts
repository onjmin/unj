import { TtlMap } from "./ttl-map.js";

// userId → 直近のsimhash（しばらく書き込みのないユーザーの分から捨てる）
const simhashCache: TtlMap<number, number[]> = new TtlMap({
	max: 10000,
	ttl: 1000 * 60 * 60 * 24,
});
const allowedSameCount = 3;

/**
 * 「✋🥹大家都是Puyuyu」を弾くための実装
 */
export const isSameSimhash = (text: string, userId: number): boolean => {
	if (text.length < 4) return false;
	if (text.startsWith("!gen")) return false; // 画像生成コマンドの場合は免除
	const simhash = calcSimhash(text);
	if (!simhash) return false;
	const simhashLog = simhashCache.get(userId);
	if (simhashLog) {
		const isSame = simhashLog
			.slice(0, allowedSameCount)
			.every((v) => hammingDistance32(v, simhash) < 8);
		if (isSame) {
			return true;
		}
		simhashLog.unshift(simhash);
		simhashCache.set(userId, simhashLog.slice(0, allowedSameCount));
		return false;
	}
	simhashCache.set(userId, [simhash]);
	return false;
};

const calcSimhash = (text: string, ngram = 3, hashbits = 32) => {
	const normalized = text.replace(/\s+/g, "");
	if (normalized.length === 0) return null;

	// n-gramを作成（重複削除）
	const gramsSet = new Set<string>();
	for (let i = 0; i < normalized.length - ngram + 1; i++) {
		gramsSet.add(normalized.slice(i, i + ngram));
	}

	const vector = Array(hashbits).fill(0);

	for (const gram of gramsSet) {
		const hash = fnv1a32(gram);

		for (let i = 0; i < hashbits; i++) {
			const bit = (hash >> i) & 1;
			vector[i] += bit === 1 ? 1 : -1;
		}
	}

	let fingerprint = 0;
	for (let i = 0; i < hashbits; i++) {
		if (vector[i] > 0) {
			fingerprint |= 1 << i;
		}
	}

	return fingerprint >>> 0;
};

/**
 * 軽量FNV-1aハッシュ
 */
const fnv1a32 = (str: string) => {
	let hash = 0x811c9dc5; // FNV offset basis for 32bit
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash = (hash * 0x01000193) >>> 0; // FNV prime for 32bit
	}
	return hash >>> 0; // unsigned
};

/**
 * ハミング距離
 */
const hammingDistance32 = (hash1: number, hash2: number): number => {
	let xor = hash1 ^ hash2;
	let dist = 0;
	while (xor) {
		dist += xor & 1;
		xor >>>= 1; // unsigned 右シフト
	}
	return dist;
};

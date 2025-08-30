import { sha256 } from "js-sha256";

/**
 * nミリ秒待機
 */
export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

/**
 * ランダム整数
 */
export const randInt = (min: number, max: number) =>
	Math.floor(Math.random() * Math.abs(max - min + 1)) + min;

/**
 * ランダム抽出
 */
export const randArray = <T>(array: readonly T[]): T | undefined =>
	array[Math.floor(Math.random() * array.length)];

/**
 * 再現性のある乱数
 */
const seededRandom = (seed: string) =>
	Number.parseInt(sha256(seed).slice(0, 4), 16) / 0x10000;

/**
 * ランダム抽出（再現性あり）
 */
export const seededRandArray = <T>(
	array: readonly T[],
	seed: string,
): T | undefined => array[Math.floor(seededRandom(seed) * array.length)];

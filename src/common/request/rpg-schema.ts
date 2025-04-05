import * as v from "valibot";
import { THREAD_ID } from "./schema.js";

export const WIDTH = 7;
export const HEIGHT = 11;

const sAnimsIdMax = 2091;
const S_ANIMS_ID = v.pipe(
	v.number(),
	v.integer(),
	v.minValue(1),
	v.maxValue(sAnimsIdMax),
);

/**
 * RPGのスキーマ
 */
export const RpgInitSchema = v.strictObject({
	threadId: THREAD_ID,
	sAnimsId: S_ANIMS_ID,
});

/**
 * RPGのスキーマ
 */
export const RpgPatchSchema = v.strictObject({
	threadId: THREAD_ID,
	sAnimsId: S_ANIMS_ID,
	x: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(WIDTH - 1)),
	y: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(HEIGHT - 1)),
	direction: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(3)),
});

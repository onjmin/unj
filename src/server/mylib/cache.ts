import type { Res, Thread } from "../../common/response/schema.js";

export const cached: Map<number, boolean> = new Map();
// 高度な設定
export const varsanCache: Map<number, boolean> = new Map();
export const sageCache: Map<number, boolean> = new Map();
export const ccBitmaskCache: Map<number, number> = new Map();
export const contentTypesBitmaskCache: Map<number, number> = new Map();
export const resLimitCache: Map<number, number> = new Map();
export const deletedAtCache: Map<number, Date | null> = new Map();
// 動的なデータ
export const resCountCache: Map<number, number> = new Map();
export const ageResCache: Map<number, Res | null> = new Map();
export const lolCountCache: Map<number, number> = new Map();
export const goodCountCache: Map<number, number> = new Map();
export const badCountCache: Map<number, number> = new Map();
// スレ主
export const ownerIdCache: Map<number, number> = new Map();
// 忍法帖スコア
export const ninjaPokemonCache: Map<number, number> = new Map();
export const ninjaScoreCache: Map<number, number> = new Map();

/**
 * !timer満了
 */
export const isExpired = (threadId: number) => {
	const deletedAt = deletedAtCache.get(threadId);
	if (deletedAt) {
		if (new Date() > deletedAt) {
			return true;
		}
	}
	return false;
};

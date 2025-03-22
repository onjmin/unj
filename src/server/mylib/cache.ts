import type { Socket } from "socket.io";
import type { Ninja, Res } from "../../common/response/schema.js";
import auth from "./auth.js";

export const threadCached: Map<number, boolean> = new Map();
export const firstCursorCache: Map<number, number> = new Map();
export const latestCursorCache: Map<number, number> = new Map();
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
export const balsResNumCache: Map<number, number> = new Map();
export const lolCountCache: Map<number, number> = new Map();
export const goodCountCache: Map<number, number> = new Map();
export const badCountCache: Map<number, number> = new Map();
// スレ主
export const ownerIdCache: Map<number, number> = new Map();
// アク禁＆副主
export const bannedCache: Map<number, Set<number>> = new Map();
export const subbedCache: Map<number, Set<number>> = new Map();

export const userCached: Map<number, boolean> = new Map();
// 忍法帖スコア
export const ninjaPokemonCache: Map<number, number> = new Map();
export const ninjaScoreCache: Map<number, number> = new Map();

/**
 * !timer満了
 */
export const isDeleted = (threadId: number): boolean => {
	const deletedAt = deletedAtCache.get(threadId);
	if (deletedAt) {
		return new Date() > deletedAt;
	}
	return false;
};

/**
 * 上限レス数到達
 */
export const isMax = (threadId: number, isOwner: boolean): boolean => {
	const resCount = resCountCache.get(threadId) ?? 0;
	const resLimit = resLimitCache.get(threadId) ?? 0;
	// 次スレ誘導のためにスレ主は+5まで投稿可能
	return resCount >= resLimit + (isOwner ? 5 : 0);
};

/**
 * 忍法帖
 */
export const ninja = (socket: Socket) => {
	const userId = auth.getUserId(socket);
	const ninja: Ninja = {
		pokemon: ninjaPokemonCache.get(userId) ?? 0,
		score: ninjaScoreCache.get(userId) ?? 0,
	};
	socket.emit("ninja", {
		ok: true,
		ninja,
	});
};

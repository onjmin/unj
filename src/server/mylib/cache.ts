import type { Socket } from "socket.io";
import type { Ninja, Res } from "../../common/response/schema.js";
import auth from "./auth.js";

// スレのキャッシュフラグ
export const threadCached: Map<number, boolean> = new Map();
// 書き込み内容
export const ccUserIdCache: Map<number, string> = new Map();
export const ccUserNameCache: Map<number, string> = new Map();
export const ccUserAvatarCache: Map<number, number> = new Map();
export const contentTextCache: Map<number, string> = new Map();
export const contentUrlCache: Map<number, string> = new Map();
export const contentTypeCache: Map<number, number> = new Map();
export const contentDataCache: Map<number, string> = new Map();
// アニメ/歩行グラ投稿（unj-reze由来）。imageSrcがスプライトシートのときのコマ数/fps/歩行規格ラベル
export const animFramesCache: Map<number, number | null> = new Map();
export const animFpsCache: Map<number, number | null> = new Map();
export const walkPresetCache: Map<number, string | null> = new Map();
// メタ情報
export const createdAtCache: Map<number, Date> = new Map();
export const userIdCache: Map<number, number> = new Map();
// 基本的な情報
export const titleCache: Map<number, string> = new Map();
export const boardIdCache: Map<number, number> = new Map();
// 高度な設定
export const varsanCache: Map<number, boolean> = new Map();
export const sageCache: Map<number, boolean> = new Map();
export const ccBitmaskCache: Map<number, number> = new Map();
export const contentTypesBitmaskCache: Map<number, number> = new Map();
export const resLimitCache: Map<number, number> = new Map();
export const deletedAtCache: Map<number, Date | null> = new Map();
// 動的なデータ
export const resCountCache: Map<number, number> = new Map();
export const psCache: Map<number, string> = new Map();
export const ageResNumCache: Map<number, number> = new Map();
export const ageResCache: Map<number, Res | null> = new Map();
export const balsResNumCache: Map<number, number> = new Map();
// 次スレ誘導（threads.next_thread_id のミラー）。生成済みかの高速判定用で、
// 権威はDB側（next-thread.tsがFOR UPDATEで確認する）。
export const nextThreadIdCache: Map<number, number> = new Map();
export const lolCountCache: Map<number, number> = new Map();
export const goodCountCache: Map<number, number> = new Map();
export const badCountCache: Map<number, number> = new Map();
// スレ主
export const ownerIdCache: Map<number, number> = new Map();
export const ownerIpCache: Map<number, string> = new Map();
// アク禁＆副主
export const bannedCache: Map<number, Set<number>> = new Map();
export const bannedIPCache: Map<number, Set<string>> = new Map();
export const subbedCache: Map<number, Set<number>> = new Map();

// ユーザーのキャッシュフラグ
export const userCached: Map<number, boolean> = new Map();
export const userIPCache: Map<number, string> = new Map();
export const ninjaPokemonCache: Map<number, number> = new Map();
export const ninjaScoreCache: Map<number, number> = new Map();

/**
 * キャッシュの上限（長期稼働で増え続ける対策）
 *
 * スレ1件あたり数KB程度。閲覧中などで捨てられないものは上限を超えても残す。
 */
const threadCacheLimit = 1000;
const threadCacheTtl = 1000 * 60 * 60 * 24; // 最後にreadThreadされてから
// アク禁などを持つスレを残す期間（どうせ再起動で消える状態なので無期限にはしない）
const memoryOnlyStateTtl = 1000 * 60 * 60 * 24 * 7;
const userCacheLimit = 10000;
// IPは!akuで引かれるので多めに残す
const userIPCacheLimit = 50000;

// threadId → 最後にreadThreadされた時刻（古い順に並ぶ）
const threadReadAt: Map<number, number> = new Map();

// スレ単位のキャッシュ（捨てる時はまとめて消す）
const threadCaches: { delete: (threadId: number) => boolean }[] = [
	threadCached,
	ccUserIdCache,
	ccUserNameCache,
	ccUserAvatarCache,
	contentTextCache,
	contentUrlCache,
	contentTypeCache,
	contentDataCache,
	animFramesCache,
	animFpsCache,
	walkPresetCache,
	createdAtCache,
	userIdCache,
	titleCache,
	boardIdCache,
	varsanCache,
	sageCache,
	ccBitmaskCache,
	contentTypesBitmaskCache,
	resLimitCache,
	deletedAtCache,
	resCountCache,
	psCache,
	ageResNumCache,
	ageResCache,
	balsResNumCache,
	nextThreadIdCache,
	lolCountCache,
	goodCountCache,
	badCountCache,
	ownerIdCache,
	ownerIpCache,
	bannedCache,
	bannedIPCache,
	subbedCache,
];

/**
 * readThreadされたスレを最新扱いにする
 */
export const touchThreadCache = (threadId: number) => {
	threadReadAt.delete(threadId);
	threadReadAt.set(threadId, Date.now());
};

/**
 * スレのキャッシュを捨てる（次のreadThreadでDBから読み直される）
 */
export const uncacheThread = (threadId: number) => {
	for (const cache of threadCaches) cache.delete(threadId);
	threadReadAt.delete(threadId);
};

/**
 * DBに無くメモリ上にしかない状態（アク禁・副主・スレ主の変更）を持つか
 */
const hasMemoryOnlyState = (threadId: number): boolean =>
	(bannedCache.get(threadId)?.size ?? 0) > 0 ||
	(bannedIPCache.get(threadId)?.size ?? 0) > 0 ||
	(subbedCache.get(threadId)?.size ?? 0) > 0 ||
	ownerIdCache.get(threadId) !== userIdCache.get(threadId);

/**
 * もう誰も書き込めないスレ（アク禁・副主などは今後のレスにしか効かない）
 */
const isClosed = (threadId: number): boolean =>
	isDeleted(threadId) ||
	(balsResNumCache.get(threadId) ?? 0) > 0 ||
	isMax(threadId, true);

/**
 * 古いスレのキャッシュから捨てる
 *
 * - 上限超過分と、最後に読まれてから時間の経ったものが対象
 * - keepがtrueのスレ（閲覧中・DB未反映の草など）は残す
 * - メモリ上にしかない状態を持つスレは、まだ書き込めて最近読まれたものだけ残す
 */
export const pruneThreadCache = (keep: (threadId: number) => boolean) => {
	const now = Date.now();
	for (const [threadId, readAt] of threadReadAt) {
		const elapsed = now - readAt;
		if (threadReadAt.size <= threadCacheLimit && elapsed < threadCacheTtl)
			break;
		if (keep(threadId)) continue;
		if (
			elapsed < memoryOnlyStateTtl &&
			!isClosed(threadId) &&
			hasMemoryOnlyState(threadId)
		)
			continue;
		uncacheThread(threadId);
	}
};

/**
 * 上限を超えたら古いユーザーのキャッシュから捨てる（書き込み時などにDBから読み直される）
 *
 * 接続中のユーザーは残す。通常の利用で上限に届くことはない想定の保険。
 */
export const pruneUserCache = (getOnlineUserIds: () => Set<number>) => {
	if (userCached.size <= userCacheLimit && userIPCache.size <= userIPCacheLimit)
		return;
	const online = getOnlineUserIds();
	for (const userId of userCached.keys()) {
		if (userCached.size <= userCacheLimit) break;
		if (online.has(userId)) continue;
		userCached.delete(userId);
		ninjaPokemonCache.delete(userId);
		ninjaScoreCache.delete(userId);
	}
	for (const userId of userIPCache.keys()) {
		if (userIPCache.size <= userIPCacheLimit) break;
		if (online.has(userId)) continue;
		userIPCache.delete(userId);
	}
};

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
	return resCount >= resLimit + (isOwner && resLimit === 1000 ? 5 : 0);
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

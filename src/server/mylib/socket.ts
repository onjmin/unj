import type { Server, Socket } from "socket.io";

/**
 * 1ユーザー（IP）あたりの同時接続上限（複タブ対策）
 */
export const limitByIP = 2;

/**
 * 全体 broadcast（io.emit）を安全に処理できる最大接続数
 * 想定環境: 0.25 vCPU / 256 MB RAM / 2 GB Disk
 */
export const broadcastLimit = 16;

/**
 * 総 socket 接続数の設計上の上限（ broadcastLimit の約 3 倍）
 *
 * 簡潔な根拠（事実ベース）:
 * 1) 全体 broadcast が増えると単一 emit のコストが急増するため、broadcastLimit を設けている。
 * 2) broadcast を抑制して room 単位にフォールバックしても、Emitter / イベントループ / ネットワーク / DB / トランザクション等の
 *    負荷は残る（＝完全にゼロになるわけではない）。
 * 3) その残留負荷に対する運用上のヘッドルーム（ピーク・GC・同期負荷の吸収）を確保するために、
 *    broadcastLimit の約 3 倍を保守的目安として採用している（＝×3 はタブ数から導出した数値ではない）。
 *
 * 注: 「×3」は設計上の保守的マージンであり、複タブ上限（ limitByIP ）とは独立。
 *      実測で負荷が出れば観測に応じてこの係数を調整してください。
 */
export const totalSocketConnectionsLimit = broadcastLimit * 3;

let accessCount = 0;
export const getAccessCount = () => accessCount;
export const incrementAccessCount = () => accessCount++;

/**
 * Map<IP, Set<socket.id>>
 */
export const online: Map<string, Set<string>> = new Map();

export const getHeadlineRoom = (boardId: number) => `headline:${boardId}`;
export const getThreadRoom = (threadId: number) => `thread:${threadId}`;

/**
 * roomの存在チェック
 */
export const exist = (io: Server, room: string) =>
	io.sockets.adapter.rooms.has(room);

/**
 * roomの人数算出
 */
export const sizeOf = (io: Server, room: string) =>
	io.sockets.adapter.rooms.get(room)?.size ?? 0;

/**
 * roomに参加しているか
 */
export const joined = (socket: Socket, newRoom: string) =>
	socket.rooms.has(newRoom);

/**
 * 2つ以上のroomに参加させない
 */
export const switchTo = async (
	socket: Socket,
	newRoom: string,
): Promise<boolean> => {
	if (joined(socket, newRoom)) {
		return false;
	}
	// 途中でループ回数が減る可能性あり
	for (const room of socket.rooms) {
		if (room !== socket.id) {
			await socket.leave(room);
		}
	}
	await socket.join(newRoom);
	return true;
};

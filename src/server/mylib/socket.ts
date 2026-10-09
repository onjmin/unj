import type { Server, Socket } from "socket.io";

/**
 * 1ユーザー（IP）あたりの同時接続上限（複タブ対策）
 *
 * 方針:
 * - 低リソース環境では、タブ数の増加がそのまま
 *   メモリ・イベントループ負荷に直結するため、UXを損なわない最小限の値で機械的に制限する。
 */
export const limitByIP = 2;

/**
 * 1拠点（IPv6の/48）あたりの同時接続上限
 *
 * 方針:
 * - /48や/56を持っていれば/64を乗り換えて limitByIP をすり抜けられるので、2段目で抑える。
 * - モバイル回線は近くの/64を別の契約者に配ることがあるため、limitByIP よりかなり緩くする。
 * - IPv4には使わない（limitByIP と同じ単位になるため）。
 */
export const limitByIPPrefix = 8;

/**
 * 1ユーザー（userId）あたりの同時接続上限
 *
 * 方針:
 * - IPを使い捨てられても、同じトークンで全体の接続枠を占有されないようにする。
 * - 回線の切り替え（Wi-Fi⇔モバイル）で古い接続が少し残る分だけ limitByIP より1つ多い。
 */
export const limitByUserId = 3;

/**
 * 全体 broadcast（io.emit）を許可する最大接続数
 *
 * 方針:
 * - broadcast は最も高コストな操作であり、イベントループ遅延の主要因になる。
 * - この値を超えた場合は、room 単位または個別送信へ強制的にフォールバックする。
 *
 * 想定環境: 0.25 vCPU / 256 MB RAM
 */
export const broadcastLimit = 12;

/**
 * 総 socket 接続数の設計上の上限
 *
 * 方針:
 * - broadcast を禁止した状態でも、接続数の増加に伴う管理コスト（timer / heartbeat / Map 操作等）は残る。
 * - イベントループ遅延が顕在化する前に、機械的に接続を抑止するための上限。
 *
 * 注:
 * - 複タブ制限（limitByIP）とは独立した設計値。
 * - 実測（event loop lag / RSS）に応じて調整する前提。
 */
export const totalSocketConnectionsLimit = 36;

let accessCount = 0;
export const getAccessCount = () => accessCount;
export const incrementAccessCount = () => accessCount++;

/**
 * Map<IP（IPv6は/64）, Set<socket.id>>
 */
export const online: Map<string, Set<string>> = new Map();

/**
 * Map<IPv6の/48, Set<socket.id>>
 */
export const onlineByIPPrefix: Map<string, Set<string>> = new Map();

/**
 * Map<userId, Set<socket.id>>
 */
export const onlineByUserId: Map<number, Set<string>> = new Map();

/**
 * 同時接続の枠を1つ取る。上限なら null、取れたら切断時に呼ぶ解放関数を返す
 */
export const acquireSlot = <K>(
	map: Map<K, Set<string>>,
	key: K,
	socketId: string,
	limit: number,
): (() => void) | null => {
	const s = map.get(key) ?? new Set<string>();
	if (s.size >= limit) return null;
	s.add(socketId);
	map.set(key, s);
	return () => {
		s.delete(socketId);
		if (s.size === 0 && map.get(key) === s) map.delete(key);
	};
};

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

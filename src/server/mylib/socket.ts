import type { Server, Socket } from "socket.io";

export const headlineRoom = "headline";
export const getThreadRoom = (threadId: number) => `thread:${threadId}`;

/**
 * 人数算出
 */
export const count = (io: Server, room: string) =>
	io.sockets.adapter.rooms.get(room)?.size ?? 0;

/**
 * 2つ以上の部屋に入らない
 */
export const switchRoom = async (
	socket: Socket,
	newRoom: string,
): Promise<boolean> => {
	// 現在のルーム一覧のコピーを取得（自身のIDは含む）
	const currentRooms = Array.from(socket.rooms);

	// 新しいルームにすでに参加している場合は何もしない
	if (currentRooms.includes(newRoom)) {
		return false;
	}

	// 自分のデフォルトルーム（socket.id）以外から退出
	for (const room of currentRooms) {
		if (room !== socket.id) {
			await socket.leave(room);
		}
	}

	await socket.join(newRoom);
	return true;
};

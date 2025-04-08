import type { Server, Socket } from "socket.io";

/**
 * Map<IP, Set<socket.id>>
 */
export type Online = Map<string, Set<string>>;
export const headlineRoom = "headline";
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

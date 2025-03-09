import type { Socket } from "socket.io";

/**
 * user新規発行 || user特定してauthにセット
 */
export const init = (socket: Socket) => {
	// TODO: 新規user発行 || usersテーブルからユーザーを特定する
	socket.data.auth = "onjmin";
	socket.data.userId = 1;
};

export const get = (socket: Socket): string => socket.data.auth;
export const getUserId = (socket: Socket): number => socket.data.userId;

export default {
	init,
	get,
	getUserId,
};

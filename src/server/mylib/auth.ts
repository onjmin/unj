import type { Socket } from "socket.io";

/**
 * user新規発行 || user特定してauthにセット
 */
export const init = (socket: Socket, auth: string) => {
	socket.data.auth = auth;
	socket.data.id = 334;
};

export const get = (socket: Socket): string => String(socket.data.auth);

export default {
	init,
	get,
};

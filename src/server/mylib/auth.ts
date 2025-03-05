import type { Socket } from "socket.io";

/**
 * user新規発行 || user特定してauthにセット
 */
export const init = (socket: Socket, auth: string) => {
	socket.data.auth = auth;
};

export const get = (socket: Socket): string => String(socket.data.auth);

export default {
	init,
	get,
};

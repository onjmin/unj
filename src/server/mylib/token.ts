import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";

const tokens: Map<string, string> = new Map();
const locks: Map<string, boolean> = new Map();

const genToken = () => sha256(Math.random().toString(36)).slice(0, 8);

export const init = (socket: Socket, auth: string) => {
	if (!tokens.has(auth)) {
		tokens.set(auth, genToken());
		locks.set(auth, false);
	}
	socket.data.auth = auth;
};

const a = (socket: Socket) => String(socket.data.auth);

export const lock = (socket: Socket) => locks.set(a(socket), true);
export const unlock = (socket: Socket) => locks.set(a(socket), false);
export const update = (socket: Socket) => tokens.set(a(socket), genToken());
export const get = (socket: Socket): string | null =>
	locks.get(a(socket)) ? null : (tokens.get(a(socket)) ?? null);
export const isValid = (socket: Socket, token: string) => {
	console.log(
		"🥺",
		tokens.get(a(socket)) === token,
		tokens.get(a(socket)),
		token,
	);
	return tokens.get(a(socket)) === token;
};

export default {
	lock,
	unlock,
	init,
	update,
	get,
	isValid,
};

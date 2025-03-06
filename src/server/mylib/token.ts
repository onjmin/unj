import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { genUnjApiToken } from "./anti-debug.js";
import Auth from "./auth.js";

const tokens: Map<string, string> = new Map();
const locks: Map<string, boolean> = new Map();

const genToken = () => sha256(Math.random().toString(36)).slice(0, 8);

export const init = (socket: Socket) => {
	const auth = Auth.get(socket);
	if (!tokens.has(auth)) {
		tokens.set(auth, genToken());
		locks.set(auth, false);
	}
};

export const lock = (socket: Socket) => locks.set(Auth.get(socket), true);
export const unlock = (socket: Socket) => locks.set(Auth.get(socket), false);
export const update = (socket: Socket) =>
	tokens.set(Auth.get(socket), genToken());
export const get = (socket: Socket): string | null =>
	locks.get(Auth.get(socket)) ? null : (tokens.get(Auth.get(socket)) ?? null);
export const isValid = (socket: Socket, token: string) => {
	const result = locks.get(Auth.get(socket))
		? false
		: genUnjApiToken(tokens.get(Auth.get(socket)) ?? "") === token;
	console.log(result);
	return result;
};

export default {
	lock,
	unlock,
	init,
	update,
	get,
	isValid,
};

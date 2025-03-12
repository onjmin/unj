import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { genNonce } from "./anti-debug.js";
import auth from "./auth.js";

const nonces: Map<string, string> = new Map();
const locks: Map<string, boolean> = new Map();

const genNonceKey = () => sha256(Math.random().toString(36)).slice(0, 8); // TODO: 脆弱性

export const init = (socket: Socket) => {
	const key = auth.get(socket);
	if (!nonces.has(key)) {
		nonces.set(key, genNonceKey());
		locks.set(key, false);
	}
};

export const lock = (socket: Socket) => locks.set(auth.get(socket), true);
export const unlock = (socket: Socket) => locks.set(auth.get(socket), false);
export const update = (socket: Socket) =>
	nonces.set(auth.get(socket), genNonceKey());
export const get = (socket: Socket): string | null =>
	locks.get(auth.get(socket)) ? null : (nonces.get(auth.get(socket)) ?? null);
export const isValid = (socket: Socket, nonce: string) =>
	locks.get(auth.get(socket))
		? false
		: genNonce(nonces.get(auth.get(socket)) ?? "") === nonce;

export default {
	lock,
	unlock,
	init,
	update,
	get,
	isValid,
};

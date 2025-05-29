import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { genNonce } from "./anti-debug.js";
import auth from "./auth.js";

const nonces: Map<number, string> = new Map();
const locks: Map<number, boolean> = new Map();

const genNonceKey = () => sha256(Math.random().toString()).slice(0, 8);

export const init = (socket: Socket) => {
	const key = auth.getUserId(socket);
	if (!nonces.has(key)) {
		nonces.set(key, genNonceKey());
		locks.set(key, false);
	}
};

export const lock = (socket: Socket) => locks.set(auth.getUserId(socket), true);
export const unlock = (socket: Socket) =>
	locks.set(auth.getUserId(socket), false);
export const update = (socket: Socket) =>
	nonces.set(auth.getUserId(socket), genNonceKey());
export const get = (socket: Socket): string | null =>
	locks.get(auth.getUserId(socket)) ? null : getUnsafe(socket);
export const getUnsafe = (socket: Socket): string | null =>
	nonces.get(auth.getUserId(socket)) ?? null;
export const isValid = (socket: Socket, nonce: string) =>
	locks.get(auth.getUserId(socket))
		? false
		: genNonce(nonces.get(auth.getUserId(socket)) ?? "") === nonce;

export default {
	lock,
	unlock,
	init,
	update,
	get,
	getUnsafe,
	isValid,
};

import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import { genNonce } from "./anti-debug.js";
import Auth from "./auth.js";

const nonces: Map<string, string> = new Map();
const locks: Map<string, boolean> = new Map();

const genNonceKey = () => sha256(Math.random().toString(36)).slice(0, 8); // TODO: 脆弱性

export const init = (socket: Socket) => {
	const auth = Auth.get(socket);
	if (!nonces.has(auth)) {
		nonces.set(auth, genNonceKey());
		locks.set(auth, false);
	}
};

export const lock = (socket: Socket) => locks.set(Auth.get(socket), true);
export const unlock = (socket: Socket) => locks.set(Auth.get(socket), false);
export const update = (socket: Socket) =>
	nonces.set(Auth.get(socket), genNonceKey());
export const get = (socket: Socket): string | null =>
	locks.get(Auth.get(socket)) ? null : (nonces.get(Auth.get(socket)) ?? null);
export const isValid = (socket: Socket, nonce: string) => {
	const result = locks.get(Auth.get(socket))
		? false
		: genNonce(nonces.get(Auth.get(socket)) ?? "") === nonce;
	console.log("🔑", result);
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

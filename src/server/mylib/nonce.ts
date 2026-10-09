import type { Socket } from "socket.io";
import { genNonce } from "./anti-debug.js";
import auth from "./auth.js";
import { onlineByUserId } from "./socket.js";

/**
 * userId単位の状態（同じユーザーの複数タブ・再接続で共有する）
 *
 * 切断のたびに消すと、タブ復帰時の再接続で手元の nonceKey が合わなくなるので、
 * 接続が無いまま一定時間たったものだけ掃除する。
 */
const nonces: Map<number, string> = new Map();
const locks: Map<number, boolean> = new Map();
const lastSeen: Map<number, number> = new Map();

const ttl = 1000 * 60 * 60 * 24; // 接続が無いまま24時間たったら捨てる

const genNonceKey = () => crypto.randomUUID().slice(0, 8);

const touch = (key: number) => {
	lastSeen.set(key, Date.now());
};

setInterval(
	() => {
		const now = Date.now();
		for (const [key, seen] of lastSeen) {
			if (now - seen < ttl || onlineByUserId.has(key)) continue;
			nonces.delete(key);
			locks.delete(key);
			lastSeen.delete(key);
		}
	},
	1000 * 60 * 60,
).unref();

export const init = (socket: Socket) => {
	const key = auth.getUserId(socket);
	touch(key);
	if (!nonces.has(key)) {
		nonces.set(key, genNonceKey());
		locks.set(key, false);
	}
};

export const lock = (socket: Socket) => locks.set(auth.getUserId(socket), true);
export const unlock = (socket: Socket) =>
	locks.set(auth.getUserId(socket), false);
export const update = (socket: Socket) => {
	touch(auth.getUserId(socket));
	return nonces.set(auth.getUserId(socket), genNonceKey());
};
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

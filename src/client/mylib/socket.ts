import { type Socket, io } from "socket.io-client";
import { sleep } from "../mylib/util.js";
import { PROD_MODE } from "./env.js";

const uri = PROD_MODE
	? import.meta.env.VITE_GLITCH_URL
	: `http://localhost:${import.meta.env.VITE_LOCALHOST_PORT}`;

export let socket: Socket;
export let nonceKey = "";
let isOK = false;
let retry: (() => void) | null;

const getNonceKey = () => socket.emit("getNonceKey", {});
const areYouOk = () => {
	if (isOK) {
		throw "OK, OK! Copy that!";
	}
};

/**
 * サーバーと対話が成立したのでNonce値を更新する
 */
export const ok = () => {
	isOK = true;
	getNonceKey();
};

/**
 * Svelteのunmount時、Socket.IOのイベントハンドラ登録解除の共通処理
 */
export const goodbye = () => {
	retry = null;
};

/**
 * Svelteのmount時のSocket.IOのイベントハンドラ登録の共通処理
 */
export const hello = (callback: (() => void) | null = null) => {
	retry = callback;
	isOK = false;
	if (!socket) {
		socket = io(uri, {
			withCredentials: true,
		});
		window.addEventListener("beforeunload", () => {
			socket.disconnect();
		});
		socket.on(
			"getNonceKey",
			(data: { ok: boolean; nonceKey: string | null }) => {
				if (data.ok && data.nonceKey) {
					nonceKey = data.nonceKey;
					if (!isOK && retry) {
						retry();
					}
				}
			},
		);
		getNonceKey();
	}
	(async () => {
		if (!retry) {
			return;
		}
		try {
			retry();
			await sleep(2048);
			areYouOk();
			getNonceKey();
			await sleep(4096);
			areYouOk();
			getNonceKey();
			await sleep(8192);
			areYouOk();
			getNonceKey();
		} catch (err) {}
	})();
};

import { type Socket, io } from "socket.io-client";
import { PROD_MODE } from "./env.js";

const uri = PROD_MODE
	? import.meta.env.VITE_GLITCH_URL
	: `http://localhost:${import.meta.env.VITE_LOCALHOST_PORT}`;

export let socket: Socket;
export let nonceKey = "";
let isOK = false;
export const ok = () => {
	isOK = true;
	socket.emit("getNonceKey", {});
};
let retry: () => void;

/**
 * Socket.IOの初回接続
 */
export const init = (callback: () => void) => {
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
					if (!isOK) {
						retry();
					}
				}
			},
		);
	}
	isOK = false;
	retry = callback;
	callback();
	return setTimeout(() => {
		if (!isOK) {
			socket.emit("getNonceKey", {});
		}
	}, retryMs);
};

const retryMs = 2048;

import { type Socket, io } from "socket.io-client";
import { PROD_MODE } from "./env.js";

const uri = PROD_MODE
	? import.meta.env.VITE_GLITCH_URL
	: `http://localhost:${import.meta.env.VITE_LOCALHOST_PORT}`;

export let socket: Socket;
export let nonceKey = "";
let isOK = false;

/**
 * リロードしていない場合に直接呼び出す
 */
export const getNonceKey = () => socket.emit("getNonceKey", {});

/**
 * 再送の必要なし
 */
export const ok = () => {
	isOK = true;
	getNonceKey();
};
let retry: null | (() => void);

/**
 * Socket.IOの初回接続
 */
export const init = (callback?: () => void) => {
	const first = !socket;
	if (first) {
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
	}
	if (callback) {
		isOK = false;
		retry = callback;
		callback();
		return setTimeout(() => {
			if (!isOK) {
				getNonceKey();
			}
		}, coolTimeOfSelect);
	}
	if (first) {
		isOK = false;
		retry = null;
		getNonceKey();
	}
};

export const coolTimeOfSelect = 2048; // SELECTのクールタイム
export const coolTimeOfModify = 4096; // INSERT/UPDATE/DELETEのクールタイム

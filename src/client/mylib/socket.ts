import { type Socket, io } from "socket.io-client";
import { PROD_MODE } from "./env.js";

const uri = PROD_MODE
	? import.meta.env.VITE_GLITCH_URL
	: `http://localhost:${import.meta.env.VITE_LOCALHOST_PORT}`;

export let socket: Socket;
export let token: string;
let isOK = false;
export const ok = () => {
	isOK = true;
	socket.emit("getToken", {});
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
		socket.on("getToken", (data: { ok: boolean; token: string | null }) => {
			if (data.ok && data.token) {
				token = data.token;
				if (!isOK) {
					retry();
				}
			}
		});
	}
	isOK = false;
	retry = callback;
	callback();
	return setTimeout(() => {
		if (!isOK) {
			socket.emit("getToken", {});
		}
	}, VITE_UNJ_RETRY_MS);
};

const VITE_UNJ_RETRY_MS = Number(import.meta.env.VITE_UNJ_RETRY_MS);

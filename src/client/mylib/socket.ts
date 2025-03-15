import { type Socket, io } from "socket.io-client";
import { navigate } from "svelte-routing";
import { sleep } from "../mylib/util.js";
import { savePathname } from "./enter.js";
import { PROD_MODE, base, pathname } from "./env.js";
import { save } from "./idb/keyval.js";

const uri = PROD_MODE
	? import.meta.env.VITE_GLITCH_URL
	: `http://localhost:${import.meta.env.VITE_LOCALHOST_PORT}`;

export let errorReason = "";
let authToken = "";
const getAuthToken = () => {
	return authToken;
};
export const setAuthToken = (token: string) => {
	authToken = token;
};

export let socket: Socket;
export let nonceKey = "";
let isOK = false;
let retry: (() => void) | null;
const getNonceKey = () => socket.emit("getNonceKey", {});

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
			auth: {
				token: getAuthToken(),
			},
		});
		window.addEventListener("beforeunload", () => {
			socket.disconnect();
		});
		socket.on("kicked", async (data: { ok: boolean; reason: string }) => {
			if (data.ok && data.reason) {
				errorReason = data.reason;
				switch (data.reason) {
					case "banned":
						await Promise.all([
							save("banStatus", "ban"),
							save("banReason", "banned"),
						]);
						navigate(base("/akukin"), { replace: true });
						break;
					case "multipleConnections":
						navigate(base("/error"), { replace: true });
						break;
					case "newUsersRateLimit":
						savePathname(pathname());
						navigate(base("/error"), { replace: true });
						break;
					default:
						break;
				}
			}
		});
		socket.on("updateAuthToken", (data: { ok: boolean; token: string }) => {
			if (data.ok && data.token) {
				save("authToken", data.token);
			}
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
		retry();
		await sleep(2048);
		if (isOK) return;
		getNonceKey();
		await sleep(4096);
		if (isOK) return;
		getNonceKey();
		await sleep(8192);
		if (isOK) return;
		getNonceKey();
	})();
};

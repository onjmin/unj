import { type Socket, io } from "socket.io-client";
import { navigate } from "svelte-routing";
import type { Ninja } from "../../common/response/schema.js";
import { sleep } from "../../common/util.js";
import { PROD_MODE, decodeEnv, makePathname, pathname } from "./env.js";
import {
	authToken,
	banReason,
	banStatus,
	destinationPathname,
	ninjaPokemon,
	ninjaScore,
	nonceKey,
} from "./idb/preload.js";

const uri = PROD_MODE
	? decodeEnv(import.meta.env.VITE_GLITCH_URL)
	: `http://localhost:${decodeEnv(import.meta.env.VITE_LOCALHOST_PORT)}`;

export let errorReason = "";
export let socket: Socket;
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
				token: authToken.value,
			},
		});
		window.addEventListener("beforeunload", () => {
			socket.disconnect();
		});
		socket.on("kicked", (data: { ok: boolean; reason: string }) => {
			if (!data.ok || !data.reason) return;
			errorReason = data.reason;
			switch (data.reason) {
				case "banned":
					banStatus.value = "ban";
					banReason.value = "banned";
					navigate(makePathname("/akukin"), { replace: true });
					break;
				case "multipleConnections":
					navigate(makePathname("/error"), { replace: true });
					break;
				case "newUsersRateLimit":
					destinationPathname.value = pathname();
					navigate(makePathname("/error"), { replace: true });
					break;
				case "grantFailed":
					destinationPathname.value = pathname();
					navigate(makePathname("/error"), { replace: true });
					break;
				default:
					break;
			}
		});
		socket.on("updateAuthToken", (data: { ok: boolean; token: string }) => {
			if (!data.ok || !data.token) return;
			authToken.value = data.token;
		});
		socket.on("ninja", (data: { ok: boolean; ninja: Ninja }) => {
			if (!data.ok) return;
			ninjaPokemon.value = String(data.ninja.pokemon);
			ninjaScore.value = String(data.ninja.score);
		});
		socket.on(
			"getNonceKey",
			(data: { ok: boolean; nonceKey: string | null }) => {
				if (!data.ok || !data.nonceKey) return;
				nonceKey.value = data.nonceKey;
				if (!isOK && retry) {
					retry();
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

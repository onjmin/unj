import { decode } from "../../common/anti-debug.js";
import { identity } from "./dummy.js";

export const DEV_MODE = Boolean(import.meta.env.DEV_MODE);
export const STG_MODE = Boolean(import.meta.env.STG_MODE);
export const PROD_MODE = Boolean(import.meta.env.PROD_MODE);
const ENV_KEY = String(import.meta.env.ENV_KEY);

/**
 * ビルド時に難読化されたenvを複号する
 */
export const decodeEnv = (value?: string) =>
	decode(String(value), ENV_KEY) ?? "";

export const VITE_ADMIN_EMAIL = decodeEnv(import.meta.env.VITE_ADMIN_EMAIL);
export const VITE_ADMIN_TWITTER = decodeEnv(import.meta.env.VITE_ADMIN_TWITTER);
export const adminTwitterUsername = VITE_ADMIN_TWITTER.split("/").slice(-1)[0];

const VITE_BASE_URL = PROD_MODE
	? decodeEnv(import.meta.env.VITE_BASE_URL)
	: "/";

// 本番ビルドが盗まれて別のホスティングに置かれた場合のせめてもの抵抗
if (
	window.location.href === window.location.href.replace(VITE_BASE_URL, "") &&
	identity()
) {
	window.location.href = "about:blank";
}

/**
 * デプロイ先に応じたwindow.location.pathname
 */
export const pathname = (): string => {
	if (PROD_MODE) {
		const str = window.location.href.replace(VITE_BASE_URL, "");
		if (str === "") {
			return "/";
		}
		if (str[0] !== "/") {
			return `/${str}`;
		}
		return str;
	}
	return window.location.pathname;
};

const url = PROD_MODE ? new URL(VITE_BASE_URL) : window.location;

/**
 * デプロイ先に応じたpathnameを作る
 */
export const makePathname = (to: string) =>
	PROD_MODE ? `${url.pathname}${to.slice(1)}` : to;

/**
 * デプロイ先に応じたhrefを作る
 */
export const makeHref = (to: string) =>
	PROD_MODE ? `${url.href}${to.slice(1)}` : `${location.host}${to}`;

export const DEV_MODE = Boolean(import.meta.env.DEV_MODE);
export const STG_MODE = Boolean(import.meta.env.STG_MODE);
export const PROD_MODE = Boolean(import.meta.env.PROD_MODE);

export const VITE_ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL);
export const VITE_ADMIN_TWITTER = String(import.meta.env.VITE_ADMIN_TWITTER);

const VITE_BASE_URL = String(import.meta.env.VITE_BASE_URL || "/");

// 本番ビルドが盗まれて別のホスティングに置かれた場合のせめてもの抵抗
if (window.location.href === window.location.href.replace(VITE_BASE_URL, "")) {
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
 * デプロイ先に応じた遷移先
 */
export const base = (to: string) =>
	PROD_MODE ? `${url.pathname}${to.slice(1)}` : to;

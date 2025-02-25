const BASE_URL = import.meta.env.BASE_URL;
export const DEV_MODE = import.meta.env.DEV_MODE;
export const STG_MODE = import.meta.env.STG_MODE;
export const PROD_MODE = import.meta.env.PROD_MODE;

export const VITE_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
export const VITE_ADMIN_TWITTER = import.meta.env.VITE_ADMIN_TWITTER;

// 本番ビルドが盗まれて別のホスティングに置かれた場合のせめてもの抵抗
if (window.location.href === window.location.href.replace(BASE_URL, "")) {
	window.location.href = "about:blank";
}

/**
 * デプロイ先に応じたwindow.location.pathname
 */
export const pathname = (): string => {
	if (PROD_MODE) {
		const str = window.location.href.replace(BASE_URL, "");
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

const url = PROD_MODE ? new URL(BASE_URL) : window.location;

/**
 * デプロイ先に応じた遷移先
 */
export const base = (to: string) =>
	PROD_MODE ? `${url.pathname}${to.slice(1)}` : to;

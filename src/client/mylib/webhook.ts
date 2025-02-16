import { flaky } from "./anti-debug.js";

const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_PATHNAME_SCAN = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_PATHNAME_SCAN;
const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_SOCKET = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_SOCKET;

/**
 * DiscordのWebhookは符号化のしようがないので素の状態で使う
 */
const sendDiscordWebhook = (url: string, array: Array<string>) =>
	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ content: ["```", ...array, "```"].join("\n") }),
	});

/**
 * 直リン攻撃の検出時に送信する
 */
export const reportPathnameScan = (array: Array<string>) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_REPORT_PATHNAME_SCAN, array);

/**
 * 不明なsocket.io接続元の検出時に送信する
 */
export const reportUnknownSocket = (array: Array<string>) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_SOCKET, array);

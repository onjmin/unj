import { flakyAction } from "./anti-debug.js";

const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_PATHNAME_SCAN_ATACK = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_PATHNAME_SCAN_ATACK;
const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_SOCKET = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_SOCKET;

/**
 * DiscordのWebhookは符号化のしようがないので素の状態で使う
 */
const sendDiscordWebhook = (url: string, content: string) =>
	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ content: ["```\n", content, "\n```"].join("") }),
	});

/**
 * 直リン攻撃の検出時に送信する
 *
 * 意図的な攻撃なのでリバースエンジニアリング対策する
 */
export const reportPathnameScanAtack = (content: string) =>
	flakyAction(() =>
		sendDiscordWebhook(
			VITE_DISCORD_WEBHOOK_URL_OF_REPORT_PATHNAME_SCAN_ATACK,
			content,
		),
	);

/**
 * 不明なsocket.io接続元の検出時に送信する
 *
 * 意図的ではないが攻撃なのでリバースエンジニアリング対策する
 */
export const reportUnknownSocket = (content: string) =>
	flakyAction(() =>
		sendDiscordWebhook(
			VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_SOCKET,
			content,
		),
	);

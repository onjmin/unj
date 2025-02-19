import { format } from "date-fns";
import { ja } from "date-fns/locale";

const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_TRAVERSAL = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_TRAVERSAL;
const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_IP = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_IP;

/**
 * DiscordのWebhookは符号化のしようがないので素の状態で使う
 */
const sendDiscordWebhook = (url: string, array: Array<string>) =>
	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			content: [
				"```",
				format(new Date(), "yyyy年MM月dd日 HH時mm分ss秒", { locale: ja }),
				...array,
				"```",
			].join("\n"),
		}),
	});

/**
 * トラバーサル検出時に送信する
 */
export const reportTraversal = (array: Array<string>) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_REPORT_TRAVERSAL, array);

/**
 * Socket.IOでIPが不明だった時に送信する
 */
export const reportUnknownIP = (array: Array<string>) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_REPORT_UNKNOWN_IP, array);

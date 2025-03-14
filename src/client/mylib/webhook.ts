import { format } from "date-fns";
import { ja } from "date-fns/locale";

const VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_KAIZEN = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_KAIZEN;
const VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_AGPL3 = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_AGPL3;
const VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_POLICE = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_POLICE;
const VITE_DISCORD_WEBHOOK_URL_OF_USER_REPORT = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_USER_REPORT;
const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_TRAVERSAL = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_TRAVERSAL;
const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_BANNED_IP = import.meta.env
	.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_BANNED_IP;

/**
 * DiscordのWebhookは符号化のしようがないので素の状態で使う
 */
const sendDiscordWebhook = (url: string, array: string[]) =>
	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			content: [
				"```",
				format(new Date(), "yyyy年MM月dd日 HH時mm分ss秒", { locale: ja }),
				array.join("\n").replace(/`/g, ""),
				"```",
			].join("\n"),
			allowed_mentions: {
				parse: [],
			},
		}),
	});

/**
 * 改善要望
 */
export const contactKaizen = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_KAIZEN, array);

/**
 * AGPL3に関するお問い合わせ
 */
export const contactAGPL3 = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_AGPL3, array);

/**
 * 警察からのお問い合わせ
 */
export const contactPolice = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_POLICE, array);

/**
 * ユーザーによる通報
 */
export const userReport = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_USER_REPORT, array);

/**
 * トラバーサル検出時に送信する
 */
export const reportTraversal = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_REPORT_TRAVERSAL, array);

/**
 * Socket.IOでIPが不明だった時に送信する
 */
export const reportBannedIP = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_REPORT_BANNED_IP, array);

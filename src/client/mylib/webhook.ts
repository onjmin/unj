import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { decodeEnv } from "./env.js";

const VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_KAIZEN = decodeEnv(
	import.meta.env.VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_KAIZEN,
);
const VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_AGPL3 = decodeEnv(
	import.meta.env.VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_AGPL3,
);
const VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_POLICE = decodeEnv(
	import.meta.env.VITE_DISCORD_WEBHOOK_URL_OF_CONTACT_POLICE,
);
const VITE_DISCORD_WEBHOOK_URL_OF_REPORT_BANNED = decodeEnv(
	import.meta.env.VITE_DISCORD_WEBHOOK_URL_OF_REPORT_BANNED,
);
const VITE_DISCORD_WEBHOOK_URL_OF_OEKAKI_LOGGER = decodeEnv(
	import.meta.env.VITE_DISCORD_WEBHOOK_URL_OF_OEKAKI_LOGGER,
);
const VITE_DISCORD_WEBHOOK_URL_OF_AI = decodeEnv(
	import.meta.env.VITE_DISCORD_WEBHOOK_URL_OF_AI,
);

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
 * Socket.IOでIPが不明だった時に送信する
 */
export const reportBanned = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_REPORT_BANNED, array);

/**
 * お絵描きログ
 */
export const oekakiLogger = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_OEKAKI_LOGGER, array);

/**
 * AI Webhook
 */
export const aiWebhook = (array: string[]) =>
	sendDiscordWebhook(VITE_DISCORD_WEBHOOK_URL_OF_AI, array);

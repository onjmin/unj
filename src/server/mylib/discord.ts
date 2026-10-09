import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { logger } from "./log.js";

export type DiscordWebhookKind =
	| "CONTACT_KAIZEN"
	| "CONTACT_AGPL3"
	| "CONTACT_POLICE"
	| "REPORT_BANNED"
	| "OEKAKI_LOGGER"
	| "AI";

/**
 * 送信先のWebhook URL
 *
 * UNJ_DISCORD_WEBHOOK_URL_OF_* を優先し、未設定なら従来の VITE_DISCORD_WEBHOOK_URL_OF_* を使う。
 * （VITE_* はもうクライアントには入れない。vite.config.ts 参照）
 */
const getWebhookUrl = (kind: DiscordWebhookKind): string | null => {
	const raw =
		process.env[`UNJ_DISCORD_WEBHOOK_URL_OF_${kind}`] ||
		process.env[`VITE_DISCORD_WEBHOOK_URL_OF_${kind}`] ||
		"";
	try {
		const url = new URL(raw);
		if (url.protocol !== "https:") return null;
		if (!/(^|\.)discord(app)?\.com$/.test(url.hostname)) return null;
		return url.href;
	} catch {
		return null;
	}
};

const discordContentMax = 2000;
const timeoutMs = 8000;

/**
 * DiscordのWebhookに送信する
 *
 * 書式はクライアントから送っていた頃と同じ（コードブロック＋日時、バッククォートは除去、メンション無効）。
 * 失敗してもthrowせずfalseを返す。URLは秘密なのでログに出さない。
 */
export const sendDiscordWebhook = async (
	kind: DiscordWebhookKind,
	lines: string[],
): Promise<boolean> => {
	const url = getWebhookUrl(kind);
	if (!url) {
		logger.warn(`⚠️ webhook ${kind} is not configured`);
		return false;
	}
	const date = format(
		toZonedTime(new Date(), "Asia/Tokyo"),
		"yyyy年MM月dd日 HH時mm分ss秒",
		{ locale: ja },
	);
	const head = ["```", date, ""].join("\n");
	const tail = "\n```";
	let body = lines.join("\n").replace(/`/g, "");
	const bodyMax = discordContentMax - head.length - tail.length;
	if (body.length > bodyMax) {
		// Discordの上限文字数に収める（サロゲートペアの途中で切らない）
		body = `${body.slice(0, bodyMax - 1).replace(/[\uD800-\uDBFF]$/, "")}…`;
	}
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				content: `${head}${body}${tail}`,
				allowed_mentions: {
					parse: [],
				},
			}),
			signal: AbortSignal.timeout(timeoutMs),
		});
		if (!res.ok) {
			logger.warn(`⚠️ webhook ${kind} ${res.status}`);
			return false;
		}
		return true;
	} catch (err) {
		logger.warn(
			`⚠️ webhook ${kind} ${err instanceof Error ? err.name : "error"}`,
		);
		return false;
	}
};

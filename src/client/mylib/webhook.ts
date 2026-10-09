import type { ContactType } from "../../common/request/contact-schema.js";
import { decodeEnv, PROD_MODE } from "./env.js";
import { socket } from "./socket.js";

/**
 * DiscordのWebhookへはサーバー経由で送る（src/server/api/contact.ts）
 *
 * Webhook URLやAI Webhookのpepperをバンドルに入れないため、クライアントからは直接送らない。
 * お問い合わせはHTTP、お絵描きログ・AI Webhookは書き込み画面のソケットで送る。
 */

const uri = PROD_MODE
	? decodeEnv(import.meta.env.VITE_GLITCH_URL)
	: `http://localhost:${decodeEnv(import.meta.env.VITE_LOCALHOST_PORT)}`;

const contactTimeoutMs = 16000;

/**
 * お問い合わせを送る（失敗したらreject）
 *
 * ソケットだと接続数の上限などで画面ごと飛ばされるので、HTTPで送る。
 */
const contact = async (type: ContactType, array: string[]): Promise<void> => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), contactTimeoutMs);
	try {
		const res = await fetch(`${uri.replace(/\/+$/, "")}/api/contact`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ type, lines: array }),
			signal: controller.signal,
		});
		const data = await res.json().catch(() => null);
		if (!res.ok || !data?.ok) throw new Error(`contact failed: ${res.status}`);
	} finally {
		clearTimeout(timer);
	}
};

/**
 * 改善要望
 */
export const contactKaizen = (array: string[]) => contact("kaizen", array);

/**
 * AGPL3に関するお問い合わせ
 */
export const contactAGPL3 = (array: string[]) => contact("agpl3", array);

/**
 * 警察からのお問い合わせ
 */
export const contactPolice = (array: string[]) => contact("police", array);

/**
 * お絵描きログ
 */
export const oekakiLogger = (link: string, deletehash: string) => {
	socket?.emit("oekakiLogger", { link, deletehash });
};

/**
 * AI Webhook
 *
 * 署名と本文はサーバー側で作るので、どのレスかだけ送る。
 */
export const aiWebhook = (threadId: string, resNum: number) => {
	socket?.emit("aiWebhook", { threadId, resNum });
};

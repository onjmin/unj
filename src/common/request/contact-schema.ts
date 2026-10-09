import * as v from "valibot";
import { SMALLSERIAL, THREAD_ID } from "./schema.js";

/**
 * Discordへ転送する1行分
 *
 * 開示請求の書き込み内容（AAなど）は改行が多いので、改行の数は絞らない。
 * 長さは1行512文字・16行まで（Discord側でも2000文字に切り詰める）。
 */
const LINE = v.pipe(
	v.string(),
	v.maxLength(512),
	// 改行（CR・LF）・タブ以外の制御文字を禁止
	v.check(
		(input) =>
			// biome-ignore lint/suspicious/noControlCharactersInRegex: 制御文字そのものを弾くための正規表現
			!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input),
	),
	// サロゲートペアの片割れを禁止
	v.check((input) => !/[\uD800-\uDFFF]/u.test(input)),
);

export const contactTypes = ["kaizen", "agpl3", "police"] as const;
export type ContactType = (typeof contactTypes)[number];

/**
 * お問い合わせのスキーマ
 */
export const ContactSchema = v.strictObject({
	type: v.picklist(contactTypes),
	lines: v.pipe(v.array(LINE), v.minLength(1), v.maxLength(16)),
});

/**
 * お絵描きログのスキーマ（imgurにアップロードした画像のURLと削除ハッシュ）
 */
export const OekakiLoggerSchema = v.strictObject({
	link: v.pipe(
		v.string(),
		v.maxLength(256),
		v.url(),
		v.check((input) => {
			try {
				const url = new URL(input);
				return (
					url.protocol === "https:" &&
					(url.hostname === "i.imgur.com" || url.hostname === "imgur.com")
				);
			} catch {
				return false;
			}
		}),
	),
	deletehash: v.pipe(v.string(), v.maxLength(64), v.regex(/^[0-9A-Za-z]*$/)),
});

/**
 * AI Webhookのスキーマ
 *
 * 本文や署名はサーバー側でDBから引いて作るので、どのレスかだけ受け取る。
 */
export const AiWebhookSchema = v.strictObject({
	threadId: THREAD_ID,
	resNum: SMALLSERIAL,
});

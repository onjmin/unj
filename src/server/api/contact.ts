import { randomBytes } from "node:crypto";
import express, { type Express, type Request, type Response } from "express";
import { sha256 } from "js-sha256";
import type { Socket } from "socket.io";
import * as v from "valibot";
import {
	AiWebhookSchema,
	ContactSchema,
	type ContactType,
	OekakiLoggerSchema,
} from "../../common/request/contact-schema.js";
import { isSerial, myConfig } from "../../common/request/schema.js";
import { sleep } from "../../common/util.js";
import { decodeThreadId, encodeThreadId } from "../mylib/anti-debug.js";
import auth from "../mylib/auth.js";
import {
	type DiscordWebhookKind,
	sendDiscordWebhook,
} from "../mylib/discord.js";
import {
	detectClientIpFromHeaders,
	getIP,
	ipKey,
	isBannedIP,
	normalizeIP,
} from "../mylib/ip.js";
import { logger } from "../mylib/log.js";
import { pool } from "../mylib/pool.js";

/**
 * Discord Webhookへの送信をクライアントから肩代わりするAPI群
 *
 * Webhook URLやAI Webhookのpepperをクライアントに持たせないためにサーバー経由にしている。
 * お絵描きログやAI Webhookは書き込みの直前・直後に飛ぶので、Nonce値は使わない
 * （ここで更新すると直後の書き込みのNonce値がずれる）。代わりにIP・ユーザー単位で数を絞る。
 * お問い合わせはソケットの接続数制限やキックに巻き込まれないようにHTTPで受ける。
 */

const MINUTE = 60 * 1000;

/**
 * 固定窓のレートリミット
 *
 * 数えずに使い切ったかだけ確認する（isFull）ことがあるので、TokenBucketではなく自前で持つ。
 */
class WindowLimiter {
	private hits: Map<string, { count: number; resetAt: number }> = new Map();
	private lastSweep = 0;
	private max: number;
	private windowMs: number;

	constructor(max: number, windowMs: number) {
		this.max = max;
		this.windowMs = windowMs;
	}

	public attempt(key: string): boolean {
		const now = Date.now();
		this.sweep(now);
		const hit = this.hits.get(key);
		if (!hit || hit.resetAt <= now) {
			this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
			return true;
		}
		if (hit.count >= this.max) return false;
		hit.count++;
		return true;
	}

	/**
	 * 使い切っているか（数えずに確認だけする）
	 */
	public isFull(key: string): boolean {
		const hit = this.hits.get(key);
		return !!hit && hit.resetAt > Date.now() && hit.count >= this.max;
	}

	/**
	 * 期限切れのキーを掃除する（Mapが溜まり続けないように）
	 */
	private sweep(now: number) {
		if (now - this.lastSweep < Math.min(this.windowMs, 10 * MINUTE)) return;
		this.lastSweep = now;
		for (const [key, hit] of this.hits) {
			if (hit.resetAt <= now) this.hits.delete(key);
		}
	}
}

/**
 * 個別（IP・ユーザー）と全体の2段で数を絞る
 *
 * 全体の枠は、本当に送ると決まってから数えられるように分けてある。
 */
const makeLimiter = (max: number, windowMs: number, globalMax: number) => {
	const byKey = new WindowLimiter(max, windowMs);
	const byAll = new WindowLimiter(globalMax, windowMs);
	return {
		local: (...keys: string[]) => keys.every((key) => byKey.attempt(key)),
		global: (key = "*") => byAll.attempt(key),
	};
};

/**
 * ソケットのIP（IPv6は/64）とユーザーで数える
 */
const bySocket = (socket: Socket, userId: number): string[] => [
	`ip:${ipKey(getIP(socket))}`,
	`user:${userId}`,
];

// 全体の枠は種別ごと（改善要望の連投で開示請求が止まらないように）
const contactLimit = makeLimiter(3, 10 * MINUTE, 20); // 画面側でも1日1回に絞っている
const oekakiLimit = makeLimiter(12, 10 * MINUTE, 120);
const aiLimit = makeLimiter(20, 10 * MINUTE, 120);

const contactKindMap: Record<ContactType, DiscordWebhookKind> = {
	kaizen: "CONTACT_KAIZEN",
	agpl3: "CONTACT_AGPL3",
	police: "CONTACT_POLICE",
};

const delimiter = "###";

/**
 * AI Webhookのpepper
 *
 * UNJ_AI_WEBHOOK_SECRET_PEPPER を優先し、未設定なら従来の VITE_UNJ_AI_WEBHOOK_SECRET_PEPPER を使う。
 */
const getAiWebhookPepper = (): string =>
	process.env.UNJ_AI_WEBHOOK_SECRET_PEPPER ||
	process.env.VITE_UNJ_AI_WEBHOOK_SECRET_PEPPER ||
	"";

/**
 * AI Webhook不正防止用ハッシュを生成
 *
 * 外部のAI botが同じ式で検証するので、クライアントで作っていた頃と同じ式にしておくこと。
 */
const genAiWebhookHash = (
	pepper: string,
	nonce: string,
	threadId: string,
	resNum: number,
): string => {
	const str = sha256([pepper, nonce, threadId, resNum].join(delimiter));
	return str.slice(0, 8); // 実用上問題ないので8文字に削減
};

const isAI = (str: string) =>
	str.startsWith("!beep") || str.startsWith("!ai") || str.startsWith("!gen");

const aiDone = new WindowLimiter(1, 60 * MINUTE); // 同じレスで二重に呼ばない

const bannedReported = new WindowLimiter(1, 24 * 60 * MINUTE); // 同じIP（ID）は1日1回まで
const bannedReportLimit = new WindowLimiter(30, 60 * MINUTE);

/**
 * アク禁で弾いた接続をDiscordに通知する
 *
 * 弾かれたクライアントはソケットが切られていて送信できないので、サーバーから送る。
 * 接続時やイベント毎に何度も呼ばれる前提で、同じIP（ID）は1日1回までに間引く。
 * 接続直後は auth.grant 前で socket.data.userId が無いので、分かっていれば userId を渡すこと。
 */
export const reportBanned = (
	socket: Socket,
	ip: string,
	reason: "ip" | "id",
	userId?: number,
): void => {
	try {
		const unknown = "(unknown)";
		const remote = socket.conn.remoteAddress ?? unknown;
		const key =
			reason === "id" && userId !== undefined && isSerial(userId)
				? `id:${userId}`
				: `${reason}:${ipKey(normalizeIP(ip || remote))}`;
		// 全体の上限で送れなかった分まで「通知済み」にしないよう、先に確認だけする
		if (bannedReported.isFull(key)) return;
		if (!bannedReportLimit.attempt("*")) return;
		bannedReported.attempt(key);
		const uid =
			userId ?? auth.getUserId(socket) ?? auth.parseClaims(socket)?.userId;
		const lines = [
			`理由：${reason === "ip" ? "IP" : "ID"}`,
			`IP：${ip || unknown}`,
			`ID：${uid !== undefined && isSerial(uid) ? uid : unknown}`,
			`UA：${String(socket.handshake.headers["user-agent"] ?? unknown).slice(0, 256)}`,
		];
		if (!ip) lines.push(`remote：${remote}`);
		sendDiscordWebhook("REPORT_BANNED", lines);
	} catch (error) {
		logger.error(error);
	}
};

const contactApi = "/api/contact";

/**
 * お問い合わせ（改善要望・AGPL3・開示請求）
 *
 * ソケットだと接続数の上限・複タブ・緊急停止で弾かれて画面ごと飛ばされるので、HTTPで受ける。
 * フロントは別オリジンなので、許可したオリジンにだけCORSを返す。
 */
export const registerContactRoute = (
	app: Express,
	allowedOrigins: string[],
) => {
	const cors = (req: Request, res: Response) => {
		const origin = req.headers.origin;
		res.vary("Origin");
		if (origin && allowedOrigins.includes(origin)) {
			res.setHeader("Access-Control-Allow-Origin", origin);
		}
	};
	app.options(contactApi, (req, res) => {
		cors(req, res);
		res.setHeader("Access-Control-Allow-Methods", "POST");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type");
		res.setHeader("Access-Control-Max-Age", "600");
		res.sendStatus(204);
	});
	app.post(
		contactApi,
		express.json({ limit: "16kb" }),
		async (req: Request, res: Response) => {
			cors(req, res);
			try {
				const ip = detectClientIpFromHeaders(
					req.headers,
					req.socket.remoteAddress,
				);
				if (isBannedIP(ip)) {
					res.status(403).json({ ok: false });
					return;
				}
				const contact = v.safeParse(ContactSchema, req.body, myConfig);
				if (!contact.success) {
					res.status(400).json({ ok: false });
					return;
				}
				const { type, lines } = contact.output;
				if (
					!contactLimit.local(`ip:${ipKey(ip)}`) ||
					!contactLimit.global(type)
				) {
					logger.verbose(`⌛ contact ${ip}`);
					res.status(429).json({ ok: false });
					return;
				}
				const ok = await sendDiscordWebhook(contactKindMap[type], lines);
				res.status(ok ? 200 : 502).json({ ok });
				logger.verbose(`contact ${type} ${ip}`);
			} catch (error) {
				logger.error(error);
				if (!res.headersSent) res.status(500).json({ ok: false });
			}
		},
	);
};

export default ({ socket }: { socket: Socket }) => {
	/**
	 * お絵描きログ（imgurの削除ハッシュを控えておく）
	 */
	socket.on("oekakiLogger", async (data) => {
		const oekaki = v.safeParse(OekakiLoggerSchema, data, myConfig);
		if (!oekaki.success) return;
		const userId = auth.getUserId(socket);
		if (!isSerial(userId)) return;
		if (
			!oekakiLimit.local(...bySocket(socket, userId)) ||
			!oekakiLimit.global()
		) {
			logger.verbose("⌛ oekakiLogger");
			return;
		}
		await sendDiscordWebhook("OEKAKI_LOGGER", [
			oekaki.output.link,
			oekaki.output.deletehash,
		]);
	});

	/**
	 * AI Webhook
	 *
	 * 本人が直前に書き込んだAIコマンドのレスだけを、DBから本文を引いて転送する。
	 */
	socket.on("aiWebhook", async (data) => {
		const ai = v.safeParse(AiWebhookSchema, data, myConfig);
		if (!ai.success) return;
		const userId = auth.getUserId(socket);
		if (!isSerial(userId)) return;
		const threadId = decodeThreadId(ai.output.threadId);
		if (threadId === null) return;
		const encodedThreadId = encodeThreadId(threadId);
		if (encodedThreadId === null) return;
		const { resNum } = ai.output;
		const pepper = getAiWebhookPepper();
		if (!pepper) {
			logger.warn("⚠️ AI webhook pepper is not configured");
			return;
		}
		// DBを叩く前に個別の枠だけ数える（全体の枠はでたらめなレス番号で潰されないよう後で数える）
		if (!aiLimit.local(...bySocket(socket, userId))) {
			logger.verbose("⌛ aiWebhook");
			return;
		}
		try {
			// レスの通知はCOMMIT前に飛ぶので、見つからなければ少し待って引き直す
			let contentText: string | null = null;
			for (const wait of [0, 1024, 2048]) {
				if (wait) await sleep(wait);
				const { rows } = await pool.query(
					[
						"SELECT content_text FROM res",
						"WHERE thread_id = $1 AND num = $2 AND user_id = $3",
						"AND created_at > LOCALTIMESTAMP - INTERVAL '10 minutes'",
						"LIMIT 1",
					].join(" "),
					[threadId, resNum, userId],
				);
				if (rows.length) {
					contentText = String(rows[0].content_text);
					break;
				}
			}
			if (contentText === null || !isAI(contentText)) return;
			const doneKey = `${threadId}:${resNum}`;
			if (aiDone.isFull(doneKey)) return;
			if (!aiLimit.global()) {
				logger.verbose("⌛ aiWebhook (global)");
				return;
			}
			aiDone.attempt(doneKey);
			const nonce = randomBytes(4).toString("hex");
			await sendDiscordWebhook("AI", [
				genAiWebhookHash(pepper, nonce, encodedThreadId, resNum),
				nonce,
				encodedThreadId,
				String(resNum), // レス番号
				contentText,
			]);
			logger.verbose("aiWebhook");
		} catch (error) {
			logger.error(error);
		}
	});
};

import { lookup as dnsLookup } from "node:dns";
import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import type { Request, Response, Router } from "express";
import { DEV_MODE, STG_MODE } from "../../mylib/env.js";

const api = "/debug/proxy";

// SSRF対策: ループバック・プライベート・リンクローカル（メタデータ含む）などの宛先を弾く
// IPv4射影アドレス（::ffff:127.0.0.1 等）もIPv4側のルールで判定される
const blockList = new net.BlockList();
for (const [address, prefix] of [
	["0.0.0.0", 8],
	["10.0.0.0", 8],
	["100.64.0.0", 10], // CGNAT
	["127.0.0.0", 8],
	["169.254.0.0", 16], // リンクローカル（クラウドのメタデータ）
	["172.16.0.0", 12],
	["192.168.0.0", 16],
	["224.0.0.0", 3], // マルチキャスト・予約済み・ブロードキャスト
] as const) {
	blockList.addSubnet(address, prefix, "ipv4");
}
for (const [address, prefix] of [
	["::", 96], // ::, ::1, IPv4互換アドレス
	["fc00::", 7], // ユニークローカル
	["fe80::", 10], // リンクローカル
	["ff00::", 8], // マルチキャスト
] as const) {
	blockList.addSubnet(address, prefix, "ipv6");
}

const isBlocked = (address: string, family: number) =>
	blockList.check(address, family === 6 ? "ipv6" : "ipv4");

const BLOCKED_MESSAGE = "内部ネットワーク宛てのリクエストは禁止されています。";

/**
 * 実際に接続するときの名前解決でも宛先を検査する（DNSリバインディング対策）
 * IPリテラルのホストはここを通らないので validateTarget で先に弾いておく
 */
const safeLookup: net.LookupFunction = (hostname, options, callback) => {
	dnsLookup(
		hostname,
		{ ...options, all: true, verbatim: true },
		(err, addresses) => {
			if (err) {
				callback(err, "");
				return;
			}
			if (
				addresses.length === 0 ||
				addresses.some(({ address, family }) => isBlocked(address, family))
			) {
				const blocked: NodeJS.ErrnoException = new Error(BLOCKED_MESSAGE);
				blocked.code = "EBLOCKED";
				callback(blocked, "");
				return;
			}
			if (options.all) {
				callback(null, addresses);
			} else {
				callback(null, addresses[0].address, addresses[0].family);
			}
		},
	);
};

/**
 * 宛先が外部の http(s) か確かめる。問題があればエラー文を返す
 */
const validateTarget = async (targetUrl: string): Promise<string | null> => {
	let url: URL;
	try {
		url = new URL(targetUrl);
	} catch {
		return "targetUrl が不正なURLです。";
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return "targetUrl は 'http://' または 'https://' から始まる必要があります。";
	}
	const hostname = url.hostname.replace(/^\[(.*)\]$/, "$1");
	let addresses: { address: string; family: number }[];
	try {
		addresses = await lookup(hostname, { all: true, verbatim: true });
	} catch {
		return "targetUrl のホスト名を解決できません。";
	}
	if (
		addresses.length === 0 ||
		addresses.some(({ address, family }) => isBlocked(address, family))
	) {
		return BLOCKED_MESSAGE;
	}
	return null;
};

const PROXY_TIMEOUT_MS = 30 * 1000;

interface ProxiedResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	text: string;
}

/**
 * fetch だと接続先のIPを検査できないので node:http(s) に safeLookup を渡して送る
 * リダイレクトは追わない（Location はheadersで返る）
 */
const proxyRequest = (
	url: URL,
	method: string,
	headers: Record<string, string>,
	body?: string,
): Promise<ProxiedResponse> =>
	new Promise((resolve, reject) => {
		const options: https.RequestOptions = {
			method,
			headers,
			lookup: safeLookup,
			timeout: PROXY_TIMEOUT_MS,
		};
		const onResponse = (incoming: http.IncomingMessage) => {
			const encoding = String(
				incoming.headers["content-encoding"] ?? "",
			).toLowerCase();
			const stream =
				encoding === "gzip"
					? incoming.pipe(zlib.createGunzip())
					: encoding === "deflate"
						? incoming.pipe(zlib.createInflate())
						: encoding === "br"
							? incoming.pipe(zlib.createBrotliDecompress())
							: incoming;
			const chunks: Buffer[] = [];
			incoming.on("error", reject);
			stream.on("error", reject);
			stream.on("data", (chunk: Buffer) => chunks.push(chunk));
			stream.on("end", () => {
				const responseHeaders: Record<string, string> = {};
				for (const [key, value] of Object.entries(incoming.headers)) {
					if (value === undefined) continue;
					responseHeaders[key] = Array.isArray(value)
						? value.join(", ")
						: value;
				}
				resolve({
					status: incoming.statusCode ?? 0,
					statusText: incoming.statusMessage ?? "",
					headers: responseHeaders,
					text: Buffer.concat(chunks).toString("utf8"),
				});
			});
		};
		const request =
			url.protocol === "https:"
				? https.request(url, options, onResponse)
				: http.request(url, options, onResponse);
		request.on("timeout", () =>
			request.destroy(new Error("外部リクエストがタイムアウトしました。")),
		);
		request.on("error", reject);
		request.end(body);
	});

// 外部リクエストのオプションを含む入力インターフェースを定義
interface ProxyRequestOptions {
	targetUrl: string;
	method?: string; // GET, POST, PUT, DELETE など
	headers?: Record<string, string>; // Content-Type などを含むヘッダー
	body?: unknown; // リクエストボディ
}

// 成功時のレスポンス型を修正
interface ProxySuccessResponse {
	message: string;
	data: unknown; // 外部APIのレスポンスボディ (string|object|array)
	status: number; // 外部APIのHTTPステータスコード
	headers: Record<string, string>; // 追加: 外部APIからのレスポンスヘッダー
}

// エラー時のレスポンス型を定義 (変更なし)
interface ProxyErrorResponse {
	error: string;
	externalStatus?: number;
	externalBody?: string;
}

/**
 * プロキシAPIのルーター定義
 * POSTリクエストでtargetUrl, method, headers, bodyを受け取り、外部リクエストを代理実行する。
 */
export default (router: Router) => {
	// 本番では登録しない（admin キーが漏れたときにSSRFの踏み台になるため）
	if (!DEV_MODE && !STG_MODE) return;

	// POST: 外部サイトへのリクエストの代理実行（method, body, headers対応）
	router.post(api, async (req: Request, res: Response) => {
		// リクエストボディからオプションを取得し、型を適用
		const {
			targetUrl,
			method = "GET",
			headers,
			body,
		} = (req.body ?? {}) as Partial<ProxyRequestOptions>;

		// --- 1. バリデーション ---

		if (typeof method !== "string") {
			res.status(400).json({
				error: "無効な 'method' が指定されました。",
			} as ProxyErrorResponse);
			return;
		}
		const upperMethod = method.toUpperCase();
		const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

		if (typeof targetUrl !== "string" || !targetUrl) {
			res.status(400).json({
				error: "リクエストボディに 'targetUrl' (string) が必要です。",
			} as ProxyErrorResponse);
			return;
		}

		const targetError = await validateTarget(targetUrl);
		if (targetError) {
			res.status(400).json({
				error: targetError,
			} as ProxyErrorResponse);
			return;
		}

		if (!validMethods.includes(upperMethod)) {
			res.status(400).json({
				error: "無効な 'method' が指定されました。",
			} as ProxyErrorResponse);
			return;
		}

		if (
			headers !== undefined &&
			(typeof headers !== "object" ||
				headers === null ||
				Array.isArray(headers))
		) {
			res.status(400).json({
				error: "'headers' はオブジェクトで指定してください。",
			} as ProxyErrorResponse);
			return;
		}

		// --- 2. リクエストの準備 ---

		// fetch と同じく accept と user-agent は既定値を入れておく
		const requestHeaders: Record<string, string> = {
			accept: "*/*",
			"user-agent": "node",
		};
		for (const [key, value] of Object.entries(headers ?? {})) {
			requestHeaders[key.toLowerCase()] = String(value);
		}
		let requestBody: string | undefined;

		// Content-Typeヘッダーの確認
		const contentTypeValue = requestHeaders["content-type"] ?? "";
		const isFormUrlEncoded = contentTypeValue.includes(
			"application/x-www-form-urlencoded",
		);

		// POST, PUTなどでボディが存在する場合の処理
		if (body !== undefined && upperMethod !== "GET" && upperMethod !== "HEAD") {
			if (isFormUrlEncoded) {
				// application/x-www-form-urlencoded の場合
				if (typeof body === "string") {
					// クライアントから渡された文字列をそのままボディとして利用
					requestBody = body;
				} else {
					res.status(400).json({
						error:
							"Content-Type: application/x-www-form-urlencoded の場合、'body' は 'a=1&b=2' 形式の文字列である必要があります。",
					} as ProxyErrorResponse);
					return;
				}
			} else if (typeof body === "object" && body !== null) {
				// JSON (デフォルト) の場合
				requestBody = JSON.stringify(body);
				// Content-Type ヘッダーが明示的に設定されていない場合は application/json を追加
				if (!requestHeaders["content-type"]) {
					requestHeaders["content-type"] = "application/json";
				}
			} else if (typeof body === "string") {
				// その他の文字列ボディ
				requestBody = body;
			} else {
				res.status(400).json({
					error:
						"'body' の型が無効です。文字列またはJSONオブジェクトを指定してください。",
				} as ProxyErrorResponse);
				return;
			}
		}

		// --- 3. 外部リクエストの代理実行 ---

		try {
			const externalResponse = await proxyRequest(
				new URL(targetUrl),
				upperMethod,
				requestHeaders,
				requestBody,
			);

			// 外部APIからのレスポンスヘッダー
			const responseHeaders = externalResponse.headers;

			// 成功ステータス（2xx）以外はエラーとして扱う
			if (externalResponse.status < 200 || externalResponse.status > 299) {
				res.status(externalResponse.status).json({
					error: `外部リクエストに失敗しました: ${externalResponse.statusText}`,
					externalStatus: externalResponse.status,
					externalBody: externalResponse.text,
					// ヘッダー情報もエラーレスポンスに含める（デバッグ用）
					headers: responseHeaders,
				} as ProxyErrorResponse & { headers: Record<string, string> });
				return;
			}

			// コンテンツタイプをチェックして、JSONとして返すか、テキストとして返すか判断
			const contentType = responseHeaders["content-type"];
			const responseBody: unknown = contentType?.includes("application/json")
				? JSON.parse(externalResponse.text)
				: externalResponse.text;

			// 成功レスポンスの返却
			res.status(200).json({
				message: `${targetUrl} へのリクエストが成功しました。`,
				data: responseBody,
				status: externalResponse.status,
				headers: responseHeaders,
			} as ProxySuccessResponse);
		} catch (error) {
			// 接続時の名前解決で内部アドレスに変わっていた場合
			if ((error as NodeJS.ErrnoException)?.code === "EBLOCKED") {
				res.status(400).json({
					error: BLOCKED_MESSAGE,
				} as ProxyErrorResponse);
				return;
			}
			console.error("プロキシリクエスト処理中にエラーが発生しました:", error);
			res.status(500).json({
				error:
					"サーバー側で外部リクエストの処理中に予期せぬエラーが発生しました。",
			} as ProxyErrorResponse);
		}
	});

	// GET: 動作確認用の簡易エンドポイント
	router.get(api, (req: Request, res: Response) => {
		res.status(200).json({
			message:
				"プロキシAPIは動作しています。POSTリクエストで targetUrl, method, headers, body などを指定してください。",
		});
		return;
	});
};

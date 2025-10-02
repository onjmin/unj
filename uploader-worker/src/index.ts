import type {
	DurableObjectNamespace,
	ExecutionContext,
	R2Bucket,
} from "@cloudflare/workers-types";

import { RateLimiter } from "./RateLimiter";
export { RateLimiter };

import { ReplayProtector } from "./ReplayProtector";
export { ReplayProtector };

// ----------------------------------------------------------------------------
// 1. 環境変数の型定義 (DOのバインドを追加)
// ----------------------------------------------------------------------------

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
}

interface ReplayCheckResult {
	allowed: boolean;
	message: string;
}

interface Env {
	BUCKET: R2Bucket;
	PUBLIC_URL_BASE: string;
	CLIENT_ID: string; // 申し訳程度の認証
	UPLOAD_SECRET_PEPPER: string; // 正規のクライアントで発行されたハッシュの突合用
	DELETE_SECRET_PEPPER: string;
	RATE_LIMITER: DurableObjectNamespace;
	REPLAY_PROTECTOR: DurableObjectNamespace; // リプレイ攻撃保護用
}

// 許可する最大ファイルサイズ (1MB)
const MAX_FILE_SIZE = 1 * 1024 * 1024;
// 許可するファイル形式
const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
];

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
};

// (追加) SHA-256ハッシュ関数
// Cloudflare Workers環境では SubtleCrypto が利用可能
async function sha256(message: string): Promise<string> {
	const msgUint8 = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	// ハッシュを16進数文字列に変換
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ----------------------------------------------------------------------------
// 2. Workerのメインロジック
// ----------------------------------------------------------------------------
export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					...CORS_HEADERS,
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers":
						"Authorization, Content-Type, X-Request-Hash",
					"Access-Control-Max-Age": "86400", // 24 hours
				},
			});
		}

		// 2. 認証チェック
		const authHeader = request.headers.get("Authorization");
		const expectedAuth = `Client-ID ${env.CLIENT_ID}`;

		if (!authHeader || authHeader !== expectedAuth) {
			return new Response("Unauthorized. Invalid Client-ID.", {
				status: 401,
				headers: CORS_HEADERS,
			});
		}

		const cfRay = request.headers.get("CF-RAY");

		// CF-RAY ヘッダーが存在しない場合は、リクエストがCloudflareを通過していない可能性が高い
		if (!cfRay) {
			// 偽装の可能性があるため、リクエストを拒否するか、不明なIPとして扱う
			return new Response("Access Denied: Please use a proxied connection.", {
				status: 403,
				headers: CORS_HEADERS,
			});
		}

		const url = new URL(request.url);
		const path = url.pathname;

		if (request.method === "POST") {
			// 2. 荒らし対策: Durable Objectsによるレート制限
			const ip = request.headers.get("CF-Connecting-IP");
			if (!ip) {
				return new Response("IP address header not found.", {
					status: 400,
					headers: CORS_HEADERS,
				});
			}

			// IPアドレスをIDとしてDOのStubを取得 (同じIPは同じDOインスタンスにルーティングされる)
			const id = env.RATE_LIMITER.idFromName(ip);
			const stub = env.RATE_LIMITER.get(id);

			// DOの checkLimit メソッドを呼び出し、結果を取得
			const response = await stub.fetch(request.url, {
				method: "POST",
				body: JSON.stringify({ action: "checkLimit" }),
			});
			const limitResult = (await response.json()) as RateLimitResult;

			if (!limitResult.allowed) {
				// 制限超過
				return new Response(
					"Too Many Requests. Please wait before uploading again.",
					{
						status: 429,
						headers: CORS_HEADERS,
					},
				);
			}
			// 残り回数をログに表示 (開発用)
			console.log(`IP: ${ip}, Remaining uploads: ${limitResult.remaining}`);

			try {
				const bodyText = await request.text();
				const formData = new URLSearchParams(bodyText); // FormDataではないが、このオブジェクト名で利用
				const base64Image = formData.get("image");

				if (!base64Image) {
					return new Response("Missing 'image' parameter in body.", {
						status: 400,
						headers: CORS_HEADERS,
					});
				}

				// リプレイ攻撃対策はじまり

				// フロント側で算出されたハッシュを取得
				const requestHash = request.headers.get("X-Request-Hash");

				if (!base64Image) {
					return new Response("Missing 'image' parameter in body.", {
						status: 400,
						headers: CORS_HEADERS,
					});
				}

				// 4. (追加) リプレイ攻撃対策ロジック
				if (!requestHash) {
					return new Response("Missing X-Request-Hash header.", {
						status: 400,
						headers: CORS_HEADERS,
					});
				}

				// A. Worker側でのハッシュ計算 (入力 + SECRET_PEPPER)
				const combinedString = base64Image + env.UPLOAD_SECRET_PEPPER;
				const calculatedHash = await sha256(combinedString);

				// B. フロントからのハッシュと計算したハッシュの比較
				if (calculatedHash !== requestHash) {
					console.warn(
						`Hash mismatch! Calculated: ${calculatedHash}, Received: ${requestHash}`,
					);
					return new Response(
						"Invalid request hash. Hash verification failed.",
						{
							status: 403,
							headers: CORS_HEADERS,
						},
					);
				}

				// C. Durable Objectにハッシュを渡し、使用済みかチェック
				const protectorId = env.REPLAY_PROTECTOR.idFromName("global_protector");
				const protectorStub = env.REPLAY_PROTECTOR.get(protectorId);

				const checkResponse = await protectorStub.fetch(request.url, {
					method: "POST",
					body: JSON.stringify({
						action: "checkAndMarkUsed",
						hash: calculatedHash,
					}),
				});
				const replayResult = (await checkResponse.json()) as ReplayCheckResult;

				if (!replayResult.allowed) {
					console.warn(`Replay detected! Hash: ${calculatedHash}`);
					return new Response(
						`Replay attack detected: ${replayResult.message}`,
						{
							status: 403, // Forbidden
							headers: CORS_HEADERS,
						},
					);
				}

				// リプレイ攻撃対策おわり

				// 5. Base64デコードとバイナリのバリデーション
				const binaryData = atob(base64Image);
				const len = binaryData.length;

				// ファイルサイズのチェック
				if (len > MAX_FILE_SIZE) {
					return new Response(
						`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
						{
							status: 413,
							headers: CORS_HEADERS,
						},
					);
				}

				// ArrayBufferの作成
				const fileBuffer = new ArrayBuffer(len);
				const view = new Uint8Array(fileBuffer);
				for (let i = 0; i < len; i++) {
					view[i] = binaryData.charCodeAt(i);
				}

				// MIMEタイプを決定し、ファイル形式をチェック
				let mimeType = "application/octet-stream";
				let fileExtension = "dat";

				// 簡易的なマジックバイトチェック（JPEG, PNG, GIF, WebPに対応）
				if (view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
					mimeType = "image/jpeg";
					fileExtension = "jpg";
				} else if (
					view[0] === 0x89 &&
					view[1] === 0x50 &&
					view[2] === 0x4e &&
					view[3] === 0x47
				) {
					mimeType = "image/png";
					fileExtension = "png";
				} else if (view[0] === 0x47 && view[1] === 0x49 && view[2] === 0x46) {
					mimeType = "image/gif";
					fileExtension = "gif";
				} else if (
					view[0] === 0x52 &&
					view[1] === 0x49 &&
					view[2] === 0x46 &&
					view[3] === 0x46 &&
					view[8] === 0x57 &&
					view[9] === 0x45 &&
					view[10] === 0x42 &&
					view[11] === 0x50
				) {
					mimeType = "image/webp";
					fileExtension = "webp";
				}

				if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
					return new Response(
						`Unsupported file type based on binary header: ${mimeType}.`,
						{
							status: 415,
							headers: CORS_HEADERS,
						},
					);
				}

				// 6. R2への書き込み
				const key = `${crypto.randomUUID().slice(0, 8)}.${fileExtension}`;
				const deleteToken = await sha256(key + env.DELETE_SECRET_PEPPER);

				// put の第二引数を file.stream() から fileBuffer に変更
				await env.BUCKET.put(key, fileBuffer, {
					httpMetadata: {
						contentType: mimeType,
						cacheControl: "public, max-age=31536000, immutable",
					},
				});

				// 7. 公開URLの返却
				const publicUrl = `${env.PUBLIC_URL_BASE}/${key}`;

				return new Response(
					JSON.stringify({
						data: { link: publicUrl, delete_id: key, delete_hash: deleteToken },
					}),
					{
						status: 200,
						headers: {
							"Content-Type": "application/json",
							...CORS_HEADERS,
						},
					},
				);
			} catch (e) {
				console.error("Upload Error:", e);
				// DOの呼び出しでエラーが発生した場合のリカバリは、Workersの実行環境の制約上難しいため、ここでは汎用エラーを返す
				return new Response(
					"An internal error occurred during file processing.",
					{
						status: 500,
						headers: CORS_HEADERS,
					},
				);
			}
		} else if (request.method === "DELETE" && path === "/delete") {
			// 1. 認証チェック (アップロード時と同様のClient-ID認証を使用)
			const authHeader = request.headers.get("Authorization");
			const expectedAuth = `Client-ID ${env.CLIENT_ID}`;

			if (!authHeader || authHeader !== expectedAuth) {
				return new Response("Unauthorized.", {
					status: 401,
					headers: CORS_HEADERS,
				});
			}

			const deleteId = url.searchParams.get("delete_id"); // ファイルID
			const deleteHash = url.searchParams.get("delete_hash"); // 削除トークン

			if (!deleteId || !deleteHash) {
				return new Response("Missing 'id' or 'deletehash' parameter.", {
					status: 400,
					headers: CORS_HEADERS,
				});
			}

			const calculatedDeleteHash = await sha256(
				deleteId + env.DELETE_SECRET_PEPPER,
			);

			if (calculatedDeleteHash !== deleteHash) {
				// ハッシュが一致しない場合、無効な削除リクエストとして拒否
				return new Response("Forbidden. Invalid deletion token.", {
					status: 403,
					headers: CORS_HEADERS,
				});
			}

			try {
				// 4. R2からの削除実行
				await env.BUCKET.delete(deleteId);

				return new Response(
					JSON.stringify({
						message: `Object ${deleteId} deleted successfully.`,
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json", ...CORS_HEADERS },
					},
				);
			} catch (e) {
				console.error("R2 Delete Error:", e);
				return new Response("Failed to delete object from R2.", {
					status: 500,
					headers: CORS_HEADERS,
				});
			}
		}

		// ... (POST 以外のリクエストに対するデフォルトの応答)
		return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
	},
};

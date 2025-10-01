import type {
	DurableObjectNamespace,
	ExecutionContext,
	R2Bucket,
} from "@cloudflare/workers-types";

import { RateLimiter } from "./RateLimiter";
export { RateLimiter };

// ----------------------------------------------------------------------------
// 1. 環境変数の型定義 (DOのバインドを追加)
// ----------------------------------------------------------------------------

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
}

interface Env {
	BUCKET: R2Bucket;
	PUBLIC_URL_BASE: string;
	CLIENT_ID: string;
	RATE_LIMITER: DurableObjectNamespace;
}

// 許可する最大ファイルサイズ (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;
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
					"Access-Control-Allow-Headers": "Authorization, Content-Type",
					"Access-Control-Max-Age": "86400", // 24 hours
				},
			});
		}

		// 1. HTTPメソッドのチェック
		if (request.method !== "POST") {
			return new Response(
				"Method Not Allowed. Only POST is accepted for uploads.",
				{
					status: 405,
					headers: CORS_HEADERS,
				},
			);
		}

		// 2. 認証チェック <-- ここから追加/変更
		const authHeader = request.headers.get("Authorization");
		const expectedAuth = `Client-ID ${env.CLIENT_ID}`;

		if (!authHeader || authHeader !== expectedAuth) {
			return new Response("Unauthorized. Invalid Client-ID.", {
				status: 401,
				headers: CORS_HEADERS,
			});
		}

		// 2. 荒らし対策: Durable Objectsによるレート制限
		const ip = request.headers.get("CF-Connecting-IP");
		if (!ip) {
			return new Response("IP address header not found.", {
				status: 400,
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
			const key = `${crypto.randomUUID()}.${fileExtension}`;

			// put の第二引数を file.stream() から fileBuffer に変更
			await env.BUCKET.put(key, fileBuffer, {
				httpMetadata: {
					contentType: mimeType,
					cacheControl: "public, max-age=31536000, immutable",
				},
			});

			// 7. 公開URLの返却
			const publicUrl = `${env.PUBLIC_URL_BASE}/${key}`;

			return new Response(JSON.stringify({ data: { link: publicUrl } }), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					...CORS_HEADERS,
				},
			});
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
	},
};

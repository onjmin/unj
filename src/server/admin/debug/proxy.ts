import type { Request, Response, Router } from "express";

const api = "/debug/proxy";

// 外部リクエストのオプションを含む入力インターフェースを定義
interface ProxyRequestOptions {
	targetUrl: string;
	method?: string; // GET, POST, PUT, DELETE など
	headers?: Record<string, string>; // Content-Type などを含むヘッダー
	body?: unknown; // リクエストボディ
}

// 成功時のレスポンス型を定義 (以前のものを維持)
interface ProxySuccessResponse {
	message: string;
	data: unknown; // 外部APIのレスポンスボディ (string|object|array)
	status: number; // 外部APIのHTTPステータスコード
}

// エラー時のレスポンス型を定義 (以前のものを維持)
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
	// POST: 外部サイトへのリクエストの代理実行（method, body, headers対応）
	router.post(api, async (req: Request, res: Response) => {
		// リクエストボディからオプションを取得し、型を適用
		const {
			targetUrl,
			method = "GET",
			headers,
			body,
		} = req.body as Partial<ProxyRequestOptions>;

		// --- 1. バリデーション ---

		if (typeof targetUrl !== "string" || !targetUrl) {
			res.status(400).json({
				error: "リクエストボディに 'targetUrl' (string) が必要です。",
			} as ProxyErrorResponse);
			return;
		}

		if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
			res.status(400).json({
				error:
					"targetUrl は 'http://' または 'https://' から始まる必要があります。",
			} as ProxyErrorResponse);
			return;
		}

		if (
			typeof method !== "string" ||
			!["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase())
		) {
			res.status(400).json({
				error: "無効な 'method' が指定されました。",
			} as ProxyErrorResponse);
			return;
		}

		// --- 2. fetchオプションの準備 ---

		const fetchOptions: RequestInit = {
			method: method.toUpperCase(),
			headers: headers as HeadersInit,
		};

		const contentTypeHeader = Object.keys(headers || {}).find(
			(key) => key.toLowerCase() === "content-type",
		);
		const isFormUrlEncoded =
			contentTypeHeader &&
			headers?.[contentTypeHeader].includes(
				"application/x-www-form-urlencoded",
			);

		// POST, PUTなどでボディが存在する場合の処理
		if (
			body !== undefined &&
			fetchOptions.method !== "GET" &&
			fetchOptions.method !== "HEAD"
		) {
			// Content-Typeヘッダーの確認とフラグ設定
			const contentTypeHeaderKey = Object.keys(headers || {}).find(
				(key) => key.toLowerCase() === "content-type",
			);
			const contentTypeValue = contentTypeHeaderKey
				? headers?.[contentTypeHeaderKey]
				: "";
			const isFormUrlEncoded = contentTypeValue?.includes(
				"application/x-www-form-urlencoded",
			);

			if (isFormUrlEncoded) {
				// 💡 application/x-www-form-urlencoded の場合
				if (typeof body === "string") {
					// クライアントから渡された文字列（例: a=1&b=2）をそのままボディとして利用
					fetchOptions.body = body;
				} else {
					// クライアントが文字列化せずにオブジェクトを渡した場合、ここではエラーとする
					// (クライアントの責務として文字列化を強制するため)
					res.status(400).json({
						error:
							"Content-Type: application/x-www-form-urlencoded の場合、'body' は 'a=1&b=2' 形式の文字列である必要があります。",
					} as ProxyErrorResponse);
					return;
				}
			} else if (typeof body === "object" && body !== null) {
				// JSON (デフォルト、またはその他のオブジェクトボディ) の場合
				fetchOptions.body = JSON.stringify(body);
				// Content-Type ヘッダーが明示的に設定されていない場合は application/json を追加
				if (!contentTypeHeaderKey) {
					fetchOptions.headers = {
						...(fetchOptions.headers as Record<string, string>),
						"Content-Type": "application/json",
					};
				}
			} else if (typeof body === "string") {
				// application/x-www-form-urlencoded 以外の文字列 (例: XML, テキストなど)
				fetchOptions.body = body;
			} else {
				// その他の型は未サポートとしてエラーとする
				res.status(400).json({
					error:
						"'body' の型が無効です。文字列またはJSONオブジェクトを指定してください。",
				} as ProxyErrorResponse);
				return;
			}
		}

		// --- 3. 外部リクエストの代理実行 ---

		try {
			const externalResponse = await fetch(targetUrl, fetchOptions);

			// 成功ステータス（2xx）以外はエラーとして扱う
			if (!externalResponse.ok) {
				const errorText = await externalResponse.text();
				res.status(externalResponse.status).json({
					error: `外部リクエストに失敗しました: ${externalResponse.statusText}`,
					externalStatus: externalResponse.status,
					externalBody: errorText,
				} as ProxyErrorResponse);
				return;
			}

			// コンテンツタイプをチェックして、JSONとして返すか、テキストとして返すか判断
			const contentType = externalResponse.headers.get("content-type");
			const responseBody: unknown = await (contentType?.includes(
				"application/json",
			)
				? externalResponse.json()
				: externalResponse.text());

			// 成功レスポンスの返却
			res.status(200).json({
				message: `${targetUrl} へのリクエストが成功しました。`,
				data: responseBody,
				status: externalResponse.status,
				fetchOptions,
			} as ProxySuccessResponse);
		} catch (error) {
			res.status(500).json({
				error:
					"サーバー側で外部リクエストの処理中に予期せぬエラーが発生しました。",
			} as ProxyErrorResponse);
		}
	});
};

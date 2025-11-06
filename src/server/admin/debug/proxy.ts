import type { Request, Response, Router } from "express";

const api = "/debug/proxy";

/**
 * プロキシAPIのルーター定義
 * POSTリクエストでtargetUrlを受け取り、そのURLへGETリクエストを代理実行し、レスポンスを返却する。
 */
export default (router: Router) => {
	router.post(api, async (req: Request, res: Response) => {
		const { targetUrl } = req.body;

		// 1. targetUrlのバリデーション
		if (!targetUrl || typeof targetUrl !== "string") {
			res.status(400).json({
				error: "リクエストボディに 'targetUrl' (string) が必要です。",
			});
			return;
		}

		// 簡単なURL形式のチェック（セキュリティ対策としては不十分ですが、例として）
		if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
			res.status(400).json({
				error:
					"targetUrl は 'http://' または 'https://' から始まる必要があります。",
			});
			return;
		}

		try {
			// 2. 外部サイトへGETリクエストを代理実行
			const externalResponse = await fetch(targetUrl, {
				method: "GET",
			});

			// 3. 外部からのレスポンスをクライアントに返却

			// 成功ステータス（2xx）以外はエラーとして扱う
			if (!externalResponse.ok) {
				// 外部APIのエラー内容をそのまま伝える（または加工する）
				const errorText = await externalResponse.text();
				res.status(externalResponse.status).json({
					error: `外部リクエストに失敗しました: ${externalResponse.statusText}`,
					externalStatus: externalResponse.status,
					externalBody:
						errorText.substring(0, 200) + (errorText.length > 200 ? "..." : ""), // 長すぎる場合は切り詰める
				});
				return;
			}

			// コンテンツタイプをチェックして、JSONとして返すか、テキストとして返すか判断
			const contentType = externalResponse.headers.get("content-type");
			const responseBody = await (contentType?.includes("application/json")
				? externalResponse.json()
				: externalResponse.text());

			// 成功レスポンスの返却
			res.status(200).json({
				message: `${targetUrl} へのリクエストが成功しました。`,
				data: responseBody,
				status: externalResponse.status,
			});
		} catch (error) {
			// ネットワークエラー、DNSエラーなど、リクエスト自体が失敗した場合
			console.error("プロキシリクエスト処理中にエラーが発生しました:", error);
			res.status(500).json({
				error:
					"サーバー側で外部リクエストの処理中に予期せぬエラーが発生しました。",
			});
		}
	});
};

import http from "node:http";
import path from "node:path";
import express from "express";
import { Server } from "socket.io";
// import { calcUnjApiToken } from "./mylib/anti-debug.js";
import { DEV_MODE, ROOT_PATH, STG_MODE } from "./mylib/env.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: { origin: "*" }, // CORS の設定（適宜変更）
});

if (DEV_MODE || STG_MODE) {
	// JSON形式のリクエストに対応
	app.use(express.json());

	// 静的ファイルの配信
	app.use("/static", express.static(path.resolve(ROOT_PATH, "static")));
	app.use(express.static(path.resolve(ROOT_PATH, "dist", "client")));

	// フロントエンドのエントリポイント
	app.get("/", (req, res) => {
		res.sendFile(path.resolve(ROOT_PATH, "dist", "client", "index.html"));
	});

	app.use((req, res) => {
		res.sendFile(path.resolve(ROOT_PATH, "dist", "client", "404.html"));
	});
}

// 適当なAPI
// app.post("/api/hash", (req, res) => {
// 	const token = req.body.token;
// 	const token2 = calcUnjApiToken();
// 	res.json({ token, token2, message: token === token2 ? "OK" : "NG" });
// });

// socket.io
io.on("connection", (socket) => {
	const ip = socket.handshake.address;
	const ua = socket.handshake.headers["user-agent"];

	// ipとuaのバリデーションが不自然なら遮断

	console.log(`New connection from IP: ${ip}, UA: ${ua}`);

	console.log("WebSocket クライアント接続:", socket.id);

	socket.on("message", (data) => {
		console.log("受信:", data);
		io.emit("message", data); // すべてのクライアントに送信
	});

	socket.on("disconnect", () => {
		console.log("クライアント切断:", socket.id);
	});

	socket.on("new_post", async (data) => {
		// // サーバー側でも検証を実施
		// const result = postSchema.safeParse(data);
		// if (!result.success) {
		// 	console.error("サーバー側の検証エラー:", result.error);
		// 	// クライアントにエラー情報を返す（必要なら）
		// 	socket.emit("post_error", result.error.issues);
		// 	return;
		// }
		// // 検証OKならDBへ挿入する（DB挿入部分はお使いのDBモジュールに合わせて実装）
		// try {
		// 	// 例: await insertPost(result.data);
		// 	console.log("DBに投稿を保存:", result.data);
		// 	// クライアントに成功通知を送る
		// 	socket.emit("post_success", { message: "投稿が完了しました" });
		// } catch (error) {
		// 	console.error("DB挿入エラー:", error);
		// 	socket.emit("post_error", { message: "DB挿入に失敗しました" });
		// }
	});
});

// Glitch の場合は `process.env.PORT` を使用する
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`サーバー起動: ポート ${PORT}`);
});

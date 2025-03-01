import http from "node:http";
import path from "node:path";
import express from "express";
import forwardedParse from "forwarded-parse";
import { sha256 } from "js-sha256";
import { Server } from "socket.io";
import * as v from "valibot";
import { getContentSchema } from "../common/validation/content-schema.js";
import {
	HeadlineSchema,
	MakeThreadSchema,
	ReadThreadSchema,
	ResSchema,
	SearchResSchema,
	SearchThreadSchema,
} from "../common/validation/schema.js";
import {
	DEV_MODE,
	ROOT_PATH,
	STG_MODE,
	UNJ_ADMIN_API_KEY,
} from "./mylib/env.js";

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

// サービスを止めずに投稿規制するためのAPI
app.post("/api/admin", (req, res) => {
	const token = sha256(req.body.token);
	const token2 = sha256(String(UNJ_ADMIN_API_KEY));
	res.json({ token, token2, message: token === token2 ? "OK" : "NG" });
	// TODO: io.disconnectSockets(false);
	// TODO: io.disconnectSockets(true);
	// TODO: io.close();
	// TODO: 対象ユーザーの忍法帖スコアを操作
	// TODO: 自動BANの基準を変更
	// TODO: 一律Socket新規発行停止
	// TODO: 一律スレ立て禁止
	// TODO: 一律低速レスモード
	// TODO: 一律content_types_bitmask規制
});

// socket.io
io.on("connection", (socket) => {
	// https://socket.io/how-to/get-the-ip-address-of-the-client#x-forwarded-for-header
	let ip = socket.handshake.address;
	const cf = socket.handshake.headers["cf-connecting-ip"];
	const fastly = socket.handshake.headers["fastly-client-ip"];
	if (socket.handshake.headers.forwarded) {
		const forwarded = forwardedParse(socket.handshake.headers.forwarded);
		if (forwarded && forwarded.length > 0 && forwarded[0].for) {
			ip = forwarded[0].for;
		}
	} else if (Array.isArray(cf)) {
		ip = cf[0];
	} else if (cf) {
		ip = cf;
	} else if (Array.isArray(fastly)) {
		ip = fastly[0];
	} else if (fastly) {
		ip = fastly;
	}
	const ua = socket.handshake.headers["user-agent"];
	if (!ip || !ua) {
		socket.disconnect();
	}

	socket.on("disconnect", () => {
		console.log("クライアント切断:", socket.id);
	});

	// socket.on("joinRoom", (roomId) => {
	// 	socket.join(roomId);
	// 	console.log(`Socket ${socket.id} joined room ${roomId}`);
	// });

	// socket.on("leaveRoom", (roomId) => {
	// 	socket.leave(roomId);
	// 	console.log(`Socket ${socket.id} left room ${roomId}`);
	// });

	// socket.on("postMessage", (data) => {
	// 	// const result = postSchema.safeParse(data);
	// 	// if (!result.success) {
	// 	// 	return;
	// 	// }
	// 	try {
	// 		// 	// 例: await insertPost(result.data);
	// 	} catch (error) {}
	// 	// テーブル追加（自動採番）
	// 	io.to(data.roomId).emit("newMessage", data.message);
	// });

	socket.on("makeThread", async (data) => {
		const resultMakeThread = v.safeParse(MakeThreadSchema, data);
		if (!resultMakeThread.success) {
			return;
		}
		const resultRes = v.safeParse(ResSchema, data);
		if (!resultRes.success) {
			return;
		}
		const bit = resultRes.output.content_type;
		if (!(bit & resultMakeThread.output.content_types_bitmask)) {
			return;
		}
		const contentSchema = getContentSchema(bit);
		const resultContentSchema = v.safeParse(contentSchema, data);
		if (!resultContentSchema.success) {
			return;
		}
		try {
			// await insertPost(result.data);
			socket.emit("makeThread", { message: "スレ立て成功" });
		} catch (error) {}
	});
});

const PORT = process.env.PORT || process.env.VITE_GLITCH_PORT;
server.listen(PORT, () => {
	console.log(`サーバー起動: ポート ${PORT}`);
});

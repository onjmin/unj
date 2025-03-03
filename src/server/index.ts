import http from "node:http";
import path from "node:path";
import express from "express";
import { sha256 } from "js-sha256";
import { Server } from "socket.io";
import handleGetToken from "./mylib/api/getToken.js";
import handleHeadline from "./mylib/api/headline.js";
import handleJoinHeadline from "./mylib/api/joinHeadline.js";
import handleJoinThread from "./mylib/api/joinThread.js";
import handleMakeThread from "./mylib/api/makeThread.js";
import handleReadThread from "./mylib/api/readThread.js";
import handleRes from "./mylib/api/res.js";
import { DEV_MODE, PROD_MODE, ROOT_PATH, STG_MODE } from "./mylib/env.js";
import Token from "./mylib/token.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: new URL(String(process.env.VITE_BASE_URL)).origin,
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket", "polling"],
});

app.use(express.json());

if (DEV_MODE || STG_MODE) {
	app.use("/static", express.static(path.resolve(ROOT_PATH, "static")));
	app.use(express.static(path.resolve(ROOT_PATH, "dist", "client")));
	app.get("/", (req, res) => {
		res.sendFile(path.resolve(ROOT_PATH, "dist", "client", "index.html"));
	});
	app.use((req, res) => {
		res.sendFile(path.resolve(ROOT_PATH, "dist", "client", "404.html"));
	});
} else if (PROD_MODE) {
	app.use(express.static(path.resolve(ROOT_PATH, "public")));
}

const UNJ_ADMIN_API_KEY = String(process.env.UNJ_ADMIN_API_KEY);

app.get("/ping", (req, res) => {
	res.send("pong");
});

// サービスを止めずに投稿規制するためのAPI
app.post("/api/admin", (req, res) => {
	const token = sha256(req.body.token);
	const token2 = sha256(UNJ_ADMIN_API_KEY);
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

const online: Set<string> = new Set();

// socket.io
io.on("connection", (socket) => {
	const fastlyClientIp = socket.handshake.headers["fastly-client-ip"];
	const ip = Array.isArray(fastlyClientIp)
		? fastlyClientIp[0] // TODO: 人為的にfastly-client-ipヘッダを付加されたケース
		: (fastlyClientIp ?? socket.conn.remoteAddress);
	const ua = socket.handshake.headers["user-agent"];

	console.log("connected", { ip, ua });

	if (!ip || !ua) {
		socket.disconnect();
		return;
	}
	if (online.has(ip)) {
		socket.disconnect();
		return;
	}
	online.add(ip);
	socket.on("disconnect", () => {
		online.delete(ip);
	});

	// TODO: gBANチェック

	const auth = "yG8LHE2p"; // TODO: usersテーブルからユーザーを特定する
	Token.init(socket, auth);

	handleGetToken({ socket, io });
	handleJoinHeadline({ socket, io, online });
	handleJoinThread({ socket, io });
	handleHeadline({ socket, io });
	handleMakeThread({ socket, io });
	handleReadThread({ socket });
	handleRes({ socket, io });
});

const PORT = process.env.PORT || process.env.VITE_LOCALHOST_PORT;
server.listen(PORT, () => {
	console.log(`サーバー起動: ポート ${PORT}`);
});

import http from "node:http";
import path from "node:path";
import express from "express";
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
import { flaky } from "./mylib/anti-debug.js";
import { DEV_MODE, PROD_MODE, ROOT_PATH, STG_MODE } from "./mylib/env.js";

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

// socket.io
io.on("connection", (socket) => {
	console.log("connection");
	const ip = socket.conn.remoteAddress;
	const ua = socket.handshake.headers["user-agent"];
	console.log("connected", { ip, ua });
	if (!ip || !ua) {
		console.log("kicked", { ip, ua });
		socket.emit("disconnect", { reason: "unknownIP" });
		socket.disconnect();
	}
	// TODO: gBANチェック

	socket.on("disconnect", () => {
		console.log("クライアント切断:", socket.id);
	});

	// TODO: スレを開いたとき：socket.join(roomId); 今まで参加したroomIdはすべて退室
	// TODO: スレを投稿したとき：io.to(data.roomId).emit("newMessage", data.message);
	// TODO: 別のスレを開いたとき：socket.join(roomId); 今まで参加したroomIdはすべて退室
	// TODO: ヘッドラインを開いたとき：socket.join(ヘッドラインのroomId); 今まで参加したroomIdはすべて退室

	socket.on("res", async (data) => {
		const resultRes = v.safeParse(ResSchema, data);
		if (!resultRes.success) {
			return;
		}
		const { content_type } = resultRes.output;
		const contentSchema = getContentSchema(content_type);
		const resultContentSchema = v.safeParse(contentSchema, data);
		if (!resultContentSchema.success) {
			return;
		}
		// read thread
		// if (!(content_type & resultMakeThread.output.content_types_bitmask)) {
		// 	return;
		// }
		try {
			// await insertPost(result.data);
			const thread_id = "";
			socket.join(thread_id);
			socket.emit("res", { success: true }); // TODO
		} catch (error) {}
	});

	socket.on("makeThread", async (data) => {
		const resultRes = v.safeParse(ResSchema, data);
		if (!resultRes.success) {
			return;
		}
		const { content_type } = resultRes.output;
		const contentSchema = getContentSchema(content_type);
		const resultContentSchema = v.safeParse(contentSchema, data);
		if (!resultContentSchema.success) {
			return;
		}
		const resultMakeThread = v.safeParse(MakeThreadSchema, data);
		if (!resultMakeThread.success) {
			return;
		}
		const { content_types_bitmask } = resultMakeThread.output;
		if (!(content_type & content_types_bitmask)) {
			return;
		}
		try {
			// await insertPost(result.data);
			const thread_id = Math.random().toString();
			socket.join(thread_id);
			socket.emit("makeThread", { success: true, thread_id });
		} catch (error) {}
	});

	socket.on("readThread", async (data) => {
		const resultReadThread = v.safeParse(ReadThreadSchema, data);
		if (!resultReadThread.success) {
			return;
		}
		const { cursor, size, desc } = resultReadThread.output;
		const { thread_id } = resultReadThread.output;
		try {
			// await getPost(result.data);
			socket.join(thread_id);
			socket.emit("readThread", { success: true });
		} catch (error) {}
	});

	socket.on("headline", async (data) => {
		console.log("headline");
		const resultHeadline = v.safeParse(HeadlineSchema, data);
		if (!resultHeadline.success) {
			return;
		}
		const { cursor, size, desc } = resultHeadline.output;
		try {
			// await getPost(result.data);
			socket.emit("headline", {
				success: true,
				list: [...Array(16)].map((v) => mock),
			});
		} catch (error) {}
	});

	const mock = {
		id: "12345678",
		latest_res_at: new Date(),
		res_count: 256,
		title: "【朗報】侍ジャパン、謎のホームランで勝利！",
		user_id: "1234",
		online: io.sockets.adapter.rooms.get("12345678")?.size ?? 0,
		ikioi: 256 / 100, // おそらく、総レス数/スレ経過日時
		lol_count: 3,
		good_count: 4,
		bad_count: 5,
	};
});

const PORT = process.env.PORT || process.env.VITE_LOCALHOST_PORT;
server.listen(PORT, () => {
	console.log(`サーバー起動: ポート ${PORT}`);
});

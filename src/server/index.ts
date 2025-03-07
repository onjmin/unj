import { DEV_MODE, PROD_MODE, ROOT_PATH, STG_MODE } from "./mylib/env.js";

import http from "node:http";
import path from "node:path";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import { sha256 } from "js-sha256";
import { Server, type Socket } from "socket.io";
import * as v from "valibot";
import { validate1 } from "../common/request/util.js";
import registerBlacklist, { blacklist } from "./admin/blacklist.js";
import registerTor, { torIPList } from "./admin/tor.js";
import registerVpngate, { vpngateIPList } from "./admin/vpngate.js";
import handleGetNonceKey from "./api/getNonceKey.js";
import handleHeadline from "./api/headline.js";
import handleJoinHeadline from "./api/joinHeadline.js";
import handleJoinThread from "./api/joinThread.js";
import handleMakeThread from "./api/makeThread.js";
import handleReadThread from "./api/readThread.js";
import handleRes from "./api/res.js";
import { flaky } from "./mylib/anti-debug.js";
import Auth from "./mylib/auth.js";
import { detectFastlyClientIp, isBannedIP } from "./mylib/ip.js";
import Nonce from "./mylib/nonce.js";

const bannedCheckMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const ip =
		detectFastlyClientIp(req.headers["fastly-client-ip"]) ?? req.ip ?? "";
	console.log("👀", ip);
	if (isBannedIP(ip)) {
		console.log("❌", ip);
		return;
	}
	next();
};

// サービスを止めずに投稿規制するためのAPI
const authorizationSchema = v.pipe(v.string(), v.hash(["sha256"]));
const UNJ_ADMIN_API_KEY = String(process.env.UNJ_ADMIN_API_KEY);
const adminAuthMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const input = req.headers.authorization;
	const error = validate1(authorizationSchema, input);
	if (error) {
		res.status(400).json({ error });
		return;
	}
	if (sha256(input ?? "") !== sha256(UNJ_ADMIN_API_KEY)) {
		res.status(401).json({ error: "Unauthorized: Invalid token" });
		return;
	}
	next();
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: [
			new URL(String(process.env.VITE_BASE_URL)).origin,
			"https://onjmin.github.io",
			"https://unj-i1v.pages.dev",
			"https://unjupiter.pages.dev",
		],
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket", "polling"],
});

app.use(express.json());
app.get("/ping", bannedCheckMiddleware, (req, res) => {
	res.send("pong");
});

const router = express.Router();
router.use(bannedCheckMiddleware, adminAuthMiddleware);
registerBlacklist(router);
registerTor(router);
registerVpngate(router);
// TODO: 自動BANの基準を変更
// TODO: 一律Socket新規発行停止
// TODO: 一律スレ立て禁止
// TODO: 一律低速レスモード
// TODO: 一律content_types_bitmask規制
app.use("/api/admin", router);

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

const online: Set<string> = new Set();
const kick = (socket: Socket, reason: string) =>
	flaky(() => {
		socket.emit("kicked", {
			reason,
		});
	});

let accessCount = 0;
const accessCounter = () => accessCount;

// socket.io
io.on("connection", async (socket) => {
	const ip =
		detectFastlyClientIp(socket.handshake.headers["fastly-client-ip"]) ??
		socket.conn.remoteAddress;
	console.log("👀", ip);
	if (isBannedIP(ip)) {
		console.log("❌", ip);
		kick(socket, "banned");
		socket.disconnect();
		return;
	}
	if (online.has(ip)) {
		kick(socket, "multipleConnections");
		socket.disconnect();
		return;
	}
	online.add(ip);
	socket.on("disconnect", () => {
		online.delete(ip);
	});

	accessCount++;

	const auth = "yG8LHE2p"; // TODO: 新規user発行 || usersテーブルからユーザーを特定する
	Auth.init(socket, auth);
	Nonce.init(socket);

	handleGetNonceKey({ socket });
	handleJoinHeadline({ socket, io, online, accessCounter });
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

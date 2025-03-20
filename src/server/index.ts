import { DEV_MODE, PROD_MODE, ROOT_PATH, STG_MODE } from "./mylib/env.js";

import http from "node:http";
import path from "node:path";
import { isBefore } from "date-fns";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import { sha256 } from "js-sha256";
import { Server, type Socket } from "socket.io";
import * as v from "valibot";
import registerBlacklistID, { blacklist } from "./admin/blacklist/id.js";
import registerBlacklistIP from "./admin/blacklist/ip.js";
import registerBlacklistTor from "./admin/blacklist/tor.js";
import registerBlacklistVpngate from "./admin/blacklist/vpngate.js";
import registerLogGrep from "./admin/log/grep.js";
import registerLogLevel from "./admin/log/level.js";
import handleGetNonceKey from "./api/getNonceKey.js";
import handleHeadline from "./api/headline.js";
import handleJoinHeadline from "./api/joinHeadline.js";
import handleJoinThread from "./api/joinThread.js";
import handleLike from "./api/like.js";
import handleLol from "./api/lol.js";
import handleMakeThread from "./api/makeThread.js";
import handleReadThread from "./api/readThread.js";
import handleRes from "./api/res.js";
import { flaky } from "./mylib/anti-debug.js";
import auth from "./mylib/auth.js";
import { detectFastlyClientIp, getIP, isBannedIP, setIP } from "./mylib/ip.js";
import { logger } from "./mylib/log.js";
import nonce from "./mylib/nonce.js";

const bannedCheckMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const ip =
		detectFastlyClientIp(req.headers["fastly-client-ip"]) ?? req.ip ?? "";
	logger.http(`👁️ ${ip}`);
	if (isBannedIP(ip)) {
		logger.http(`❌ ${ip}`);
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
	const result = v.safeParse(authorizationSchema, input);
	if (!result.success) {
		res.status(400).json({ error: v.flatten(result.issues) });
		return;
	}
	if (sha256(input ?? "") !== sha256(UNJ_ADMIN_API_KEY)) {
		res.status(401).json({ error: "Unauthorized: Invalid token" });
		return;
	}
	next();
	logger.verbose(req.path);
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: [
			new URL(String(process.env.VITE_BASE_URL)).origin,
			"https://onjmin.github.io",
			"https://unj-i1v.pages.dev",
			"https://unj.netlify.app",
			"https://unj.on-fleek.app",
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
registerLogGrep(router);
registerLogLevel(router);
registerBlacklistID(router);
registerBlacklistIP(router);
registerBlacklistTor(router);
registerBlacklistVpngate(router);
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
let accessCount = 0;
const accessCounter = () => accessCount;

const verifyIP = (socket: Socket, ip: string) => {
	if (isBannedIP(ip)) {
		logger.http(`❌ ${ip}`);
		flaky(() => auth.kick(socket, "banned"));
		socket.disconnect();
	}
};

const verifyUserId = (socket: Socket, userId: number) => {
	if (blacklist.has(userId)) {
		logger.http(`❌ ${getIP(socket)} ${userId}`);
		flaky(() => auth.kick(socket, "banned"));
		socket.disconnect();
	}
};

// socket.io
io.on("connection", async (socket) => {
	const ip =
		detectFastlyClientIp(socket.handshake.headers["fastly-client-ip"]) ??
		socket.conn.remoteAddress;
	logger.http(`👀 ${ip}`);
	verifyIP(socket, ip);
	if (online.has(ip)) {
		auth.kick(socket, "multipleConnections");
		socket.disconnect();
		return;
	}
	online.add(ip);
	socket.on("disconnect", () => {
		online.delete(ip);
	});

	setIP(socket, ip);

	const claims = auth.parseClaims(socket);
	if (claims) {
		logger.verbose(`🪪 ${JSON.stringify(claims)}`);
		const userId = claims.userId;
		verifyUserId(socket, userId);
		if (isBefore(new Date(), claims.expiryDate)) {
			logger.verbose(`✅ ${JSON.stringify(claims)}`);
			auth.grant(socket, userId, claims.expiryDate);
		} else {
			logger.verbose(`🗑️ ${JSON.stringify(claims)}`);
			await auth.init(socket);
		}
	} else {
		logger.verbose(`✨ ${JSON.stringify(claims)}`);
		await auth.init(socket);
	}

	nonce.init(socket);

	socket.use((_, next) => {
		verifyIP(socket, getIP(socket));
		verifyUserId(socket, auth.getUserId(socket));
		if (auth.isAuthExpired(socket)) {
			auth.updateAuthToken(socket);
		}
		next();
	});

	handleGetNonceKey({ socket });
	handleJoinHeadline({ socket, io, online, accessCounter });
	handleJoinThread({ socket, io });
	handleHeadline({ socket, io });
	handleLike({ socket, io });
	handleLol({ socket, io });
	handleMakeThread({ socket });
	handleReadThread({ socket });
	handleRes({ socket, io });

	accessCount++;
});

const PORT = process.env.PORT || process.env.VITE_LOCALHOST_PORT;
server.listen(PORT, () => {
	const msg = `🟢 listening on ${PORT}...`;
	console.log(msg);
	logger.info(msg);
});

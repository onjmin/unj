import http from "node:http";
import path from "node:path";
import { isBefore } from "date-fns";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import { Server, type Socket } from "socket.io";
import * as v from "valibot";
import { isSerial } from "../common/request/schema.js";
import registerBlacklistID, { blacklist } from "./admin/blacklist/id.js";
import registerBlacklistIP from "./admin/blacklist/ip.js";
import registerBlacklistTor from "./admin/blacklist/tor.js";
import registerBlacklistVpngate from "./admin/blacklist/vpngate.js";
import registerDebugProxy from "./admin/debug/proxy.js";
import registerDebugZombie from "./admin/debug/zombie.js";
import registerEmergencyDenyAll, {
	isDenyAll,
} from "./admin/emergency/deny-all.js";
import registerLogGrep from "./admin/log/grep.js";
import registerLogLevel from "./admin/log/level.js";
import registerThreadMake from "./admin/thread/make.js";
import registerThreadOwner from "./admin/thread/owner.js";
import registerThreadRes from "./admin/thread/res.js";
import registerUserNinja from "./admin/user/ninja.js";
import handleContact, {
	registerContactRoute,
	reportBanned,
} from "./api/contact.js";
import handleGetNonceKey from "./api/getNonceKey.js";
import handleHeadline from "./api/headline.js";
import handleJoinHeadline from "./api/joinHeadline.js";
import handleJoinThread from "./api/joinThread.js";
import handleLike from "./api/like.js";
import handleLol from "./api/lol.js";
import handleMakeThread from "./api/makeThread.js";
import handleReadThread from "./api/readThread.js";
import handleRes from "./api/res.js";
import handleRpgInit from "./api/rpgInit.js";
import handleRpgPatch from "./api/rpgPatch.js";
import handleSearch from "./api/search.js";
import { flaky, safeEqual } from "./mylib/anti-debug.js";
import auth from "./mylib/auth.js";
import {
	DEV_MODE,
	PROD_MODE,
	ROOT_PATH,
	STG_MODE,
	validateEnv,
} from "./mylib/env.js";
import {
	detectClientIpFromHeaders,
	getIP,
	ipKey,
	ipPrefixKey,
	isBannedIP,
	setIP,
} from "./mylib/ip.js";
import { logger } from "./mylib/log.js";
import nonce from "./mylib/nonce.js";
import {
	acquireSlot,
	incrementAccessCount,
	limitByIP,
	limitByIPPrefix,
	limitByUserId,
	online,
	onlineByIPPrefix,
	onlineByUserId,
	totalSocketConnectionsLimit,
} from "./mylib/socket.js";
import { TokenBucket } from "./mylib/token-bucket.js";

validateEnv();

const bannedCheckMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const ip = detectClientIpFromHeaders(req.headers, req.socket.remoteAddress);
	logger.http(`👁️ ${ip}`);
	if (isBannedIP(ip)) {
		logger.http(`❌ ${ip}`);
		res.status(403).json({ error: "Forbidden: banned IP" });
		return;
	}
	next();
};

// サービスを止めずに投稿規制するためのAPI
const authorizationSchema = v.pipe(v.string(), v.hash(["sha256"]));
const UNJ_ADMIN_API_KEY = process.env.UNJ_ADMIN_API_KEY ?? "";
// bot（unj-relay）用のキー。/thread/* しか叩けない。未設定なら admin キーだけで従来どおり
const UNJ_BOT_API_KEY = process.env.UNJ_BOT_API_KEY ?? "";
const botApiRegex = /^\/thread\/(make|owner|res)\/?$/i;
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
	const isAdmin =
		UNJ_ADMIN_API_KEY !== "" && safeEqual(result.output, UNJ_ADMIN_API_KEY);
	const isBot =
		UNJ_BOT_API_KEY !== "" && safeEqual(result.output, UNJ_BOT_API_KEY);
	if (!isAdmin && !isBot) {
		res.status(401).json({ error: "Unauthorized: Invalid token" });
		return;
	}
	if (!isAdmin && !botApiRegex.test(req.path)) {
		res.status(403).json({ error: "Forbidden: bot key cannot use this API" });
		return;
	}
	next();
	logger.verbose(isAdmin ? req.path : `🤖 ${req.path}`);
};

const app = express();
app.set("trust proxy", false); // req.ip は使わない。IPは detectClientIpFromHeaders で求める（X-Forwarded-For の末尾だけ信用）
const server = http.createServer(app);

const allowedOrigins = [
	"https://onjmin.github.io",
	"https://unj-i1v.pages.dev",
	"https://unj.netlify.app",
];
try {
	allowedOrigins.unshift(new URL(process.env.VITE_BASE_URL ?? "").origin);
} catch {
	logger.warn("⚠️ VITE_BASE_URL が不正です");
}

const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket", "polling"],
	// 既定の1MBは大きすぎる。正規の最大（本文1024文字＋URL等）でも数KBなので余裕を見て64KB
	maxHttpBufferSize: 64 * 1024,
});

app.use(express.json());
app.get("/ping", bannedCheckMiddleware, (req, res) => {
	res.send("pong");
});
registerContactRoute(app, allowedOrigins);

const router = express.Router();
router.use(bannedCheckMiddleware, adminAuthMiddleware);
registerLogGrep(router);
registerLogLevel(router);
registerBlacklistID(router);
registerBlacklistIP(router);
registerBlacklistTor(router);
registerBlacklistVpngate(router);
registerDebugProxy(router);
registerDebugZombie(router, io);
registerEmergencyDenyAll(router);
registerThreadMake(router, io);
registerThreadOwner(router);
registerThreadRes(router, io);
registerUserNinja(router);
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
	app.get("/", (req, res) => {
		res.sendFile(path.resolve(ROOT_PATH, "src", "server", "index.html"));
	});
}

/**
 * 以下の verify 系は、弾いた（切断した）ら false を返す
 */
const checkDenyAll = (socket: Socket): boolean => {
	if (isDenyAll()) {
		auth.kick(socket, "denied");
		socket.disconnect();
		return false;
	}
	return true;
};

const verifyIP = (socket: Socket, ip: string): boolean => {
	if (isBannedIP(ip)) {
		logger.http(`❌ ${ip}`);
		reportBanned(socket, ip, "ip");
		flaky(() => auth.kick(socket, "banned"));
		socket.disconnect();
		return false;
	}
	return true;
};

const verifyUserId = (socket: Socket, userId: number): boolean => {
	if (blacklist.has(userId)) {
		logger.http(`❌ ${getIP(socket)} ${userId}`);
		reportBanned(socket, getIP(socket), "id", userId);
		flaky(() => auth.kick(socket, "banned"));
		socket.disconnect();
		return false;
	}
	return true;
};

/**
 * 受信イベントのレート制限（連打・flood対策）
 *
 * ページを開くと getNonceKey・join・read・rpgInit などで数件、
 * 書き込みやいいねも1回につき2件ほど、RPGはタップ1回で2件飛んでくるので、人間の操作では届かない値にしてある。
 * 接続し直しで満タンに戻らないよう、接続ごとではなくユーザー単位で持つ（複数タブで共有）。
 */
const eventBucket = new TokenBucket({
	capacity: 60,
	refillRate: 5, // 1秒に5件
	costPerAction: 1,
});
const floodWindow = 1000 * 10;
const floodLimit = 200; // 10秒でこれだけ捨てたら bot とみなして切断する

// socket.io
io.on("connection", async (socket) => {
	const ip = detectClientIpFromHeaders(
		socket.handshake.headers,
		socket.conn.remoteAddress,
	);
	logger.http(`👀 ${ip}`);
	if (!checkDenyAll(socket) || !verifyIP(socket, ip)) return;

	// 接続数の上限で弾く
	if (io.sockets.sockets.size >= totalSocketConnectionsLimit) {
		auth.kick(socket, "totalSocketConnectionsLimit");
		socket.disconnect();
		return;
	}

	// 複数タブを検出して弾く（IPv6は/64単位）
	const releaseIP = acquireSlot(online, ipKey(ip), socket.id, limitByIP);
	if (!releaseIP) {
		auth.kick(socket, "limitByIP");
		socket.disconnect();
		return;
	}
	socket.on("disconnect", releaseIP);

	// /48や/56を持っていて/64を乗り換えてくる分（IPv6だけ）
	const prefix = ipPrefixKey(ip);
	if (prefix !== ipKey(ip)) {
		const releasePrefix = acquireSlot(
			onlineByIPPrefix,
			prefix,
			socket.id,
			limitByIPPrefix,
		);
		if (!releasePrefix) {
			auth.kick(socket, "limitByIP");
			socket.disconnect();
			return;
		}
		socket.on("disconnect", releasePrefix);
	}

	setIP(socket, ip);

	let needsRegister = false;
	const token = auth.getTokenParam(socket);
	const claims = auth.parseClaims(socket);

	if (!claims) {
		// 【ケース1】トークンなし or 破損
		logger.verbose(token ? `🚫 Invalid` : `✨ New Guest`);
		needsRegister = true;
	} else {
		// 【ケース2】形式は正しい
		const userId = claims.userId;
		if (!verifyUserId(socket, userId)) return;

		if (isBefore(new Date(), claims.expiryDate)) {
			// A. 期限内ならそのままOK
			logger.verbose(`✅ ${userId}`);
			auth.grant(socket, userId, claims.expiryDate);
		} else {
			// B. 期限切れなら再試行
			logger.verbose(`⌛ ${userId}`);
			const success = await auth.relogin(socket, userId);
			if (socket.disconnected) return; // レート制限で弾いた or 待っている間に切断された
			if (!success) {
				logger.verbose(`♻️ ${userId} -> Reset`);
				needsRegister = true;
			}
		}
	}

	// 最後に、新規登録が必要になった場合だけ実行
	if (needsRegister) {
		await auth.register(socket);
	}
	if (socket.disconnected) return;

	// 同じユーザーの同時接続数で弾く（IPを使い捨てても枠を占有できないように）
	const userId = auth.getUserId(socket);
	if (isSerial(userId)) {
		const releaseUserId = acquireSlot(
			onlineByUserId,
			userId,
			socket.id,
			limitByUserId,
		);
		if (!releaseUserId) {
			auth.kick(socket, "limitByIP");
			socket.disconnect();
			return;
		}
		socket.on("disconnect", releaseUserId);
	}

	nonce.init(socket);

	let dropped = 0;
	let droppedSince = 0;
	let droppedLoggedAt = 0;
	socket.use(([event], next) => {
		if (socket.disconnected) return; // 切断後に同じフレームで届いた残り
		if (!checkDenyAll(socket)) return;
		if (!verifyIP(socket, getIP(socket))) return;
		const userId = auth.getUserId(socket);
		if (!verifyUserId(socket, userId)) return;
		const key = isSerial(userId) ? userId : ipKey(getIP(socket));
		if (!eventBucket.attempt(key)) {
			// 捨てるだけ（next を呼ばない）。1回あふれただけでは切断しない
			const now = Date.now();
			if (now - droppedSince > floodWindow) {
				droppedSince = now;
				dropped = 0;
			}
			dropped++;
			if (now - droppedLoggedAt > 1000 * 10) {
				droppedLoggedAt = now;
				const name = JSON.stringify(String(event).slice(0, 32));
				logger.verbose(`🚿 ${getIP(socket)} ${name}`);
			}
			if (dropped >= floodLimit) {
				logger.http(`🌊 ${getIP(socket)}`);
				socket.disconnect(true); // 下の接続ごと閉じる（同じ接続で入り直せないように）
			}
			return;
		}
		if (auth.isAuthExpired(socket)) {
			auth.issueAuthToken(socket);
		}
		next();
	});

	handleGetNonceKey({ socket });
	handleJoinHeadline({ socket, io });
	handleJoinThread({ socket, io });
	handleHeadline({ socket, io });
	handleLike({ socket, io });
	handleLol({ socket, io });
	handleMakeThread({ socket, io });
	handleReadThread({ socket });
	handleRes({ socket, io });
	handleRpgInit({ socket });
	handleRpgPatch({ socket, io });
	handleSearch({ socket });
	handleContact({ socket });

	incrementAccessCount();
});

const PORT = process.env.PORT || process.env.VITE_LOCALHOST_PORT;
server.listen(PORT, () => {
	const msg = `🟢 listening on ${PORT}...`;
	console.log(msg);
	logger.info(msg);
});

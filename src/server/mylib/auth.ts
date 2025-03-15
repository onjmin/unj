// pool
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { NEON_DATABASE_URL } from "../mylib/env.js";
neonConfig.webSocketConstructor = ws;

import { addDays, addSeconds, differenceInDays, isAfter } from "date-fns";
import type { Socket } from "socket.io";
import * as v from "valibot";
import { AuthSchema, isSerial } from "../../common/request/schema.js";
import {
	decodeLimit,
	decodeUserId,
	encodeLimit,
	encodeUserId,
	signAuth,
} from "./anti-debug.js";
import { logger } from "./log.js";
import { randInt } from "./util.js";

/**
 * JWT風トークン
 * (署名).(ユーザーID).(有効期限)
 */

const bigDay = new Date(2025, 2, 14);
const finalDate = 114514;

const getTokenParam = (socket: Socket) => {
	const token = socket.handshake.auth.token;
	if (!token || typeof token !== "string") {
		return null;
	}
	return token;
};

export const verify = (socket: Socket): boolean => {
	const token = getTokenParam(socket);
	if (!token) {
		return false;
	}
	const claims = token.split(".");
	if (claims.length !== 3) {
		return false;
	}
	const [sign, userId, limit] = claims;
	const auth = v.safeParse(AuthSchema, { sign, userId, limit });
	if (!auth.success) {
		return false;
	}
	if (signAuth(auth.output.userId, auth.output.limit) !== auth.output.sign) {
		return false;
	}
	const rawLimit = decodeLimit(auth.output.limit, auth.output.userId);
	if (
		!rawLimit ||
		rawLimit > finalDate ||
		isAfter(new Date(), addDays(bigDay, rawLimit))
	) {
		return false;
	}
	const rawUserId = decodeUserId(userId, bigDay);
	if (!rawUserId) {
		return false;
	}
	setAuth(socket, token);
	setUserId(socket, rawUserId);
	return true;
};

const delay = 1000 * 60 * 4; // Glitchは5分放置でスリープする
const neet: Map<number, NodeJS.Timeout> = new Map();
const lazyUpdate = (userId: number, auth: string) => {
	clearTimeout(neet.get(userId));
	const id = setTimeout(async () => {
		// pool
		const pool = new Pool({ connectionString: NEON_DATABASE_URL });
		pool.on("error", (error) => {
			logger.error(error);
		});
		const poolClient = await pool.connect();
		await poolClient.query(
			"UPDATE users SET updated_at = NOW(), auth = $1 WHERE id = $2",
			[auth, userId],
		);
	}, delay);
	neet.set(userId, id);
};

export const updateAuthToken = (socket: Socket) => {
	const rawUserId = getUserId(socket);
	const userId = encodeUserId(rawUserId, bigDay);
	if (!userId) {
		return;
	}
	const limit = encodeLimit(differenceInDays(new Date(), bigDay) + 3, userId); // JWT風認証は3日で失効
	if (!limit) {
		return;
	}
	const sign = signAuth(userId, limit);
	const token = [sign, userId, limit].join(".");
	setAuth(socket, token);
	socket.emit("updateAuthToken", {
		ok: true,
		token,
	});
	lazyUpdate(rawUserId, token);
};

const initFIFO = [new Date()];
const rateLimitCount = 11.4514;
const rateLimitSec = 45.45;

/**
 * userの探索と新規発行
 */
export const init = async (socket: Socket, ip: string): Promise<boolean> => {
	// 実質誰でも叩けるので制限を設ける
	if (initFIFO.length > rateLimitCount) {
		if (isAfter(new Date(), addSeconds(initFIFO[0], rateLimitSec))) {
			initFIFO.shift();
			initFIFO.push(new Date());
		} else {
			return false;
		}
	} else {
		initFIFO.push(new Date());
	}
	const token = getTokenParam(socket);
	try {
		// pool
		const pool = new Pool({ connectionString: NEON_DATABASE_URL });
		pool.on("error", (error) => {
			throw error;
		});
		const poolClient = await pool.connect();
		// 既存ユーザー照合
		if (token) {
			const { rows, rowCount } = await poolClient.query(
				"SELECT id FROM users WHERE auth = $1",
				[token],
			);
			if (rowCount) {
				setUserId(socket, rows[0].id);
				updateAuthToken(socket);
				return true;
			}
		}
		// 新規ユーザー発行
		const { rows, rowCount } = await poolClient.query(
			"INSERT INTO users (ip, ninja_pokemon) VALUES ($1, $2) RETURNING id",
			[ip, randInt(1, 151)],
		);
		if (rowCount) {
			setUserId(socket, rows[0].id);
			updateAuthToken(socket);
			return true;
		}
	} catch (error) {
		logger.error(error);
	}
	return false;
};

export const getAuth = (socket: Socket): string => socket.data.auth;
const setAuth = (socket: Socket, auth: string) => {
	if (auth.length !== 50) {
		return;
	}
	socket.data.auth = auth;
};
export const getUserId = (socket: Socket): number => socket.data.userId;
const setUserId = (socket: Socket, userId: number) => {
	if (!isSerial(userId)) {
		return;
	}
	socket.data.userId = userId;
};

export default {
	verify,
	init,
	getAuth,
	getUserId,
};

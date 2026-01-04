import { addDays, differenceInDays, isAfter, isBefore } from "date-fns";
import type { Socket } from "socket.io";
import * as v from "valibot";
import {
	AuthSchema,
	isSerial,
	unjBeginDate,
	unjEndDate,
} from "../../common/request/schema.js";
import { randInt } from "../../common/util.js";
import { pool } from "../mylib/pool.js";
import {
	decodeLimit,
	decodeUserId,
	encodeLimit,
	encodeUserId,
	signAuth,
} from "./anti-debug.js";
import {
	ninja,
	ninjaPokemonCache,
	ninjaScoreCache,
	userCached,
	userIPCache,
} from "./cache.js";
import { getIP } from "./ip.js";
import { logger } from "./log.js";
import { TokenBucket } from "./token-bucket.js";

/**
 * JWT風トークン
 * (署名).(ユーザーID).(有効期限)
 */

const getTokenParam = (socket: Socket) => {
	const token = socket.handshake.auth.token;
	if (!token || typeof token !== "string") {
		return null;
	}
	return token;
};

type Claims = {
	signature: string;
	userId: number;
	expiryDate: Date;
};

const parseClaims = (socket: Socket): Claims | null => {
	const token = getTokenParam(socket);
	if (!token) {
		return null;
	}
	const claims = token.split(".");
	if (claims.length !== 3) {
		return null;
	}
	const [sign, userId, limit] = claims;
	const auth = v.safeParse(AuthSchema, { sign, userId, limit });
	if (!auth.success) {
		return null;
	}
	if (signAuth(auth.output.userId, auth.output.limit) !== auth.output.sign) {
		return null;
	}
	const rawUserId = decodeUserId(auth.output.userId, unjBeginDate);
	const rawLimit = decodeLimit(auth.output.limit, auth.output.userId);
	if (!rawUserId || !rawLimit) {
		return null;
	}
	return {
		signature: auth.output.sign,
		userId: rawUserId,
		expiryDate: addDays(unjBeginDate, rawLimit),
	};
};

const delay = 1000 * 60 * 4; // Glitchは5分放置でスリープする
const neet: Map<number, NodeJS.Timeout> = new Map();
const lazyUpdate = (userId: number, auth: string, ip: string) => {
	clearTimeout(neet.get(userId));
	const id = setTimeout(async () => {
		try {
			await pool.query(
				"UPDATE users SET updated_at = NOW(), ip = $1, auth = $2 WHERE id = $3",
				[ip, auth, userId],
			);
		} catch {}
	}, delay);
	neet.set(userId, id);
};

const updateAuthToken = (socket: Socket) => {
	const rawUserId = getUserId(socket);
	const userId = encodeUserId(rawUserId, unjBeginDate);
	if (!userId) return;
	const rawLimit = differenceInDays(new Date(), unjBeginDate) + 4;
	const limit = encodeLimit(rawLimit, userId); // JWT風認証は4日で失効
	if (!limit) return;
	const expiryDate = addDays(unjBeginDate, rawLimit);
	const sign = signAuth(userId, limit);
	const token = [sign, userId, limit].join(".");
	grant(socket, rawUserId, expiryDate);
	socket.emit("updateAuthToken", {
		ok: true,
		token,
		timestamp: new Date(),
	});
	lazyUpdate(rawUserId, token, getIP(socket));
};

const tokenBucket = new TokenBucket({
	capacity: 3,
	refillRate: 1 / 60, // 60秒で1回復
	costPerAction: 1,
});

/**
 * userの探索と新規発行
 */
const init = async (socket: Socket): Promise<boolean> => {
	// 実質誰でも叩けるので制限を設ける
	if (!tokenBucket.attempt()) {
		logger.verbose(`⌛ ${tokenBucket.getCooldownSeconds().toFixed(1)}`);
		kick(socket, "newUsersRateLimit");
		socket.disconnect();
		return false;
	}

	// 危険な処理
	try {
		// 既存ユーザー照合
		const token = getTokenParam(socket);
		if (token) {
			const { rows, rowCount } = await pool.query(
				"SELECT id, ninja_pokemon, ninja_score FROM users WHERE auth = $1",
				[token],
			);
			if (rowCount) {
				const record = rows[0];
				const userId = record.id;
				setUserId(socket, userId);
				updateAuthToken(socket);
				userCached.set(userId, true);
				userIPCache.set(userId, getIP(socket));
				ninjaPokemonCache.set(userId, record.ninja_pokemon);
				ninjaScoreCache.set(userId, record.ninja_score);
				ninja(socket);
				return true;
			}
		}
		// 新規ユーザー発行
		const ninjaPokemon = randInt(1, 151);
		const { rows, rowCount } = await pool.query(
			"INSERT INTO users (ip, ninja_pokemon) VALUES ($1, $2) RETURNING id",
			[getIP(socket), ninjaPokemon],
		);
		if (rowCount) {
			const record = rows[0];
			const userId = record.id;
			setUserId(socket, userId);
			updateAuthToken(socket);
			userCached.set(userId, true);
			userIPCache.set(userId, getIP(socket));
			ninjaPokemonCache.set(userId, ninjaPokemon);
			ninjaScoreCache.set(userId, 0);
			ninja(socket);
			return true;
		}
	} catch (error) {
		logger.error(error);
	}
	return false;
};

/**
 * 承認
 */
export const grant = (socket: Socket, userId: number, expiryDate: Date) => {
	if (setExpiryDate(socket, expiryDate) && setUserId(socket, userId)) {
		return true;
	}
	kick(socket, "grantFailed");
	socket.disconnect();
	logger.warn("⚠️ grantFailed");
	return false;
};

const getUserId = (socket: Socket): number => socket.data.userId;
const setUserId = (socket: Socket, userId: number): boolean => {
	if (!isSerial(userId)) {
		return false;
	}
	socket.data.userId = userId;
	return true;
};
const getExpiryDate = (socket: Socket): Date => socket.data.expiryDate;
const setExpiryDate = (socket: Socket, date: Date): boolean => {
	if (isBefore(date, unjBeginDate) || isAfter(date, unjEndDate)) {
		return false;
	}
	socket.data.expiryDate = date;
	return true;
};

const isAuthExpired = (socket: Socket): boolean =>
	isAfter(new Date(), getExpiryDate(socket));

const kick = (socket: Socket, reason: string) =>
	socket.emit("kicked", {
		ok: true,
		reason,
	});

export default {
	parseClaims,
	updateAuthToken,
	init,
	grant,
	getUserId,
	isAuthExpired,
	kick,
};

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
const lazyUpdate = (userId: number, ip: string, token: string) => {
	clearTimeout(neet.get(userId));
	const id = setTimeout(async () => {
		try {
			await pool.query(
				"WITH ins AS (" +
					"INSERT INTO auth_tokens (user_id, token, ip) VALUES ($1, $2, $3)" +
					") " +
					"UPDATE users SET updated_at = NOW(), ip = $3 WHERE id = $1",
				[userId, token, ip],
			);
		} catch (error) {
			logger.verbose("auth");
			logger.error(error);
		}
	}, delay);
	neet.set(userId, id);
};

const issueAuthToken = (socket: Socket) => {
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
	socket.emit("issueAuthToken", {
		ok: true,
		token,
		timestamp: new Date(),
	});
	lazyUpdate(rawUserId, getIP(socket), token);
};

const tokenBucket = new TokenBucket({
	capacity: 16, // 8人が「relogin失敗→register」の2枚消費ルートを通っても耐えられる
	refillRate: 1 / 60, // 回復は1分に1枚。Neonの長期的な接続負荷はしっかり抑える
	costPerAction: 1,
});

/**
 * 期限切れ再ログイン
 */
const relogin = async (socket: Socket, userId: number): Promise<boolean> => {
	// レート制限
	if (!tokenBucket.attempt()) {
		logger.verbose(`⌛ ${tokenBucket.getCooldownSeconds().toFixed(1)}`);
		kick(socket, "newUsersRateLimit");
		socket.disconnect();
		return false;
	}

	try {
		const token = getTokenParam(socket);
		if (token) {
			const { rows } = await pool.query(
				"SELECT u.id, u.ninja_pokemon, u.ninja_score " +
					"FROM users u " +
					"WHERE u.id = $1 AND EXISTS (" +
					"SELECT 1 FROM auth_tokens t WHERE t.user_id = $1 AND t.token = $2 ORDER BY t.id DESC LIMIT 4" +
					")",
				[userId, token],
			);

			if (rows.length) {
				const record = rows[0];
				const userId = record.id;

				setUserId(socket, userId);
				issueAuthToken(socket);

				userCached.set(userId, true);
				userIPCache.set(userId, getIP(socket));
				ninjaPokemonCache.set(userId, record.ninja_pokemon);
				ninjaScoreCache.set(userId, record.ninja_score);

				ninja(socket);
				return true;
			}
		}
	} catch (error) {
		logger.error(error);
	}

	return false;
};

/**
 * 新規発行
 */
const register = async (socket: Socket): Promise<boolean> => {
	// レート制限
	if (!tokenBucket.attempt()) {
		logger.verbose(`⌛ ${tokenBucket.getCooldownSeconds().toFixed(1)}`);
		kick(socket, "newUsersRateLimit");
		socket.disconnect();
		return false;
	}

	try {
		const ninjaPokemon = randInt(1, 151);

		const { rows } = await pool.query(
			"INSERT INTO users (ip, ninja_pokemon) VALUES ($1, $2) RETURNING id",
			[getIP(socket), ninjaPokemon],
		);

		if (rows.length) {
			const userId = rows[0].id;

			setUserId(socket, userId);
			issueAuthToken(socket);

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
	getTokenParam,
	parseClaims,
	issueAuthToken,
	relogin,
	register,
	grant,
	getUserId,
	isAuthExpired,
	kick,
};

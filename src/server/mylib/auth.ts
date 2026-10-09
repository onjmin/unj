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
	safeEqual,
	signAuth,
} from "./anti-debug.js";
import {
	ninja,
	ninjaPokemonCache,
	ninjaScoreCache,
	userCached,
	userIPCache,
} from "./cache.js";
import { getIP, ipKey, ipPrefixKey } from "./ip.js";
import { logger } from "./log.js";
import { TokenBucket } from "./token-bucket.js";
import { TtlMap } from "./ttl-map.js";

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
	const expected = signAuth(auth.output.userId, auth.output.limit);
	if (!safeEqual(expected, auth.output.sign)) {
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
		neet.delete(userId); // 発火済みのタイマーを残さない（Mapが増え続けないように）
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

/**
 * 新規登録・再ログイン（DBに触る処理）のレート制限
 *
 * 1台で全体の枠を食い潰して全員を締め出せないように、
 * IP単位（IPv6は/64）→ 拠点単位（IPv6の/48）→ 全体 の順に枠を見る。
 * 全体の枠は新規登録だけが使う（登録の連打で、期限切れの既存ユーザーまで締め出されないように）。
 */
const tokenBucketByIP = new TokenBucket({
	capacity: 8, // 「relogin失敗→register」の2枚消費や、タブ復帰の再接続を数回ぶん
	refillRate: 1 / 60, // 回復は1分に1枚（全体の回復の半分なので1つのIPでは使い切れない）
	costPerAction: 1,
});
const tokenBucketByIPPrefix = new TokenBucket({
	capacity: 16, // /48の中で/64を乗り換えても全体の枠（32枚）の半分まで
	refillRate: 1 / 60,
	costPerAction: 1,
});
const tokenBucket = new TokenBucket({
	capacity: 32, // 1つの拠点の枠（16枚）よりずっと多く、16人が2枚消費ルートを通っても耐えられる
	refillRate: 1 / 30, // 回復は30秒に1枚。Neonの長期的な接続負荷はしっかり抑える
	costPerAction: 1,
});

const rateLimit = (socket: Socket, useGlobal: boolean): boolean => {
	const ip = getIP(socket);
	const key = ipKey(ip);
	const prefix = ipPrefixKey(ip);
	if (!tokenBucketByIP.attempt(key)) {
		logger.verbose(
			`⌛ IP ${tokenBucketByIP.getCooldownSeconds(key).toFixed(1)}`,
		);
	} else if (prefix !== key && !tokenBucketByIPPrefix.attempt(prefix)) {
		logger.verbose(
			`⌛ /48 ${tokenBucketByIPPrefix.getCooldownSeconds(prefix).toFixed(1)}`,
		);
	} else if (useGlobal && !tokenBucket.attempt()) {
		logger.verbose(`⌛ ${tokenBucket.getCooldownSeconds().toFixed(1)}`);
	} else {
		return true;
	}
	kick(socket, "newUsersRateLimit");
	socket.disconnect();
	return false;
};

/**
 * relogin に成功した期限切れトークン → userId
 *
 * クライアントは接続時のトークンを再接続のたびに送り直すので、同じ期限切れトークンで何度も relogin が来る。
 * DB照会とレート制限を省き、新しいトークンが積まれて「直近4件」から外れ別人扱いになるのも防ぐ。
 * relogin に失敗して register した場合は新しい userId を覚える（再接続のたびに新規ユーザーが増えないように）。
 * 有効期限は覚えた時点から4日で、使っても延長しない（漏れた古いトークンが使い続けられないように）。
 */
const reloginCache = new TtlMap<string, number>({
	max: 10000,
	ttl: 1000 * 60 * 60 * 24 * 4,
});

// 直近4件のトークンだけ受け付ける（古いトークンが漏れても使えないように）
// kind はunj-rezeのセッションを数えないため。列が無いDBでは kind なしで照会し直す
const reloginQuery =
	"SELECT u.id, u.ninja_pokemon, u.ninja_score " +
	"FROM users u " +
	"WHERE u.id = $1 AND $2 IN (" +
	"SELECT t.token FROM auth_tokens t WHERE t.user_id = $1 AND t.kind = 'unj' ORDER BY t.id DESC LIMIT 4" +
	")";
const reloginQueryWithoutKind =
	"SELECT u.id, u.ninja_pokemon, u.ninja_score " +
	"FROM users u " +
	"WHERE u.id = $1 AND $2 IN (" +
	"SELECT t.token FROM auth_tokens t WHERE t.user_id = $1 ORDER BY t.id DESC LIMIT 4" +
	")";
let hasKindColumn = true;
const queryRelogin = async (userId: number, token: string) => {
	if (hasKindColumn) {
		try {
			return await pool.query(reloginQuery, [userId, token]);
		} catch (error) {
			// 42703: undefined_column
			if ((error as { code?: string })?.code !== "42703") throw error;
			hasKindColumn = false;
			logger.warn("⚠️ auth_tokens.kind が無いので kind なしで照会します");
		}
	}
	return await pool.query(reloginQueryWithoutKind, [userId, token]);
};

/**
 * 期限切れ再ログイン
 */
const relogin = async (socket: Socket, userId: number): Promise<boolean> => {
	const token = getTokenParam(socket);
	if (!token) return false;

	// 確認済みのトークンならDBを見ない（レート制限も消費しない）
	const cached = reloginCache.get(token);
	if (cached !== undefined) {
		logger.verbose(`🔁 ${userId} -> ${cached}`);
		setUserId(socket, cached);
		issueAuthToken(socket);
		userIPCache.set(cached, getIP(socket));
		if (ninjaPokemonCache.has(cached)) ninja(socket);
		return true;
	}

	// レート制限
	if (!rateLimit(socket, false)) return false;

	try {
		const { rows } = await queryRelogin(userId, token);

		if (rows.length) {
			const record = rows[0];
			const userId = record.id;

			reloginCache.set(token, userId);
			setUserId(socket, userId);
			issueAuthToken(socket);

			userCached.set(userId, true);
			userIPCache.set(userId, getIP(socket));
			ninjaPokemonCache.set(userId, record.ninja_pokemon);
			ninjaScoreCache.set(userId, record.ninja_score);

			ninja(socket);
			return true;
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
	if (!rateLimit(socket, true)) return false;

	try {
		const ninjaPokemon = randInt(1, 151);

		const { rows } = await pool.query(
			"INSERT INTO users (ip, ninja_pokemon) VALUES ($1, $2) RETURNING id",
			[getIP(socket), ninjaPokemon],
		);

		if (rows.length) {
			const userId = rows[0].id;

			// 署名の正しい期限切れトークンで relogin に失敗した場合（改ざん・破損トークンは覚えない）
			const token = getTokenParam(socket);
			if (token && parseClaims(socket)) reloginCache.set(token, userId);

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

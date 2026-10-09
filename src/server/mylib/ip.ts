import type { IncomingHttpHeaders } from "node:http";
import net from "node:net";
import type { Socket } from "socket.io";
import { blacklist } from "../admin/blacklist/ip.js";
import { torIPList } from "../admin/blacklist/tor.js";
import { vpngateIPList } from "../admin/blacklist/vpngate.js";
import { DEV_MODE, STG_MODE } from "./env.js";
import { logger } from "./log.js";

export const genTestIP = () => "0.0.0.0"; // Bogon

/**
 * IPv4射影アドレス（::ffff:a.b.c.d）をIPv4に揃える
 */
export const normalizeIP = (ip: string): string => {
	const s = ip.trim();
	const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(s);
	return mapped && net.isIPv4(mapped[1]) ? mapped[1] : s;
};

const toValidIP = (raw: string | undefined): string | null => {
	if (!raw) return null;
	const ip = normalizeIP(raw);
	return net.isIP(ip) ? ip : null;
};

/**
 * 内部ネットワーク・ループバック等（クライアントの公開IPにはなりえない）
 */
const isInternalIP = (ip: string): boolean => {
	if (net.isIPv4(ip)) {
		const [a, b] = ip.split(".").map(Number);
		return (
			a === 10 ||
			a === 127 ||
			a === 0 ||
			(a === 100 && b >= 64 && b <= 127) || // CGNAT（共有アドレス）
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168)
		);
	}
	const s = ip.toLowerCase();
	return s === "::1" || s === "::" || /^f[cd]/.test(s) || /^fe[89ab]/.test(s);
};

let lastWarnedAt = 0;

/**
 * クライアントIPの特定（HTTP・socket共通）
 *
 * - Koyebは X-Forwarded-For の末尾に「Koyebへ接続してきたIP」を追記する。信用できるのはこの末尾だけ
 *   （先頭側はクライアントが自由に書けるので見ない。express の trust proxy も使わない）
 * - Fastly-Client-IP はKoyebでは付かず、クライアントが送った値が素通りしうるので見ない
 * - IPとして不正な値・ヘッダが無いときは直接の接続元
 */
export const detectClientIp = (
	xForwardedFor: string | string[] | undefined,
	remoteAddress: string | undefined,
): string => {
	if (DEV_MODE || STG_MODE) {
		return genTestIP();
	}
	const header = Array.isArray(xForwardedFor)
		? xForwardedFor.join(",")
		: xForwardedFor;
	// 末尾から見て、内部ホップ（Koyeb内部のLB等）が追記したIPは飛ばす。
	// クライアントが書ける部分はKoyebが追記した公開IPより左にしかないので、偽装はできない
	const entries = (header ?? "").split(",").map(toValidIP);
	let fromHeader: string | null = null;
	for (let i = entries.length - 1; i >= 0; i--) {
		const ip = entries[i];
		if (!ip) break;
		fromHeader = ip;
		if (!isInternalIP(ip)) break;
	}
	if (fromHeader) return fromHeader;
	if (Date.now() - lastWarnedAt > 1000 * 60 * 10) {
		lastWarnedAt = Date.now();
		logger.warn("⚠️ X-Forwarded-For が無いので接続元IPを使います");
	}
	return toValidIP(remoteAddress) ?? "";
};

/**
 * detectClientIp のヘッダ取り出し込み版（読むヘッダを取り違えないように）
 */
export const detectClientIpFromHeaders = (
	headers: IncomingHttpHeaders,
	remoteAddress: string | undefined,
): string => detectClientIp(headers["x-forwarded-for"], remoteAddress);

/**
 * IPv6を8グループの配列に展開する（不正な値なら null）
 */
const expandIPv6 = (ip: string): string[] | null => {
	let s = ip.split("%")[0]; // ゾーンID
	const v4 = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
	if (v4) {
		const [a, b, c, d] = v4.slice(1).map(Number);
		s = `${s.slice(0, v4.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
	}
	const halves = s.split("::");
	if (halves.length > 2) return null;
	const head = halves[0] ? halves[0].split(":") : [];
	const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
	const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
	if (fill < 0) return null;
	const groups = [...head, ...Array(fill).fill("0"), ...tail];
	if (groups.length !== 8) return null;
	return groups.map((g) => Number.parseInt(g, 16).toString(16));
};

/**
 * 接続数・レート制限で数える単位
 *
 * IPv4はそのまま、IPv6は/64（1回線に配られる単位）にまとめる。
 * IPv6は/64の中でいくらでもアドレスを変えられるため。
 */
export const ipKey = (ip: string): string => {
	if (!net.isIPv6(ip)) return ip;
	const groups = expandIPv6(ip);
	return groups ? `${groups.slice(0, 4).join(":")}::/64` : ip;
};

/**
 * ipKey より粗い2段目の単位
 *
 * IPv4はそのまま、IPv6は/48（1拠点に配られる最大の単位）にまとめる。
 * /48や/56を持っていれば/64をいくらでも乗り換えられるため。
 */
export const ipPrefixKey = (ip: string): string => {
	if (!net.isIPv6(ip)) return ip;
	const groups = expandIPv6(ip);
	return groups ? `${groups.slice(0, 3).join(":")}::/48` : ip;
};

export const isBannedIP = (ip: string): boolean => {
	if (!ip || torIPList.has(ip) || vpngateIPList.has(ip) || blacklist.has(ip))
		return true;
	const ipv4 = ip.split(".");
	const ipv6 = ip.split(":");
	if (ipv4.length > 1) {
		for (let i = 1; i < ipv4.length; i++) {
			const wildcardIp = `${ipv4.slice(0, ipv4.length - i).join(".")}${".*".repeat(i)}`;
			if (blacklist.has(wildcardIp)) return true;
		}
	} else if (ipv6.length > 1) {
		for (let i = 1; i < ipv6.length; i++) {
			const wildcardIp = `${ipv6.slice(0, ipv6.length - i).join(":")}${":*".repeat(i)}`;
			if (blacklist.has(wildcardIp)) return true;
		}
	}
	return false;
};

/**
 * プロパイダを照合せずに済む軽い処理
 */
export const sliceIPRange = (ip: string): string => {
	if (ip.includes(".")) return ip.split(".").slice(0, 2).join("."); // IPv4 の場合、上位 16ビット（255.255.0.0 相当）を取得
	if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":"); // IPv6 の場合、上位 32ビット（通常のプロバイダ識別単位）を取得
	return ip; // エントロピーを捨てないように、異常な入力値ならそのまま返す
};

export const getIP = (socket: Socket): string => socket.data.ip;
export const setIP = (socket: Socket, ip: string) => {
	socket.data.ip = ip;
};

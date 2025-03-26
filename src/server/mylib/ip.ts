import type { Socket } from "socket.io";
import { blacklist } from "../admin/blacklist/ip.js";
import { torIPList } from "../admin/blacklist/tor.js";
import { vpngateIPList } from "../admin/blacklist/vpngate.js";
import { DEV_MODE, STG_MODE } from "./env.js";

const genTestIP = () => "0.0.0.0"; // Bogon

export const detectFastlyClientIp = (
	fastlyClientIp: string | string[] | undefined,
) => {
	if (DEV_MODE || STG_MODE) {
		return genTestIP();
	}
	return Array.isArray(fastlyClientIp) ? fastlyClientIp[0] : fastlyClientIp;
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

export const getIP = (socket: Socket): string => socket.data.ip;
export const setIP = (socket: Socket, ip: string) => {
	socket.data.ip = ip;
};

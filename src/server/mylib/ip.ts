import type { Socket } from "socket.io";
import { blacklist } from "../admin/blacklist/ip.js";
import { torIPList } from "../admin/blacklist/tor.js";
import { vpngateIPList } from "../admin/blacklist/vpngate.js";
import { DEV_MODE, STG_MODE } from "./env.js";

const genTestIP = () => "0.0.0.0";

export const detectFastlyClientIp = (
	fastlyClientIp: string | string[] | undefined,
) => {
	if (DEV_MODE || STG_MODE) {
		return genTestIP();
	}
	return Array.isArray(fastlyClientIp) ? fastlyClientIp[0] : fastlyClientIp;
};

export const isBannedIP = (ip: string) =>
	!ip || torIPList.has(ip) || vpngateIPList.has(ip) || blacklist.has(ip);

export const getIP = (socket: Socket): string => socket.data.ip;
export const setIP = (socket: Socket, ip: string) => {
	socket.data.ip = ip;
};

import { blacklist } from "../admin/blacklist.js";
import { torIPList } from "../admin/tor.js";
import { vpngateIPList } from "../admin/vpngate.js";
import { DEV_MODE, STG_MODE } from "./env.js";

const genTestIP = () => "0.0.0.0";

export const detectFastlyClientIp = (
	fastlyClientIp: string | string[] | undefined,
) => {
	if (DEV_MODE || STG_MODE) {
		return genTestIP();
	}
	return Array.isArray(fastlyClientIp)
		? fastlyClientIp[0] // TODO: 人為的にfastly-client-ipヘッダを付加されたケース
		: fastlyClientIp;
};

export const isBannedIP = (ip: string) =>
	!ip || torIPList.has(ip) || vpngateIPList.has(ip) || blacklist.has(ip);

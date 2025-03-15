import { navigate } from "svelte-routing";
import { base, pathname } from "./env.js";
import { load, save } from "./idb/keyval.js";

const whitelist = [
	"/new",
	"/headline",
	"/history",
	"/bookmark",
	"/config",
	"/terms",
	"/contact",
	"/update",
	"/art",
	"/links",
	"/thread",
];

const loadPathname = async (): Promise<string> => {
	const pathname = await load("destinationPathname");
	if (pathname && whitelist.some((v) => pathname.startsWith(v))) {
		save("destinationPathname", null);
		return base(pathname);
	}
	return base("/headline");
};

export const savePathname = (pathname: string) => {
	save("destinationPathname", pathname);
};

export const tryEnter = async () => {
	if ("yes" === (await load("termsAgreement"))) {
		const pathname = await loadPathname();
		navigate(pathname);
		return true;
	}
	return false;
};

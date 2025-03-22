import { navigate } from "svelte-routing";
import { makePathname, pathname } from "./env.js";
import { destinationPathname, termsAgreement } from "./idb/preload.js";

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

const loadPathname = () => {
	const pathname = destinationPathname.value;
	if (pathname && whitelist.some((v) => pathname.startsWith(v))) {
		destinationPathname.value = null;
		return makePathname(pathname);
	}
	return makePathname("/headline");
};

export const tryEnter = () => {
	if ("yes" === termsAgreement.value) {
		navigate(loadPathname());
		return true;
	}
	return false;
};

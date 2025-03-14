import { navigate } from "svelte-routing";
import { base } from "./env.js";
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

export const tryEnter = async () => {
	if ("yes" === (await load("termsAgreement"))) {
		const pathname = await load("destinationPathname");
		if (pathname && whitelist.some((v) => pathname.startsWith(v))) {
			navigate(base(pathname));
			save("destinationPathname", null);
		} else {
			navigate(base("/headline"));
		}
		return true;
	}
	return false;
};

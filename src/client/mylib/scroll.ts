import { navigate } from "svelte-routing";
import { makePathname } from "./env.js";

export const scrollToEnd = () => {
	const main = document.querySelector(".unj-main-part") ?? document.body;
	main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
};

export const makeUnjResNumId = (resNum: string) => `unj-res-num-${resNum}`;

export const scrollToAnka = (resNum: string): boolean => {
	const main = document.querySelector(".unj-main-part") ?? document.body;
	const ankaRes = document.getElementById(makeUnjResNumId(resNum));
	if (ankaRes) {
		main.scrollTo({ top: ankaRes.offsetTop, behavior: "smooth" });
		setTimeout(() => {
			ankaRes.classList.add(
				"bg-yellow-200",
				"transition-colors",
				"duration-500",
			);
			setTimeout(() => {
				ankaRes.classList.remove("bg-yellow-200");
			}, 500);
		}, 500);
		return true;
	}
	return false;
};

export const jumpToAnka = (resNum: string, threadId: string) => {
	if (!scrollToAnka(resNum)) {
		navigate(makePathname(`/thread/${threadId}/${resNum}`));
	}
};

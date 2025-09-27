import { navigate } from "svelte-routing";
import { makePathname } from "./env.js";

export const scrollToEnd = () => {
	const main = document.querySelector(".unj-main-part") ?? document.body;
	main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
};

export const makeUnjResNumId = (resNum: number) => `unj-res-num-${resNum}`;

export const scrollToAnka = (resNum: number): boolean => {
	const main = document.querySelector(".unj-main-part") ?? document.body;
	const ankaRes = document.getElementById(makeUnjResNumId(resNum));
	if (ankaRes) {
		// 画面の高さの半分から、要素の高さの半分を引くことで、画面の真ん中を算出
		const offset =
			ankaRes.offsetTop - main.clientHeight / 2 + ankaRes.clientHeight / 2;

		main.scrollTo({ top: offset, behavior: "smooth" });
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

export const jumpToAnka = (
	boardKey: string,
	resNum: number,
	threadId: string,
) => {
	if (!scrollToAnka(resNum)) {
		navigate(makePathname(`/${boardKey}/thread/${threadId}/${resNum}`));
	}
};

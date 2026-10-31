// スレ表示ページ（body.unj-scroll-layout）は body ごとスクロールするので、
// .unj-main-part ではなく body を動かす
const getScroller = (): HTMLElement =>
	document.body.classList.contains("unj-scroll-layout")
		? document.body
		: (document.querySelector<HTMLElement>(".unj-main-part") ?? document.body);

export const scrollToTop = () => {
	const main = getScroller();
	main.scrollTo({ top: 0, behavior: "smooth" });
};

export const scrollToEnd = () => {
	const main = getScroller();
	main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
};

export const makeUnjResNumId = (resNum: number) => `unj-res-num-${resNum}`;

export const scrollToResNum = (resNum: number): boolean => {
	const main = getScroller();
	const ankaRes = document.getElementById(makeUnjResNumId(resNum));
	if (ankaRes) {
		// 画面の高さの半分から、要素の高さの半分を引くことで、画面の真ん中を算出
		const top =
			ankaRes.getBoundingClientRect().top -
			main.getBoundingClientRect().top +
			main.scrollTop;
		const offset = top - main.clientHeight / 2 + ankaRes.clientHeight / 2;

		main.scrollTo({ top: offset, behavior: "smooth" });
		setTimeout(() => {
			ankaRes.classList.add(
				"bg-yellow-200/40",
				"transition-colors",
				"duration-500",
			);
			setTimeout(() => {
				ankaRes.classList.remove("bg-yellow-200/40");
			}, 500);
		}, 500);
		return true;
	}
	return false;
};

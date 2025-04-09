class TopIllust {
	label: string;
	src: string;
	href: string;
	constructor({
		label,
		src,
		href,
	}: { label: string; src: string; href: string }) {
		this.label = label;
		this.src = src;
		this.href = href;
	}
}

export const topIllusts = [
	new TopIllust({
		label: "ポケモンの街風ドット絵",
		src: "https://i.imgur.com/q4fuN3p.gif",
		href: "https://hayabusa.open2ch.net/test/read.cgi/livejupiter/1733543994/584",
	}),
	new TopIllust({
		label: "クリスマスパーティ",
		src: "https://magma.com/shared/X1VUEp3aQw5ntceEn_0Sgj",
		href: "https://hayabusa.open2ch.net/test/read.cgi/livejupiter/1733543994/617",
	}),
	new TopIllust({
		label: "ホワイトクリスマス雪景色",
		src: "https://magma.com/shared/1nWjAI4USme1xjoKl2-eLj",
		href: "https://hayabusa.open2ch.net/test/read.cgi/livejupiter/1734525424/153",
	}),
];

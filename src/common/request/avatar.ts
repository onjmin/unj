class Avatar {
	name;
	description;
	src;
	href;
	constructor({
		name,
		description,
		src, // 実際に使われる画像URL
		href, // アバター選択UIから飛べるリンク先
	}: {
		name: string;
		description: string;
		src: string | null;
		href: string | null;
	}) {
		this.name = name;
		this.description = description;
		this.src = src;
		this.href = href;
	}
}

export const avatarMap: Map<number, Avatar> = new Map();

avatarMap.set(
	0,
	new Avatar({
		name: "アイコンなし",
		description: "デフォルト",
		src: null,
		href: null,
	}),
);

avatarMap.set(
	1,
	new Avatar({
		name: "阿部寛",
		description: "阿部寛のホームページ",
		src: "https://i.imgur.com/g0yKai6.jpg",
		href: "https://ja.wikipedia.org/wiki/%E9%98%BF%E9%83%A8%E5%AF%9B%E3%81%AE%E3%83%9B%E3%83%BC%E3%83%A0%E3%83%9A%E3%83%BC%E3%82%B8",
	}),
);

avatarMap.set(
	2,
	new Avatar({
		name: "束音ロゼ",
		description: "アル？ナイ！アル？ナイ！×2",
		src: "https://avatars.githubusercontent.com/u/88383494",
		href: "https://w.atwiki.jp/openj3/pages/641.html",
	}),
);

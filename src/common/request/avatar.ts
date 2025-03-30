export const avatarMap: Map<number, Avatar> = new Map();
class Avatar {
	name;
	description;
	src;
	href;
	constructor({
		id,
		name,
		description,
		src, // 実際に使われる画像URL
		href, // アバター選択UIから飛べるリンク先
	}: {
		id: number;
		name: string;
		description: string;
		src: string | null;
		href: string | null;
	}) {
		this.name = name;
		this.description = description;
		this.src = src;
		this.href = href;
		avatarMap.set(id, this);
	}
}
new Avatar({
	id: 0,
	name: "アイコンなし",
	description: "デフォルト",
	src: null,
	href: null,
});
new Avatar({
	id: 1,
	name: "阿部寛",
	description: "阿部寛のホームページ",
	src: "https://i.imgur.com/g0yKai6.jpg",
	href: "https://ja.wikipedia.org/wiki/%E9%98%BF%E9%83%A8%E5%AF%9B%E3%81%AE%E3%83%9B%E3%83%BC%E3%83%A0%E3%83%9A%E3%83%BC%E3%82%B8",
});
new Avatar({
	id: 2,
	name: "束音ロゼ",
	description: "アル？ナイ！アル？ナイ！×2",
	src: "https://avatars.githubusercontent.com/u/88383494",
	href: "https://w.atwiki.jp/openj3/pages/641.html",
});
new Avatar({
	id: 3,
	name: "フェリス",
	description: "くしゃみ出そう…ふぇ…ふぇ……ﾌｪﾆｯｸｽ！",
	src: "https://i.imgur.com/rqcCXvE.png",
	href: "https://w.atwiki.jp/openj3/pages/36.html",
});
new Avatar({
	id: 4,
	name: "やきう民",
	description: "やきうのお兄ちゃん",
	src: "https://i.imgur.com/DerrjHB.png",
	href: "https://w.atwiki.jp/openj3/pages/48.html",
});
new Avatar({
	id: 5,
	name: "原住民",
	description: "(´・ω・｀)",
	src: "https://i.imgur.com/Y7KcMns.png",
	href: "https://w.atwiki.jp/openj3/pages/170.html",
});
new Avatar({
	id: 6,
	name: "🥺ぷゆゆ",
	description: "または赤ガイ",
	src: "https://i.imgur.com/bbfisaN.png",
	href: "https://w.atwiki.jp/openj3/pages/464.html",
});
new Avatar({
	id: 7,
	name: "おんJマン",
	description: "おんJのマスコットキャラクター",
	src: "https://i.imgur.com/boJkX3x.png",
	href: "https://w.atwiki.jp/openj3/pages/26.html",
});

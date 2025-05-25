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
	id: 101,
	name: "束音ロゼ",
	description: "アル？ナイ！アル？ナイ！×2",
	src: "https://avatars.githubusercontent.com/u/88383494",
	href: "https://w.atwiki.jp/openj3/pages/641.html",
});
new Avatar({
	id: 102,
	name: "解音ゼロ",
	description: "解音ゼロのスレのイッチやけど",
	src: "https://i.imgur.com/YDYykrH.png",
	href: "https://zero-tokine-test.my.canva.site",
});
new Avatar({
	id: 103,
	name: "革命シヨ",
	description: "息くせーぞジジイ",
	src: "https://i.imgur.com/YTmeV0y.png",
	href: "https://kakumeisiyo.1my.jp",
});
new Avatar({
	id: 104,
	name: "親音ハハ",
	description: "お母さんの声でボカロ作った",
	src: "https://i.imgur.com/x7wj28Q.png",
	href: "https://pickledplumswithlemon.web.fc2.com",
});
new Avatar({
	id: 201,
	name: "フェリス",
	description: "くしゃみ出そう…ふぇ…ふぇ……ﾌｪﾆｯｸｽ！",
	src: "https://i.imgur.com/GLTROiZ.png",
	href: "https://w.atwiki.jp/openj3/pages/36.html",
});
new Avatar({
	id: 202,
	name: "やきう民",
	description: "やきうのお兄ちゃん",
	src: "https://i.imgur.com/YRalmKn.png",
	href: "https://w.atwiki.jp/openj3/pages/48.html",
});
new Avatar({
	id: 203,
	name: "原住民",
	description: "(´・ω・｀)",
	src: "https://i.imgur.com/Y7KcMns.png",
	href: "https://w.atwiki.jp/openj3/pages/170.html",
});
new Avatar({
	id: 204,
	name: "🥺ぷゆゆ",
	description: "または赤ガイ",
	src: "https://i.imgur.com/bbfisaN.png",
	href: "https://w.atwiki.jp/openj3/pages/464.html",
});
new Avatar({
	id: 205,
	name: "おんJマン",
	description: "おんJのマスコットキャラクター",
	src: "https://i.imgur.com/uMdNy0s.png",
	href: "https://w.atwiki.jp/openj3/pages/26.html",
});
new Avatar({
	id: 206,
	name: "おんちゃん",
	description: "(o'ω'n)",
	src: "https://i.imgur.com/cDxzdE2.png",
	href: "https://w.atwiki.jp/openj3/pages/31.html",
});
new Avatar({
	id: 207,
	name: "ミニワイ",
	description: "ミニワイ(9cm)「もきゅっ！」←お前らに飼われにきた",
	src: "https://i.imgur.com/S0gkZCj.png",
	href: "https://hayabusa.open2ch.net/test/read.cgi/livejupiter/1747923319/l50",
});

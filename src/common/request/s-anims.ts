export const sAnimsMap: Map<number, SAnim> = new Map();
class SAnim {
	name;
	description;
	src;
	href;
	constructor({
		id,
		name,
		description,
		href, // sAnimsから飛べるリンク先
	}: {
		id: number;
		name: string;
		description: string;
		href: string | null;
	}) {
		this.name = name;
		this.description = description;
		this.src = `https://rpgen.cc/dq/sAnims/res/${id}.png`;
		this.href = href;
		sAnimsMap.set(id, this);
	}
}
new SAnim({
	id: 2086,
	name: "束音ロゼ",
	description: "アル？ナイ！アル？ナイ！×2",
	href: "https://w.atwiki.jp/openj3/pages/641.html",
});
new SAnim({
	id: 250,
	name: "やきう民",
	description: "やきうのお兄ちゃん",
	href: "https://w.atwiki.jp/openj3/pages/48.html",
});
new SAnim({
	id: 254,
	name: "原住民",
	description: "(´・ω・｀)",
	href: "https://w.atwiki.jp/openj3/pages/170.html",
});
new SAnim({
	id: 1212,
	name: "おんちゃん",
	description: "(o'ω'n)",
	href: "https://w.atwiki.jp/openj3/pages/31.html",
});
new SAnim({
	id: 1040,
	name: "ポジハメくん",
	description: "(*^〇^*)",
	href: "https://wikiwiki.jp/livejupiter/%28%2A%5E%E2%97%8B%5E%2A%29",
});
new SAnim({
	id: 539,
	name: "ネガケロくん",
	description: "（●▲●）",
	href: "https://wikiwiki.jp/livejupiter/%EF%BC%88%E2%97%8F%E2%96%B2%E2%97%8F%EF%BC%89",
});
new SAnim({
	id: 528,
	name: "カッス",
	description: "なお、まにあわんもよう",
	href: "https://wikiwiki.jp/livejupiter/%E5%B7%A8%E4%BA%BA%E5%B0%8F%E7%AC%A0%E5%8E%9F",
});
new SAnim({
	id: 668,
	name: "TDN",
	description: "当時は若くお金が必要でした",
	href: "https://wikiwiki.jp/livejupiter/TDN",
});
new SAnim({
	id: 1959,
	name: "チノちゃん",
	description: "うるさいですね……",
	href: "https://wikiwiki.jp/livejupiter/%E3%81%86%E3%82%8B%E3%81%95%E3%81%84%E3%81%A7%E3%81%99%E3%81%AD%E2%80%A6%E2%80%A6",
});
new SAnim({
	id: 708,
	name: "野獣先輩",
	description: "24歳、学生です",
	href: "https://dic.nicovideo.jp/a/%E9%87%8E%E7%8D%A3%E5%85%88%E8%BC%A9",
});
new SAnim({
	id: 1870,
	name: "KBTIT",
	description: "かしこまり!",
	href: "https://dic.nicovideo.jp/a/kbtit",
});

import { SiteInfo } from "./site-info.js";

export default [
	new SiteInfo({
		id: 401,
		name: "Imgur",
		description: "2ch民定番の画像アップローダー",
		src: "https://imgur.com/WKkpmbf",
		hostnames: ["i.imgur.com"],
		href: "https://imguruploader.com",
	}),
	new SiteInfo({
		id: 404,
		name: "アル",
		description: "マンガのコマを著作権を気にせず貼り付けられるサービス",
		src: "https://alu.jp/series/SPY%C3%97FAMILY/crop/TRTV4HvxzlBMUpNYcwp9",
		href: "https://alu.jp/cropSearch?q=%E3%83%AC%E3%82%B9%E3%81%AB%E4%BD%BF%E3%81%88%E3%82%8B%E3%82%B3%E3%83%9E",
	}),
	new SiteInfo({
		id: 411,
		name: "よねっと",
		description: "ふなかもめ本体",
		src: "https://funakamome.com/i/eyIK6PE.png",
		href: "https://funakamome.com/imgurup",
	}),
	new SiteInfo({
		id: 412,
		name: "imgx",
		description: "よねっと経由でうｐ可能その1",
		src: "https://imgx.site/i/3q9sMTX.png",
		href: "https://funakamome.com/imgurup",
	}),
	new SiteInfo({
		id: 413,
		name: "ImgBB",
		description: "よねっと経由でうｐ可能その2",
		src: "https://i.ibb.co/Xxk61hsb/2025-06-25-212016.png",
		href: "https://funakamome.com/imgurup",
	}),
	new SiteInfo({
		id: 402,
		name: "ニコニコ静画",
		description: "『静止画』サービスの総合サイト",
		src: "https://seiga.nicovideo.jp/seiga/im11532584",
		hostnames: ["sp.seiga.nicovideo.jp"],
	}),
	new SiteInfo({
		id: 403,
		name: "Pixiv",
		description: "イラスト・マンガ・小説コミュニティサイト",
		src: "https://www.pixiv.net/artworks/120257879",
	}),
];

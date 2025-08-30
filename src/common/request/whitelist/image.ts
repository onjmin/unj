import { SiteInfo } from "./site-info.js";

export default [
	new SiteInfo({
		id: 401,
		name: "Imgur",
		description: "2ch民定番の画像アップローダー",
		href: "https://imguruploader.com",
		hostnames: ["imgur.com", "i.imgur.com"],
	}),
	new SiteInfo({
		id: 404,
		name: "よねっと",
		description: "ふなかもめ本体",
		href: "https://funakamome.com/imgurup",
		hostnames: ["funakamome.com"],
	}),
	new SiteInfo({
		id: 405,
		name: "imgx",
		description: "よねっと経由でうｐ可能その1",
		href: "https://imgx.site/i/3q9sMTX.png",
		hostnames: ["imgx.site"],
	}),
	new SiteInfo({
		id: 406,
		name: "ImgBB",
		description: "よねっと経由でうｐ可能その2",
		href: "https://i.ibb.co/Xxk61hsb/2025-06-25-212016.png",
		hostnames: ["i.ibb.co"],
	}),
	new SiteInfo({
		id: 402,
		name: "ニコニコ静画",
		description: "『静止画』サービスの総合サイト",
		href: "https://seiga.nicovideo.jp/seiga/im11532584",
		hostnames: ["sp.seiga.nicovideo.jp"],
	}),
	new SiteInfo({
		id: 403,
		name: "Pixiv",
		description: "イラスト・マンガ・小説コミュニティサイト",
		href: "https://www.pixiv.net/artworks/120257879",
	}),
];

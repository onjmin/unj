import { SiteInfo } from "./site-info.js";

export default [
	new SiteInfo({
		id: 401,
		name: "Imgur",
		description: "2ch民定番の画像アップローダー",
		href: "https://imgur.com/WKkpmbf",
		hostnames: ["i.imgur.com"],
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

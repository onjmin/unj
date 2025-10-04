import { SiteInfo } from "./site-info.js";

export default [
	new SiteInfo({
		id: 102401,
		name: "Imgur",
		description: "2ch民定番の画像アップローダー",
		src: "https://imgur.com/t2rlI7W",
		hostnames: ["i.imgur.com"],
		href: "https://imguruploader.com",
	}),
	new SiteInfo({
		id: 102402,
		name: "Cloudflare R2",
		description: "10GBまで無料のストレージ",
		src: "https://pub-d049c945dab44db6b75372fdf9cb8401.r2.dev/8f7e7ab1-aae4-4f78-ba52-5ee5785a142b.png",
		href: "https://www.cloudflare.com/ja-jp/developer-platform/products/r2/",
		favicon: "www.cloudflare.com",
	}),
];

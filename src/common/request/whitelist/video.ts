import { SiteInfo } from "./site-info.js";

export default [
	new SiteInfo({
		id: 1601,
		name: "YouTube",
		description: "世界最大の動画共有サービス",
		src: "https://youtu.be/N2X3MgX131E",
		hostnames: ["youtube.com", "www.youtube.com", "m.youtube.com"],
	}),
	new SiteInfo({
		id: 1602,
		name: "ニコニコ動画",
		description: "日本最大級の動画サービス",
		src: "https://nico.ms/sm44654000",
		hostnames: ["nicovideo.jp", "www.nicovideo.jp", "sp.nicovideo.jp"],
	}),
	new SiteInfo({
		id: 1616,
		name: "Pornhub",
		description: "最高品質のエロ動画をゲットしよう",
		src: "https://jp.pornhub.com/view_video.php?viewkey=ph5ff70c4f4a3e3",
		href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		hostnames: [
			"*.pornhub.com",
			"video.fc2.com",
			"www.xvideos.com",
			"*.xhamster.com",
			"www.tokyomotion.net",
			"ero-video.net",
			"video.twimg.com",
		],
	}),
];

import { SiteInfo } from "./site-info.js";

export default [
	new SiteInfo({
		name: "YouTube",
		description: "世界最大の動画共有サービス",
		href: "https://youtu.be/N2X3MgX131E",
		hostnames: ["youtube.com", "www.youtube.com", "m.youtube.com"],
	}),
	new SiteInfo({
		name: "ニコニコ動画",
		description: "日本最大級の動画サービス",
		href: "https://nico.ms/sm44654000",
		hostnames: ["nicovideo.jp", "www.nicovideo.jp", "sp.nicovideo.jp"],
	}),
];

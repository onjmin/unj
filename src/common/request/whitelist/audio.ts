import { SiteInfo } from "./site-info.js";

export default [
	new SiteInfo({
		id: 3201,
		name: "SoundCloud",
		description: "ラッパーに人気の音楽アップロードサイト",
		src: "https://soundcloud.com/user-223103658/j-125",
		hostnames: ["api.soundcloud.com"],
	}),
	new SiteInfo({
		id: 3202,
		name: "Spotify",
		description: "音楽ストリーミングサービス",
		src: "https://open.spotify.com/intl-ja/track/5cuzTmu7d829jHMRjaVCLy",
	}),
	new SiteInfo({
		id: 3203,
		name: "Suno",
		description: "音楽生成AI",
		src: "https://suno.com/song/f6d6cd87-93b9-497f-89cc-d93dafc07ddd",
		href: "https://suno.com/playlist/4c6b4886-2cce-4f28-9364-6abac2a2e8f9",
	}),
];

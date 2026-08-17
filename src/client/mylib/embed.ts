import { corsKiller } from "@onjmin/cors-killer";

export const parseImageEmbedImgur = (url: URL): string | undefined => {
	const id = url.pathname.slice(1).split(".")[0];
	if (!id) return;
	return `https://i.imgur.com/${id}.png`;
};
export const parseImageEmbedAlu = (url: URL): string | undefined => {
	const parts = url.pathname.split("/").filter(Boolean);
	if (parts.length !== 4 || parts[0] !== "series" || parts[2] !== "crop")
		return;
	return `https://alu.jp/oembed?url=${url.href}`;
};
export const parseImageEmbedYonet = (url: URL): string | undefined => {
	const id = url.pathname.slice(1).match(/i\/(.+)\.(.+)/)?.[1];
	if (!id) return;
	return `https://funakamome.com/i/${id}.png`;
};
export const parseImageEmbedImgx = (url: URL): string | undefined => {
	const id = url.pathname.slice(1).match(/i\/(.+)\.(.+)/)?.[1];
	if (!id) return;
	return corsKiller(`https://imgx.site/i/${id}.png`);
};
export const parseImageEmbedImgBB = (url: URL): string | undefined => {
	const match = url.pathname.slice(1).match(/(.+)\/(.+)\.(.+)/);
	if (!match) return;
	return corsKiller(`https://i.ibb.co/${match[0]}/${match[1]}.png`);
};
export const parseImageEmbedNicoseiga = (url: URL): string | undefined => {
	const id = url.pathname.match(/im([0-9]+)/)?.[1];
	if (!id) return;
	return `https://lohas.nicoseiga.jp//thumb/${id}i`;
};
export const parseImageEmbedFeeder = (url: URL): string | undefined => {
	const parts = url.pathname.split("/").filter(Boolean);
	if (parts.length !== 3 || parts[1] !== "pictures") return;
	return `https://${url.hostname}/${parts[0]}/${parts[1]}/${parts[2]}`;
};
export const parseImageEmbedPixiv = (url: URL): string | undefined => {
	const id = url.pathname.match(/[0-9]+/)?.[0];
	if (!id) return;
	return `https://embed.pixiv.net/decorate.php?illust_id=${id}`;
};
export const parseGifEmbedImgur = (url: URL): string | undefined => {
	const id = url.pathname.slice(1).split(".")[0];
	if (!id) return;
	return `https://i.imgur.com/${id}.gif`;
};
export const parseGifEmbedYonet = (url: URL): string | undefined => {
	const id = url.pathname.slice(1).match(/i\/(.+)\.(.+)/)?.[1];
	if (!id) return;
	return `https://funakamome.com/i/${id}.gif`;
};
export const parseGifEmbedImgx = (url: URL): string | undefined => {
	const id = url.pathname.slice(1).match(/i\/(.+)\.(.+)/)?.[1];
	if (!id) return;
	return corsKiller(`https://imgx.site/i/${id}.gif`);
};
export const parseGifEmbedImgBB = (url: URL): string | undefined => {
	const match = url.pathname.slice(1).match(/(.+)\/(.+)\.(.+)/);
	if (!match) return;
	return corsKiller(`https://i.ibb.co/${match[0]}/${match[1]}.gif`);
};
export const parseGifEmbedGIPHY = (url: URL): string | undefined => {
	let id = "";
	if (url.hostname === "gif.open2ch.net") {
		const last = url.pathname.split("/").at(-1);
		if (last) id = last;
	} else if (url.hostname === "giphy.com") {
		const last = url.pathname.split("/").at(-1)?.split("-").at(-1);
		if (last) id = last;
	} else if (url.hostname === "media3.giphy.com") {
		const last = url.pathname.split("/").at(-2);
		if (last) id = last;
	}
	if (!id) return;
	return `https://media3.giphy.com/media/${id}/giphy.gif`;
};
/**
 * 時間指定文字列（例: "21", "21s", "1m30s", "1h2m3s", "90s", "1:30" など）を秒数に変換する。
 */
export function parseTimeToSeconds(timeStr?: string | null): number | undefined {
	if (!timeStr) return undefined;
	const trimmed = timeStr.trim();
	if (!trimmed) return undefined;

	// 純粋な数値または秒単位表記 ("21", "21s")
	if (/^\d+s?$/i.test(trimmed)) {
		const s = parseInt(trimmed.replace(/s$/i, ""), 10);
		return Number.isNaN(s) ? undefined : s;
	}

	// "1h2m3s", "2m30s", "1h30s", "2m", "45s" など
	const hmsMatch = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
	if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
		const hours = parseInt(hmsMatch[1] || "0", 10);
		const minutes = parseInt(hmsMatch[2] || "0", 10);
		const seconds = parseInt(hmsMatch[3] || "0", 10);
		return hours * 3600 + minutes * 60 + seconds;
	}

	// コロン区切り "1:23", "01:23:45"
	if (/^\d+(?::\d+)+$/.test(trimmed)) {
		const parts = trimmed.split(":").map((p) => parseInt(p, 10));
		if (parts.some((n) => Number.isNaN(n))) return undefined;
		if (parts.length === 2) {
			return parts[0] * 60 + parts[1];
		}
		if (parts.length === 3) {
			return parts[0] * 3600 + parts[1] * 60 + parts[2];
		}
	}

	const num = parseInt(trimmed, 10);
	return Number.isNaN(num) ? undefined : num;
}

export const parseVideoEmbedYouTube = (url: URL): string | undefined => {
	const path = url.pathname;
	let id = "";

	// youtu.be 短縮URL: https://youtu.be/VIDEO_ID
	if (url.hostname === "youtu.be") {
		id = path.slice(1).split("/")[0];
	}
	// ライブ配信: https://www.youtube.com/live/VIDEO_ID
	else if (path.startsWith("/live/")) {
		const parts = path.split("/");
		id = parts[2];
	}
	// ショート動画: https://www.youtube.com/shorts/VIDEO_ID
	else if (path.startsWith("/shorts/")) {
		const parts = path.split("/");
		id = parts[2];
	}
	// 埋め込みURL: https://www.youtube.com/embed/VIDEO_ID
	else if (path.startsWith("/embed/")) {
		const parts = path.split("/");
		id = parts[2];
	}
	// 通常動画: https://www.youtube.com/watch?v=VIDEO_ID
	else {
		id = url.searchParams.get("v") || "";
	}

	if (!id) return;

	// 開始秒数の抽出 (t=21s, start=21, time_continue=21, ハッシュ内の #t=21s など)
	const timeParam =
		url.searchParams.get("t") ||
		url.searchParams.get("start") ||
		url.searchParams.get("time_continue") ||
		(url.hash.match(/[#&?](?:t|start|time_continue)=([^&]+)/i)?.[1] ?? "");
	const startSeconds = parseTimeToSeconds(timeParam);

	const embedUrl = new URL(`https://www.youtube.com/embed/${id}`);
	if (startSeconds !== undefined && startSeconds > 0) {
		embedUrl.searchParams.set("start", String(startSeconds));
	}
	return embedUrl.toString();
};
export const parseVideoEmbedNicovideo = (url: URL): string | undefined => {
	const id = url.pathname.match(/(sm[0-9]+|so[0-9]+|nm[0-9]+|[0-9]+)/i)?.[1];
	if (!id) return;
	const timeParam =
		url.searchParams.get("from") ||
		url.searchParams.get("start") ||
		url.searchParams.get("t") ||
		(url.hash.match(/[#&?](?:from|start|t)=([^&]+)/i)?.[1] ?? "") ||
		(url.hash.match(/^#(\d+)/)?.[1] ?? "");
	const fromSeconds = parseTimeToSeconds(timeParam);
	const from = fromSeconds !== undefined && fromSeconds > 0 ? fromSeconds : 0;
	return `https://embed.nicovideo.jp/watch/${id.startsWith("sm") || id.startsWith("so") || id.startsWith("nm") ? id : `sm${id}`}?jsapi=1&amp;from=${from}`;
};
export const parseAudioEmbedSoundCloud = (url: URL): string | undefined => {
	return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&visual=true`;
};
export const parseAudioEmbedSpotify = (url: URL): string | undefined => {
	const match = url.pathname.match(
		/\/(track|album|playlist)\/([a-zA-Z0-9]{22})/,
	);
	if (!match) return;
	const type = match[1];
	const id = match[2];
	return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
};
export const parseAudioEmbedSuno = (url: URL): string | undefined => {
	const match = url.pathname.match(/\/(song)\/([a-f0-9-]{36})/);
	if (!match) return;
	const id = match[2];
	return `https://suno.com/embed/${id}`;
};
export const parseGameEmbedRPGEN = (url: URL): string | undefined => {
	const id = url?.searchParams.get("map");
	if (!id) return;
	return `https://rpgen.org/dq/?map=${id}`;
};

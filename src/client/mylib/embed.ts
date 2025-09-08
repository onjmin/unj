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
		const last = url.pathname.split("/").at(-1);
		if (last) id = last;
	} else if (url.hostname === "media3.giphy.com") {
		const last = url.pathname.split("/").at(-2);
		if (last) id = last;
	}
	if (!id) return;
	return `https://media3.giphy.com/media/${id}/giphy.gif`;
};
export const parseVideoEmbedYouTube = (url: URL): string | undefined => {
	const path = url.pathname;
	let id = "";
	// youtu.be 短縮URLの場合: https://youtu.be/VIDEO_ID
	if (url.hostname === "youtu.be") {
		// pathname は "/VIDEO_ID" になってる
		id = path.slice(1);
	}
	// ショート動画の場合: https://www.youtube.com/shorts/VIDEO_ID
	else if (path.startsWith("/shorts/")) {
		// "/shorts/VIDEO_ID" となっているので、2 番目の要素が動画ID
		const parts = path.split("/");
		id = parts[2];
	}
	// 埋め込み済みの場合: https://www.youtube.com/embed/VIDEO_ID
	else if (path.startsWith("/embed/")) {
		const parts = path.split("/");
		id = parts[2];
	}
	// 通常の動画の場合: https://www.youtube.com/watch?v=VIDEO_ID など
	else {
		// URLSearchParams から "v" パラメータを取得
		id = url.searchParams.get("v") || "";
	}
	// 動画 ID が抽出できた場合、埋め込み URL を返す
	if (!id) return;
	return `https://www.youtube.com/embed/${id}`;
};
export const parseVideoEmbedNicovideo = (url: URL): string | undefined => {
	const id = url.pathname.match(/sm([0-9]+)/)?.[1];
	if (!id) return;
	return `https://embed.nicovideo.jp/watch/sm${id}?jsapi=1&amp;from=0`;
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
export const parseGameEmbedRPGEN = (url: URL): string | undefined => {
	const id = url?.searchParams.get("map");
	if (!id) return;
	return `https://rpgen.org/dq/?map=${id}`;
};

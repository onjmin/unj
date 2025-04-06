export const parseImageEmbedImgur = (url: URL): string | null => {
	const id = url.pathname.slice(1).split(".")[0];
	if (id) {
		return `https://i.imgur.com/${id}.png`;
	}
	return null;
};
export const parseImageEmbedNicoseiga = (url: URL): string | null => {
	const id = url.pathname.match(/im([0-9]+)/)?.[1];
	if (id) {
		return `https://lohas.nicoseiga.jp//thumb/${id}i`;
	}
	return null;
};
export const parseImageEmbedPixiv = (url: URL): string | null => {
	const id = url.pathname.match(/[0-9]+/)?.[0];
	if (id) {
		return `https://embed.pixiv.net/decorate.php?illust_id=${id}`;
	}
	return null;
};
export const parseGifEmbedImgur = (url: URL): string | null => {
	const id = url.pathname.slice(1).split(".")[0];
	if (id) {
		return `https://i.imgur.com/${id}.gif`;
	}
	return null;
};
export const parseVideoEmbedYouTube = (url: URL): string | null => {
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
	if (id) {
		return `https://www.youtube.com/embed/${id}`;
	}
	return null;
};
export const parseVideoEmbedNicovideo = (url: URL): string | null => {
	const id = url.pathname.match(/sm([0-9]+)/)?.[1];
	if (id) {
		return `https://embed.nicovideo.jp/watch/sm${id}?jsapi=1&amp;from=0`;
	}
	return null;
};
export const parseAudioEmbedSoundCloud = (url: URL): string | null => {
	return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&visual=true`;
};
export const parseAudioEmbedSpotify = (url: URL): string | null => {
	const match = url.pathname.match(
		/\/(track|album|playlist)\/([a-zA-Z0-9]{22})/,
	);
	if (match) {
		const type = match[1];
		const id = match[2];
		return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
	}
	return null;
};

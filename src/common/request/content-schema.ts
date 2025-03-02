import * as v from "valibot";
import { playgrounds } from "../../client/mylib/playground.js";
import blacklistDarkWeb1 from "./blacklist/dark-web/domain1.js";
import blacklistShortenedUrl2 from "./blacklist/shortened-url/domain2.js";
import blacklistShortenedUrl3 from "./blacklist/shortened-url/domain3.js";
import whitelistAudio from "./whitelist/audio.js";
import whitelistGif from "./whitelist/gif.js";
import whitelistImage from "./whitelist/image.js";
import type { SiteInfo } from "./whitelist/site-info.js";
import whitelistUnjGames from "./whitelist/unj-games.js";
import whitelistVideo from "./whitelist/video.js";

// biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
const regexCtrl = /[^\u0000-\u001F\u007F-\u009F]/u;
const regexArabic =
	/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\ufb50-\ufdff\ufe70-\ufeFF]/u;

const regexUrl = /ttps?:\/\//;

const SAFE_TEXT = v.pipe(
	v.string(),
	v.trim(),
	v.maxLength(1024),
	v.check((input) => !regexCtrl.test(input)),
	v.check((input) => !regexArabic.test(input)),
	v.check((input) => !regexUrl.test(input)),
);

const SAFE_URL = v.pipe(
	v.string(),
	v.trim(),
	v.maxLength(1024),
	v.check((input) => !regexCtrl.test(input)),
	v.check((input) => !regexArabic.test(input)),
	v.url(), // 暗黙的に空文字が許容されなくなる
);

/**
 * 1: text
 */
const TextSchema = v.object({
	content_type: v.pipe(v.number(), v.value(1)),
	content: v.pipe(SAFE_TEXT, v.minLength(1)),
	content_url: v.pipe(v.string(), v.length(0)),
});

/**
 * ドメインの末尾からn個までを取得
 */
const sliceDomain = (url: string, n: number) =>
	new URL(url).hostname.split(".").slice(-n).join(".");

/**
 * 2: url
 */
const UrlSchema = v.object({
	content_type: v.pipe(v.number(), v.value(2)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => !blacklistDarkWeb1.has(sliceDomain(input, 1))),
		v.check((input) => !blacklistShortenedUrl2.has(sliceDomain(input, 2))),
		v.check((input) => !blacklistShortenedUrl3.has(sliceDomain(input, 3))),
		v.check((input) => setOf(whitelistUnjGames).has(new URL(input).hostname)),
		v.check((input) => setOf(whitelistImage).has(new URL(input).hostname)),
		v.check((input) => setOf(whitelistGif).has(new URL(input).hostname)),
		v.check((input) => setOf(whitelistVideo).has(new URL(input).hostname)),
		v.check((input) => setOf(whitelistAudio).has(new URL(input).hostname)),
	),
});

/**
 * 各モジュールにSetオブジェクトを定義するのは冗長なので。
 */
const setOf = (() => {
	const map: Map<SiteInfo[], Set<string>> = new Map();
	const empty: Set<string> = new Set();
	return (arr: SiteInfo[]): Set<string> => {
		if (map.has(arr)) {
			return map.get(arr) ?? empty;
		}
		const sum = [];
		for (const v of arr) {
			sum.push(...v.hostnames);
		}
		map.set(arr, new Set(sum));
		return map.get(arr) ?? empty;
	};
})();

/**
 * 4: url_of_unj_games
 */
const UrlOfUnjGamesSchema = v.object({
	content_type: v.pipe(v.number(), v.value(4)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => setOf(whitelistUnjGames).has(new URL(input).hostname)),
	),
});

/**
 * 8: url_of_image(Imgur|アル)
 */
const UrlOfImageSchema = v.object({
	content_type: v.pipe(v.number(), v.value(8)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => setOf(whitelistImage).has(sliceDomain(input, 2))),
	),
});

/**
 * 16: url_of_gif(Imgur)
 */
const UrlOfGifSchema = v.object({
	content_type: v.pipe(v.number(), v.value(16)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => setOf(whitelistGif).has(sliceDomain(input, 2))),
	),
});

/**
 * 32: url_of_video(YouTube||Nicovideo||Vimeo)
 */
const UrlOfVideoSchema = v.object({
	content_type: v.pipe(v.number(), v.value(32)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => setOf(whitelistVideo).has(sliceDomain(input, 2))),
	),
});

/**
 * 64: url_of_audio(SoundCloud||Spotify)
 */
const UrlOfAudioSchema = v.object({
	content_type: v.pipe(v.number(), v.value(64)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => setOf(whitelistAudio).has(sliceDomain(input, 2))),
	),
});

const contentSchemaMap = {
	1: TextSchema,
	2: UrlSchema,
	4: UrlOfUnjGamesSchema,
	8: UrlOfImageSchema,
	16: UrlOfGifSchema,
	32: UrlOfVideoSchema,
	64: UrlOfAudioSchema,
};

/**
 * content_typeに応じたスキーマを取得
 */
export const getContentSchema = (content_type: number) =>
	contentSchemaMap[content_type as keyof typeof contentSchemaMap];

const contentTemplateMap = {
	1: [],
	2: [],
	4: whitelistUnjGames,
	8: whitelistImage,
	16: whitelistGif,
	32: whitelistVideo,
	64: whitelistAudio,
};

/**
 * GUI用
 * content_typeに応じたテンプレを取得
 */
export const getContentTemplate = (content_type: number) =>
	contentTemplateMap[content_type as keyof typeof contentTemplateMap];

/**
 * GUI用
 * プルダウンに表示する順番（入れ替え可能）
 */
export const contentTypeOptions = [
	{ bit: 1, label: "テキスト" },
	{ bit: 2, label: "+URL" },
	{ bit: 4, label: "+ゲーム" },
	{ bit: 8, label: "+画像" },
	{ bit: 16, label: "+GIF" },
	{ bit: 32, label: "+動画" },
	{ bit: 64, label: "+音楽" },
];

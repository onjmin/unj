import * as v from "valibot";
import { playgrounds } from "../../client/mylib/playground.js";
import { blacklistDarkWeb1 } from "./blacklist/dark-web/domain1.js";
import { blacklistShortenedUrl2 } from "./blacklist/shortened-url/domain2.js";
import { blacklistShortenedUrl3 } from "./blacklist/shortened-url/domain3.js";

const regexUrl = /ttps?:\/\//u;
// biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
const regexCtrl = /[^\u0000-\u001F\u007F-\u009F]/u;
const regexArabic =
	/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\ufb50-\ufdff\ufe70-\ufeFF]/u;

const SAFE_TEXT = v.pipe(
	v.string(),
	v.trim(),
	v.maxLength(1024),
	v.check((input) => !regexUrl.test(input)),
	v.check((input) => !regexCtrl.test(input)),
	v.check((input) => !regexArabic.test(input)),
);

const SAFE_URL = v.pipe(
	v.string(),
	v.trim(),
	v.url(),
	v.transform((input) => new URL(input).href),
	v.maxLength(1024),
);

/**
 * 1: text
 */
export const TextSchema = v.object({
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
export const UrlSchema = v.object({
	content_type: v.pipe(v.number(), v.value(2)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => !blacklistDarkWeb1.has(sliceDomain(input, 1))),
		v.check((input) => !blacklistShortenedUrl2.has(sliceDomain(input, 2))),
		v.check((input) => !blacklistShortenedUrl3.has(sliceDomain(input, 3))),
		v.check((input) => whitelistUnjGames.has(new URL(input).hostname)),
		v.check((input) => whitelistImage2.has(sliceDomain(input, 2))),
		v.check((input) => whitelistGif2.has(sliceDomain(input, 2))),
		v.check((input) => whitelistVideo2.has(sliceDomain(input, 2))),
		v.check((input) => whitelistAudio2.has(sliceDomain(input, 2))),
	),
});

const whitelistUnjGames = new Set(
	playgrounds.map((v) => new URL(v.href).hostname),
);

/**
 * 4: url_of_unj_games
 */
export const UrlOfUnjGamesSchema = v.object({
	content_type: v.pipe(v.number(), v.value(4)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => whitelistUnjGames.has(new URL(input).hostname)),
	),
});

const whitelistImage2 = new Set(["imgur.com"]);

/**
 * 8: url_of_image(Imgur|アル)
 */
export const UrlOfImageSchema = v.object({
	content_type: v.pipe(v.number(), v.value(8)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => whitelistImage2.has(sliceDomain(input, 2))),
	),
});

const whitelistGif2 = new Set(["imgur.com"]);

/**
 * 16: url_of_gif(Imgur)
 */
export const UrlOfGifSchema = v.object({
	content_type: v.pipe(v.number(), v.value(16)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => whitelistGif2.has(sliceDomain(input, 2))),
	),
});

const whitelistVideo2 = new Set([
	"youtu.be",
	"youtube.com",
	"nicovideo.jp",
	"nico.ms",
]);

/**
 * 32: url_of_video(YouTube||Nicovideo||Vimeo)
 */
export const UrlOfVideoSchema = v.object({
	content_type: v.pipe(v.number(), v.value(32)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => whitelistVideo2.has(sliceDomain(input, 2))),
	),
});

const whitelistAudio2 = new Set(["soundcloud.com"]);

/**
 * 64: url_of_audio(SoundCloud||Spotify)
 */
export const UrlOfAudioSchema = v.object({
	content_type: v.pipe(v.number(), v.value(64)),
	content: SAFE_TEXT,
	content_url: v.pipe(
		SAFE_URL,
		v.check((input) => whitelistAudio2.has(sliceDomain(input, 2))),
	),
});

export const contentSchemaMap = {
	1: TextSchema,
	2: UrlSchema,
	4: UrlOfUnjGamesSchema,
	8: UrlOfImageSchema,
	16: UrlOfGifSchema,
	32: UrlOfVideoSchema,
	64: UrlOfAudioSchema,
};

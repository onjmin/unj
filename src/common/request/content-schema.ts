import * as v from "valibot";
import blacklistDarkWeb1 from "./blacklist/dark-web/domain1.js";
import blacklistShortenedUrl2 from "./blacklist/shortened-url/domain2.js";
import blacklistShortenedUrl3 from "./blacklist/shortened-url/domain3.js";
import blacklistUploader2 from "./blacklist/uploader/domain2.js";
import blacklistUploader3 from "./blacklist/uploader/domain3.js";
import whitelistAudio from "./whitelist/audio.js";
import whitelistGif from "./whitelist/gif.js";
import whitelistImage from "./whitelist/image.js";
import { findIn } from "./whitelist/site-info.js";
import whitelistUnjGames from "./whitelist/unj-games.js";
import whitelistVideo from "./whitelist/video.js";

const SAFE_TEXT = v.pipe(
	v.string(),
	v.trim(),
	v.maxLength(256),
	// 制御文字
	v.check(
		(input) =>
			// biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>]
			!/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/u.test(input),
	),
	// 双方向テキスト制御
	v.check((input) => !/[\u202A-\u202E\u2066-\u2069\uFFF9-\uFFFB]/u.test(input)),
	// ゼロ幅・不可視・プライベートユースエリア
	v.check(
		(input) =>
			!/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u180E\uE000-\uF8FF]/u.test(
				input,
			),
	),
	// サロゲートペア全排除
	v.check((input) => !/[\uD800-\uDFFF]/u.test(input)),
);
const regexLf = /\n/;
const regexUrl = /ttps?:\/\//;
export const SAFE_TEXT_SINGLELINE = v.pipe(
	SAFE_TEXT,
	v.check((input) => !regexLf.test(input)),
	v.check((input) => !regexUrl.test(input)),
);
const SAFE_TEXT_MULTILINE = v.pipe(
	SAFE_TEXT,
	v.check((input) => !regexUrl.test(input)),
	v.check((input) => input.split("\n").length < 8),
);
const SAFE_URL = v.pipe(
	SAFE_TEXT,
	v.check((input) => !regexLf.test(input)),
	v.url(), // 暗黙的に空文字が許容されなくなる
);

/**
 * 1: text
 */
const TextSchema = v.object({
	contentType: v.pipe(v.number(), v.value(1)),
	contentText: v.pipe(SAFE_TEXT_MULTILINE, v.minLength(1)),
	contentUrl: v.pipe(v.string(), v.length(0)),
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
	contentType: v.pipe(v.number(), v.value(2)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !blacklistDarkWeb1.has(sliceDomain(input, 1))),
		v.check((input) => !blacklistShortenedUrl2.has(sliceDomain(input, 2))),
		v.check((input) => !blacklistShortenedUrl3.has(sliceDomain(input, 3))),
		v.check((input) => !blacklistUploader2.has(sliceDomain(input, 2))),
		v.check((input) => !blacklistUploader3.has(sliceDomain(input, 3))),
		v.check((input) => !findIn(whitelistUnjGames, new URL(input).hostname)),
		v.check((input) => !findIn(whitelistImage, new URL(input).hostname)),
		v.check((input) => !findIn(whitelistGif, new URL(input).hostname)),
		v.check((input) => !findIn(whitelistVideo, new URL(input).hostname)),
		v.check((input) => !findIn(whitelistAudio, new URL(input).hostname)),
	),
});

/**
 * 4: url_of_image(Imgur|アル)
 */
const UrlOfImageSchema = v.object({
	contentType: v.pipe(v.number(), v.value(4)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistImage, new URL(input).hostname)),
	),
});

/**
 * 8: url_of_gif(Imgur)
 */
const UrlOfGifSchema = v.object({
	contentType: v.pipe(v.number(), v.value(8)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistGif, new URL(input).hostname)),
	),
});

/**
 * 16: url_of_video(YouTube||Nicovideo||Vimeo)
 */
const UrlOfVideoSchema = v.object({
	contentType: v.pipe(v.number(), v.value(16)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistVideo, new URL(input).hostname)),
	),
});

/**
 * 32: url_of_audio(SoundCloud||Spotify)
 */
const UrlOfAudioSchema = v.object({
	contentType: v.pipe(v.number(), v.value(32)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistAudio, new URL(input).hostname)),
	),
});

/**
 * 64: url_of_unj_games
 */
const UrlOfUnjGamesSchema = v.object({
	contentType: v.pipe(v.number(), v.value(64)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistUnjGames, new URL(input).hostname)),
	),
});

/**
 * content_typeに対応するスキーマ
 */
export const contentSchemaMap = new Map(
	Object.entries({
		1: TextSchema,
		2: UrlSchema,
		4: UrlOfImageSchema,
		8: UrlOfGifSchema,
		16: UrlOfVideoSchema,
		32: UrlOfAudioSchema,
		64: UrlOfUnjGamesSchema,
	}).map(([k, v]) => [Number(k), v]),
);

/**
 * GUI用
 * content_typeに対応するテンプレ
 */
export const contentTemplateMap = new Map(
	Object.entries({
		1: [],
		2: [],
		4: whitelistImage,
		8: whitelistGif,
		16: whitelistVideo,
		32: whitelistAudio,
		64: whitelistUnjGames,
	}).map(([k, v]) => [Number(k), v]),
);

/**
 * GUI用
 * プルダウンに表示する順番（入れ替え可能）
 */
export const contentTypeOptions = [
	{ bit: 1, label: "テキスト" },
	{ bit: 2, label: "+URL" },
	{ bit: 4, label: "+画像" },
	{ bit: 8, label: "+GIF" },
	{ bit: 16, label: "+動画" },
	{ bit: 32, label: "+音楽" },
	{ bit: 64, label: "+ゲーム" },
];

/**
 * GUI用
 * プルダウンに表示する順番（入れ替え可能）
 */
export const ccOptions = [
	{ bit: 1, label: "ID" },
	{ bit: 2, label: "自演防止ID" },
	{ bit: 4, label: "コテハン" },
	{ bit: 8, label: "アイコン" },
];

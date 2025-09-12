import * as v from "valibot";
import blacklistDarkWeb1 from "./blacklist/dark-web/domain1.js";
import blacklistShortenedUrl2 from "./blacklist/shortened-url/domain2.js";
import blacklistShortenedUrl3 from "./blacklist/shortened-url/domain3.js";
import blacklistUploader2 from "./blacklist/uploader/domain2.js";
import blacklistUploader3 from "./blacklist/uploader/domain3.js";
import whitelistAudio from "./whitelist/audio.js";
import whitelistGame from "./whitelist/game.js";
import whitelistGif from "./whitelist/gif.js";
import whitelistImage from "./whitelist/image.js";
import whitelistOekaki from "./whitelist/oekaki.js";
import { findIn } from "./whitelist/site-info.js";
import whitelistVideo from "./whitelist/video.js";

export const ankaRegex = />>(?:[1-9][0-9]{0,3})(?![0-9])/g; // >>1-9999

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
	v.check((input) => input.split("\n").length < 32),
);
const SAFE_URL = v.pipe(
	SAFE_TEXT,
	v.check((input) => !regexLf.test(input)),
	v.url(), // 暗黙的に空文字が許容されなくなる
);
export const SAFE_SEARCH_KEYWORD = v.pipe(
	SAFE_TEXT,
	v.minLength(1),
	v.check((input) => !regexLf.test(input)),
);

export const Enum = {
	Text: 1,
	Url: 2,
	Image: 4,
	Gif: 8,
	Video: 16,
	Audio: 32,
	Game: 64,
	Oekaki: 1024,
} as const;
export type EnumType = (typeof Enum)[keyof typeof Enum];

const TextSchema = v.object({
	contentType: v.pipe(v.number(), v.value(Enum.Text)),
	contentText: v.pipe(SAFE_TEXT_MULTILINE, v.minLength(1)),
	contentUrl: v.pipe(v.string(), v.length(0)),
});

/**
 * ドメインの末尾からn個までを取得
 */
const sliceDomain = (url: string, n: number) =>
	new URL(url).hostname.split(".").slice(-n).join(".");

const UrlSchema = v.object({
	contentType: v.pipe(v.number(), v.value(Enum.Url)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !blacklistDarkWeb1.has(sliceDomain(input, 1))),
		v.check((input) => !blacklistShortenedUrl2.has(sliceDomain(input, 2))),
		v.check((input) => !blacklistShortenedUrl3.has(sliceDomain(input, 3))),
		v.check((input) => !blacklistUploader2.has(sliceDomain(input, 2))),
		v.check((input) => !blacklistUploader3.has(sliceDomain(input, 3))),
		v.check((input) => !findIn(whitelistGame, new URL(input).hostname)),
		v.check((input) => !findIn(whitelistImage, new URL(input).hostname)),
		v.check((input) => !findIn(whitelistGif, new URL(input).hostname)),
		v.check((input) => !findIn(whitelistVideo, new URL(input).hostname)),
		v.check((input) => !findIn(whitelistAudio, new URL(input).hostname)),
	),
});

const UrlOfImageSchema = v.object({
	contentType: v.pipe(v.number(), v.value(Enum.Image)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistImage, new URL(input).hostname)),
	),
});

const UrlOfGifSchema = v.object({
	contentType: v.pipe(v.number(), v.value(Enum.Gif)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistGif, new URL(input).hostname)),
	),
});

const UrlOfVideoSchema = v.object({
	contentType: v.pipe(v.number(), v.value(Enum.Video)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistVideo, new URL(input).hostname)),
	),
});

const UrlOfAudioSchema = v.object({
	contentType: v.pipe(v.number(), v.value(Enum.Audio)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistAudio, new URL(input).hostname)),
	),
});

const UrlOfGameSchema = v.object({
	contentType: v.pipe(v.number(), v.value(Enum.Game)),
	contentText: SAFE_TEXT_MULTILINE,
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistGame, new URL(input).hostname)),
	),
});

export const oekakiSchema = v.object({
	contentType: v.pipe(v.number(), v.value(Enum.Oekaki)),
	contentText: SAFE_TEXT_MULTILINE,
	// 雑なバリデーション
	contentMeta: v.strictObject({
		link: v.pipe(v.string(), v.maxLength(64)),
		id: v.pipe(v.string(), v.maxLength(64)),
		deletehash: v.pipe(v.string(), v.maxLength(64)),
	}),
	contentUrl: v.pipe(
		SAFE_URL,
		v.check((input) => !!findIn(whitelistOekaki, new URL(input).hostname)),
	),
});

/**
 * content_typeに対応するスキーマ
 */
export const contentSchemaMap = new Map(
	Object.entries({
		[Enum.Text]: TextSchema,
		[Enum.Url]: UrlSchema,
		[Enum.Image]: UrlOfImageSchema,
		[Enum.Gif]: UrlOfGifSchema,
		[Enum.Video]: UrlOfVideoSchema,
		[Enum.Audio]: UrlOfAudioSchema,
		[Enum.Game]: UrlOfGameSchema,
		[Enum.Oekaki]: oekakiSchema,
	}).map(([k, v]) => [Number(k), v]),
);

/**
 * GUI用
 * content_typeに対応するテンプレ
 */
export const contentTemplateMap = new Map(
	Object.entries({
		[Enum.Text]: [],
		[Enum.Url]: [],
		[Enum.Image]: whitelistImage,
		[Enum.Gif]: whitelistGif,
		[Enum.Video]: whitelistVideo,
		[Enum.Audio]: whitelistAudio,
		[Enum.Game]: whitelistGame,
		[Enum.Oekaki]: whitelistOekaki,
	}).map(([k, v]) => [Number(k), v]),
);

/**
 * GUI用
 * プルダウンに表示する順番（入れ替え可能）
 */
export const contentTypeOptions = [
	{ bit: Enum.Oekaki, label: "お絵描き" },
	{ bit: Enum.Text, label: "テキスト" },
	{ bit: Enum.Url, label: "+URL" },
	{ bit: Enum.Image, label: "+画像" },
	{ bit: Enum.Gif, label: "+GIF" },
	{ bit: Enum.Video, label: "+動画" },
	{ bit: Enum.Audio, label: "+音楽" },
	{ bit: Enum.Game, label: "+ゲーム" },
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

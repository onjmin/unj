import { seededRandArray } from "../../../common/util.js";

export const makeValentineEmojiSuffix = (seed: string) =>
	seededRandArray(emojiArray, seed);

const emojiArray = [
	"🍫",
	"🍫",
	"🍫",
	"🍫",
	"🍩",
	"🍪",
	"🎁",
	"💝",
	"❤️",
	"💖",
	"💕",
	"😡", // 直球の怒り
	"💢", // 日本的・漫画的怒り（最適）
	"😠", // 不機嫌
	"🖤", // 闇落ち・拗らせ（恋愛文脈と相性良）
	"🤬", // 激怒
];

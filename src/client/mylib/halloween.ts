import { seededRandArray } from "../../common/util.js";

export const makeSeededSuffix = (seed: string) =>
	[...Array(3).keys()]
		.map((v) => seededRandArray(emoji, `${v}###${seed}`))
		.join("");

const emoji = [
	"🎃",
	"👻",
	"🕷️",
	"🕸️",
	"🦇",
	"💀",
	"☠️",
	"🪦",
	"⚰️",
	"🧛‍♂️",
	"🧙‍♂️",
	"🧟‍♂️",
	"😈",
	"🤡",
	"🎃",
	"👻",
	"🕸️",
	"🕯️",
	"🌕",
	"🍬",
	"🍭",
	"🍫",
	"🍩",
	"🍪",
	"🧁",
	"🍰",
	"🧃",
	"🥤",
];

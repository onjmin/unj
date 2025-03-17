import { Howler } from "howler";
import { sha256 } from "js-sha256";
import { load, save } from "./idb/keyval.js";

/**
 * SE音量
 */
export const saveSoundVolume = (volume: number) => {
	Howler.volume(volume);
	save("soundVolume", volume.toString());
};
load("soundVolume").then((v) => {
	let volume = 0.3777;
	if (v) volume = Number.parseFloat(v);
	Howler.volume(volume);
});

const make = (sound: Sound | null) =>
	!sound?.src
		? null
		: new Howl({
				src: [sound.src],
				html5: true,
			});

/**
 * 新着レスSE
 */
export let newResSound: Howl | null = null;
export let newResSoundKey = "";
export const saveNewResSound = (sound: Sound | null) => {
	newResSoundKey = sound?.key ?? "";
	newResSound = make(sound);
	save("newResSound", sound?.key ?? null);
};
load("newResSound").then((v) => {
	newResSoundKey = v ?? "";
	const sound = soundMap.get(newResSoundKey) ?? coin;
	newResSound = make(sound);
});

/**
 * 安価レスSE
 */
export let replyResSound: Howl | null = null;
export let replyResSoundKey = "";
export const saveReplyResSound = (sound: Sound | null) => {
	replyResSoundKey = sound?.key ?? "";
	replyResSound = make(sound);
	save("replyResSound", sound?.key ?? null);
};
load("replyResSound").then((v) => {
	replyResSoundKey = v ?? "";
	const sound = soundMap.get(replyResSoundKey) ?? waf;
	replyResSound = make(sound);
});

export const soundMap: Map<string, Sound> = new Map();
class Sound {
	label;
	src;
	key;
	constructor({ label, src }: { label: string; src: string | null }) {
		this.label = label;
		this.src = src;
		this.key = sha256(label);
		soundMap.set(this.key, this);
	}
}

new Sound({
	label: "効果音なし",
	src: null,
});

const coin = new Sound({
	label: "コインの音（マリオ）",
	src: "https://rpgen.org/dq/sound/res/79.mp3",
});
const waf = new Sound({
	label: "和風扉",
	src: "https://rpgen.org/dq/sound/res/741.mp3",
});
new Sound({
	label: "選択音3",
	src: "https://rpgen.org/dq/sound/res/11.mp3",
});

// 33-4
new Sound({
	label: "ち～ん(笑)",
	src: "https://rpgen.org/dq/sound/res/54.mp3",
});
new Sound({
	label: "ち～ん(笑)2",
	src: "https://rpgen.org/dq/sound/res/298.mp3",
});

// 淫夢系
new Sound({
	label: "こ↑こ↓",
	src: "https://rpgen.org/dq/sound/res/29.mp3",
});
new Sound({
	label: "野獣先輩/ヌッ！",
	src: "https://rpgen.org/dq/sound/res/1335.mp3",
});
new Sound({
	label: "野獣の咆哮",
	src: "https://rpgen.org/dq/sound/res/68.mp3",
});
new Sound({
	label: "ゆうさく/ﾁｸ",
	src: "https://rpgen.org/dq/sound/res/1438.mp3",
});
new Sound({
	label: "イグゾ！",
	src: "https://rpgen.org/dq/sound/res/1451.mp3",
});
new Sound({
	label: "ひで/ワァオ",
	src: "https://rpgen.org/dq/sound/res/1449.mp3",
});

new Sound({
	label: "XPバルーン",
	src: "https://rpgen.org/dq/sound/res/237.mp3",
});
new Sound({
	label: "XP情報バー",
	src: "https://rpgen.org/dq/sound/res/239.mp3",
});

new Sound({
	label: "RPGEN チャット投稿音",
	src: "https://rpgen.org/dq/sound/res/1099.mp3",
});

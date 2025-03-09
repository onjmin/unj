import { Howler } from "howler";
import { sha256 } from "js-sha256";
import { load, save } from "./idb/keyval.js";

export const loadSoundVolume = async () => {
	const result = await load("soundVolume");
	const volume = result ? Number.parseFloat(result) : 0.0721;
	Howler.volume(volume);
	return volume;
};
export const saveSoundVolume = (volume: number) => {
	save("soundVolume", volume.toString());
	Howler.volume(volume);
};

export const loadNewResSound = async () => {
	const result = await load("newResSound");
	if (result) {
		return soundMap.get(result);
	}
	return coin;
};
export const saveNewResSound = (sound: Sound) => {
	save("newResSound", sound.key);
};

export const loadReplyResSound = async () => {
	const result = await load("replyResSound");
	if (result) {
		return soundMap.get(result);
	}
	return waf;
};
export const saveReplyResSound = (sound: Sound) => {
	save("replyResSound", sound.key);
};

export const soundMap = new Map<string, Sound>();
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

// 淫夢系
new Sound({
	label: "こ↑こ↓",
	src: "https://rpgen.org/dq/sound/res/29.mp3",
});
new Sound({
	label: "ゆうさく/ﾁｸ",
	src: "https://rpgen.org/dq/sound/res/1438.mp3",
});
new Sound({
	label: "ち～ん(笑)2",
	src: "https://rpgen.org/dq/sound/res/298.mp3",
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

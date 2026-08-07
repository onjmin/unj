import { Avatar, rozeAvatars, touhouAvatars, unjAvatars } from "./avatar.js";

export const boardMap: Map<string, Board> = new Map();
export const boardIdMap: Map<number, Board> = new Map();
export class Board {
	readonly id: number;
	readonly key: string; // URL 用キー
	readonly name: string; // 板の表示名
	readonly description: string; // 板の説明文
	readonly banner: string;
	readonly favicon: string;
	readonly avatarMap: Map<number, Avatar>;
	constructor({
		id,
		key,
		name,
		description,
		banner,
		favicon,
	}: {
		id: number;
		key: string;
		name: string;
		description: string;
		banner?: string;
		favicon?: string;
	}) {
		this.id = id;
		this.key = key;
		this.name = name;
		this.description = description;
		this.banner = banner ?? "";
		this.favicon = favicon ?? "";
		this.avatarMap = new Map();
		this.avatarMap.set(
			0,
			new Avatar({
				id: 0,
				name: "アイコンなし",
				description: "デフォルト",
				src: null,
				href: null,
			}),
		);
		boardMap.set(key, this);
		boardIdMap.set(id, this);
	}
}

export const undefinedBoard = new Board({
	id: 0,
	key: "undefined",
	name: "未定義",
	description: "そこに存在するはずのない板",
});
export const unjBoard = new Board({
	id: 1,
	key: "unj",
	name: "うんでも実況J",
	description: "運営と運命を共にする、うんち実況（セーラージュピター）",
	// banner: "https://i.imgur.com/O1A36k3.png",
	// banner: "https://pub-d049c945dab44db6b75372fdf9cb8401.r2.dev/69c4be44.png",
	// banner: "https://pub-d049c945dab44db6b75372fdf9cb8401.r2.dev/bc307e45.png",
});
for (const v of unjAvatars) unjBoard.avatarMap.set(v.id, v);
export const noharaBoard = new Board({
	id: 2,
	key: "nohara",
	name: "野原＠テスト用",
	description:
		"テスト投稿用の板です。スレ立て・投稿テストなどに自由にご利用ください。",
});
export const kimchiBoard = new Board({
	id: 3,
	key: "kimchi",
	name: "なんでも実況(キムチ)",
	description: "世界最高掲示板「おんキム」🌶️",
});
export const touhouBoard = new Board({
	id: 4,
	key: "touhou",
	name: "東方なりきり板",
	description: "好きな東方キャラになりきって雑談しよう！オリキャラも参加OK！",
});
for (const v of touhouAvatars) touhouBoard.avatarMap.set(v.id, v);
export const unchiBoard = new Board({
	id: 5,
	key: "unchi",
	name: "うんち板",
	description: "うんちについて話す板です。",
});
export const rozeBoard = new Board({
	id: 6,
	key: "roze",
	name: "束音ロゼ板",
	description: "ロゼにまつわるエトセトラ",
});
for (const v of rozeAvatars) rozeBoard.avatarMap.set(v.id, v);
export const news4vipBoard = new Board({
	id: 7,
	key: "news4vip",
	name: "ニュー速VIP",
	description: "特別な板、ニュー速VIPへようこそ",
});

export const publicBoards = [...boardMap.values()].filter((v) => v.id);

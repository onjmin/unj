export class Avatar {
	readonly id;
	readonly name;
	readonly description;
	readonly src;
	readonly href;
	constructor({
		id,
		name,
		description,
		src, // 実際に使われる画像URL
		href, // アバター選択UIから飛べるリンク先
	}: {
		id: number;
		name: string;
		description: string;
		src: string | null;
		href: string | null;
	}) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.src = src;
		this.href = href;
	}
}

export const rozeAvatars = [
	new Avatar({
		id: 101,
		name: "束音ロゼ",
		description: "アル？ナイ！アル？ナイ！×2",
		src: "https://i.imgur.com/ZLNiE7T.png",
		href: "https://w.atwiki.jp/openj3/pages/641.html",
	}),
	new Avatar({
		id: 102,
		name: "解音ゼロ",
		description: "解音ゼロのスレのイッチやけど",
		src: "https://musicfm.pages.dev/zero.png",
		href: "https://zero-tokine-test.my.canva.site",
	}),
	new Avatar({
		id: 103,
		name: "革命シヨ",
		description: "息くせーぞジジイ",
		src: "https://i.imgur.com/XoLGk4v.png",
		href: "https://kakumeisiyo.1my.jp",
	}),
];

export const unjAvatars = [
	new Avatar({
		id: 1,
		name: "阿部寛",
		description: "阿部寛のホームページ",
		src: "https://i.imgur.com/g0yKai6.jpg",
		href: "https://ja.wikipedia.org/wiki/%E9%98%BF%E9%83%A8%E5%AF%9B%E3%81%AE%E3%83%9B%E3%83%BC%E3%83%A0%E3%83%9A%E3%83%BC%E3%82%B8",
	}),
	...rozeAvatars,
	new Avatar({
		id: 201,
		name: "フェリス",
		description: "くしゃみ出そう…ふぇ…ふぇ……ﾌｪﾆｯｸｽ！",
		src: "https://i.imgur.com/YD41nIN.png",
		href: "https://w.atwiki.jp/openj3/pages/36.html",
	}),
	new Avatar({
		id: 202,
		name: "やきう民",
		description: "やきうのお兄ちゃん",
		src: "https://i.imgur.com/YRalmKn.png",
		href: "https://w.atwiki.jp/openj3/pages/48.html",
	}),
	new Avatar({
		id: 203,
		name: "原住民",
		description: "(´・ω・｀)",
		src: "https://i.imgur.com/0I95OfI.png",
		href: "https://w.atwiki.jp/openj3/pages/170.html",
	}),
	new Avatar({
		id: 204,
		name: "🥺ぷゆゆ",
		description: "または赤ガイ",
		src: "https://i.imgur.com/bhAEuMf.png",
		href: "https://w.atwiki.jp/openj3/pages/464.html",
	}),
	new Avatar({
		id: 205,
		name: "おんJマン",
		description: "おんJのマスコットキャラクター",
		src: "https://pub-d049c945dab44db6b75372fdf9cb8401.r2.dev/a670d724.png",
		href: "https://w.atwiki.jp/openj3/pages/26.html",
	}),
	new Avatar({
		id: 206,
		name: "おんちゃん",
		description: "(o'ω'n)",
		src: "https://i.imgur.com/cDxzdE2.png",
		href: "https://w.atwiki.jp/openj3/pages/31.html",
	}),
	new Avatar({
		id: 207,
		name: "ミニワイ",
		description: "ミニワイ(9cm)「もきゅっ！」←お前らに飼われにきた",
		src: "https://i.imgur.com/Sb9a15t.png",
		href: "https://hayabusa.open2ch.net/test/read.cgi/livejupiter/1747923319/l50",
	}),
	new Avatar({
		id: 208,
		name: "ミャウミャウ",
		description: "おんJを侵略するぷ！",
		src: "https://pub-d049c945dab44db6b75372fdf9cb8401.r2.dev/33708f60.png",
		href: "https://w.atwiki.jp/openj3/pages/667.html",
	}),
	new Avatar({
		id: 209,
		name: "にぃちぇ",
		description: "あ！今日日曜日だニィ！",
		src: "https://i.imgur.com/84csWAs.png",
		href: "https://w.atwiki.jp/openj3/pages/46.html",
	}),
	new Avatar({
		id: 210,
		name: "ムッジェ",
		description: "ホゲェ",
		src: "https://i.imgur.com/nctHZ66.png",
		href: "https://w.atwiki.jp/openj3/pages/105.html",
	}),
];

// https://duno.jp/articles/free-icons
// copy([...document.querySelectorAll(".icon-single")].map(v=>({name:v.innerText,src:v.querySelector("a").href})))

const touhouList = [
	{
		name: "霊夢",
		fullName: "博麗霊夢",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th000-000101.png",
		description: "楽園の素敵な巫女",
	},
	{
		name: "魔理沙",
		fullName: "霧雨魔理沙",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th000-000201.png",
		description: "普通の魔法使い",
	},
	{
		name: "ルーミア",
		fullName: "ルーミア",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th060-010101.png",
		description: "宵闇の妖怪",
	},
	{
		name: "チルノ",
		fullName: "チルノ",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th060-020201.png",
		description: "湖上の氷精",
	},
	{
		name: "美鈴",
		fullName: "紅美鈴",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th060-030101.png",
		description: "華人小娘",
	},
	{
		name: "パチュリー",
		fullName: "パチュリー・ノーレッジ",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th060-040201.png",
		description: "動かない大図書館",
	},
	{
		name: "咲夜",
		fullName: "十六夜咲夜",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th060-050101.png",
		description: "完全で瀟洒なメイド",
	},
	{
		name: "レミリア",
		fullName: "レミリア・スカーレット",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th060-060101.png",
		description: "永遠に紅い幼き月",
	},
	{
		name: "フラン",
		fullName: "フランドール・スカーレット",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th060-070101.png",
		description: "悪魔の妹",
	},
	{
		name: "橙",
		fullName: "橙",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th070-020101.png",
		description: "すきま妖怪の式",
	},
	{
		name: "アリス",
		fullName: "アリス・マーガトロイド",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th070-030101.png",
		description: "七色の人形遣い",
	},
	{
		name: "妖夢",
		fullName: "魂魄妖夢",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th070-050101.png",
		description: "半分幻の庭師",
	},
	{
		name: "幽々子",
		fullName: "西行寺幽々子",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th070-060101.png",
		description: "幽冥楼閣の亡霊少女",
	},
	{
		name: "藍",
		fullName: "八雲藍",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th070-070101.png",
		description: "すきま妖怪の式",
	},
	{
		name: "紫",
		fullName: "八雲紫",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th070-080101.png",
		description: "境界の妖怪",
	},
	{
		name: "鈴仙",
		fullName: "鈴仙・優曇華院・イナバ",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th080-050201.png",
		description: "狂気の月の兎",
	},
	{
		name: "妹紅",
		fullName: "藤原妹紅",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th080-070101.png",
		description: "蓬莱の人の形",
	},
	{
		name: "文",
		fullName: "射命丸文",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th090-000101.png",
		description: "伝統の幻想ブン屋",
	},
	{
		name: "映姫",
		fullName: "四季映姫・ヤマザナドゥ",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th090-000501.png",
		description: "楽園の最高裁判長",
	},
	{
		name: "早苗",
		fullName: "東風谷早苗",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th100-050101.png",
		description: "祀られる風の人間",
	},
	{
		name: "諏訪子",
		fullName: "洩矢諏訪子",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th100-070101.png",
		description: "土着神の頂点",
	},
	{
		name: "天子",
		fullName: "比那名居天子",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th105-000201.png",
		description: "非想非非想天の娘",
	},
	{
		name: "パルスィ",
		fullName: "水橋パルスィ",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th110-020101.png",
		description: "地殻の下の嫉妬心",
	},
	{
		name: "さとり",
		fullName: "古明地さとり",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th110-040101.png",
		description: "怨霊も恐れ怯む少女",
	},
	{
		name: "お空",
		fullName: "霊烏路空",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th110-060101.png",
		description: "暖かい悩む神の火",
	},
	{
		name: "こいし",
		fullName: "古明地こいし",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th110-070101.png",
		description: "閉じた恋の瞳",
	},
	{
		name: "ナズーリン",
		fullName: "ナズーリン",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th120-010101.png",
		description: "ダウザーの小さな大将",
	},
	{
		name: "小傘",
		fullName: "多々良小傘",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th120-020101.png",
		description: "愉快な忘れ傘",
	},
	{
		name: "ぬえ",
		fullName: "封獣ぬえ",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th120-070101.png",
		description: "虎だったり鳥だったりする奴",
	},
	{
		name: "はたて",
		fullName: "姫海棠はたて",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th125-000101.png",
		description: "今どきの念写記者",
	},
	{
		name: "こころ",
		fullName: "秦こころ",
		src: "https://s3.ap-northeast-1.amazonaws.com/duno.jp/icons/th135-000101.png",
		description: "表情豊かなポーカーフェイス",
	},
];
export const touhouAvatars = touhouList.map(
	(v, i) =>
		new Avatar({
			id: i + 1 + 300,
			name: v.name,
			description: v.description,
			src: v.src,
			href: `https://dic.pixiv.net/a/${encodeURIComponent(v.fullName)}`,
		}),
);

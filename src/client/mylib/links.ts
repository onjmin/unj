import { SiteInfo } from "../../common/request/whitelist/site-info.js";

/* =========================
 * さとる関連（おーぷん / おんJ本流）
 * ========================= */
export const officialLinks = [
	new SiteInfo({
		name: "おんJ",
		description: "やきうはじめり",
		src: "https://hayabusa.open2ch.net/livejupiter/",
	}),
	new SiteInfo({
		name: "おーぷんwiki（仮）",
		description: "ここはおーぷん２ちゃんねるの事を色々と決めるWikiです。",
		src: "https://wiki.open2ch.net/Top",
	}),
	new SiteInfo({
		name: "おんJwiki（3代目）",
		description:
			"おんJwikiは おーぷん２ちゃんねる の なんでも実況J の用語や出来事を解説するwikiです。",
		src: "https://w.atwiki.jp/openj3/",
	}),
	new SiteInfo({
		name: "eピアノ",
		description: "ピアノ演奏を共有できるWebサービス",
		src: "https://epiano.jp/",
	}),
	new SiteInfo({
		name: "ひろゆき村",
		description:
			"「ぺんぎん村」に入りたいけど金がないという人向けの底辺の村です。。",
		src: "https://hiroyuki.net/",
	}),
	new SiteInfo({
		name: "雑談たぬき",
		description: "v系以外の雑談はこちらで。。",
		src: "https://b.2ch2.net/zatsudan/i/",
	}),
	new SiteInfo({
		name: "おんたこ",
		description: "たこ焼き・お好み焼き・その他(仮)＠おーぷん",
		src: "https://ikura.open2ch.net/konamono/",
	}),
];

/* =========================
 * ボカロ制作スレ
 * ========================= */
export const vocaloidLinks = [
	new SiteInfo({
		name: "【公式】束音ロゼ",
		description: "安価でおんJ発のボカロキャラを作ろう",
		src: "https://tabaneroze.ninja-web.net/",
	}),
	new SiteInfo({
		name: "解音ゼロ OFFICIAL SITE TOP",
		description: "ゼロから生まれる無限の歌声",
		src: "https://zero-tokine-test.my.canva.site/",
	}),
	new SiteInfo({
		name: "革命シヨについて",
		description: "重音テトみたいなものが作りたいので安価で設定決める",
		src: "https://kakumeisiyo.1my.jp/",
	}),
];

/* =========================
 * おんJ系掲示板（レンタル・避難所）
 * ========================= */
export const rentalBbsLinks = [
	new SiteInfo({
		name: "おんJ@避難所",
		description: "おんJ@避難所",
		src: "https://jbbs.shitaraba.net/internet/21019/",
	}),
	new SiteInfo({
		name: "おーぷん2ちゃんねるの避難所",
		description: "ここは「誰もが使える」おーぷん2ちゃんねるの避難所です。",
		src: "https://jbbs.shitaraba.net/internet/21634/",
	}),
	new SiteInfo({
		name: "にんG",
		description: "にんにく実況(garlic)",
		src: "https://www.z-z.jp/?livegarlic",
	}),
];

/* =========================
 * おんJ系掲示板（個人開発・自作BBS）
 * ========================= */
export const indieBbsLinks = [
	new SiteInfo({
		name: "なんL",
		description: "掲示板作ったからなんか書き込んでくれ",
		src: "https://openlive.pages.dev/",
	}),
	new SiteInfo({
		name: "なんI",
		description: "掲示板作ったんやが",
		src: "https://openlive2ch.pages.dev/",
	}),
	new SiteInfo({
		name: "ルナエクリプス",
		description: "多機能インターネット掲示板",
		src: "https://hei-bu-jing.onrender.com/",
	}),
	new SiteInfo({
		name: "gemini canvas、なんでも作れる",
		description: "掲示板も作れる模様",
		src: "https://gemini.google.com/share/3a74fb65e8c7",
	}),
	new SiteInfo({
		name: "29(肉)ちゃんねる",
		description:
			"「制限された自由」から「ある程度ある自由」までを手広くカバーする小規模匿名掲示板",
		src: "https://29-channel.iceiy.com/",
	}),
	new SiteInfo({
		name: "KomirkaBBS",
		description: "マイナンバー登録制の匿名掲示板",
		src: "https://www.komirkabbs.com/Threads/2025-06-01T16:50:51.271+09:00/2655c36a-00de-477b-ac1a-1aaa412cdfd9/1",
	}),
	new SiteInfo({
		name: "Hallo おんｊ",
		description: "おんj民でウェブサイト作るぞ",
		src: "https://onj-onj.vercel.app/",
	}),
	new SiteInfo({
		name: "WTAG",
		description: "90年代個人サイト風掲示板",
		src: "https://wtag.noob.jp/",
	}),
	new SiteInfo({
		name: "GABUNOMY",
		description: "意識低い系SNS",
		src: "https://lowawareness.com/",
	}),
	new SiteInfo({
		name: "チラウラリア",
		description: "カネルが作ったサイト",
		src: "https://tirauraria.me/",
	}),
];

/* =========================
 * まとめ・派生メディア
 * ========================= */
export const mediaLinks = [
	new SiteInfo({
		name: "なんJやきう関係ない部@おんJ",
		description:
			"野球に関係ないスレやアニメや漫画、カッスレ、打線組んだスレ、定期ネタなどが多いブログです。",
		src: "https://kankeinai.blog.jp/",
	}),
	new SiteInfo({
		name: "なんまめ",
		description: "主にうんこスレをまとめています。",
		src: "https://nanmame.livedoor.blog/",
	}),
	new SiteInfo({
		name: "さっぱりピーマン",
		description: "中身の無い2ch系まとめブログ",
		src: "https://sapparipiman.com/",
	}),
	new SiteInfo({
		name: "おんじぇいスタジアム＠おんJまとめ",
		description: "全員が執筆者や",
		src: "https://onjstu.livedoor.blog/",
	}),
];

class Playground {
	name;
	description;
	href;
	favicon;
	constructor({
		name,
		description,
		href,
	}: {
		name: string;
		description: string;
		href: string;
	}) {
		this.name = name;
		this.description = description;
		this.href = href;
		this.favicon = `https://www.google.com/s2/favicons?domain=${new URL(href).hostname}`;
	}
}

export const playgrounds = [
	new Playground({
		name: "magma",
		description: "ログイン必須の絵チャ",
		href: "https://magma.com/d/p6my7d2057",
	}),
	new Playground({
		name: "マジドロ",
		description: "絵チャの定番",
		href: "https://draw.kuku.lu/",
	}),
	new Playground({
		name: "ガーティックフォン",
		description: "お絵描き伝言ゲーム",
		href: "https://garticphone.com/ja",
	}),
	new Playground({
		name: "ピクトセンス",
		description: "クイズ形式の絵チャ",
		href: "https://pictsense.com/",
	}),
	new Playground({
		name: "diep.io",
		description: "戦車ゲー",
		href: "https://diep.io/",
	}),
	new Playground({
		name: "taming.io",
		description: "ペット+サバイバルゲーム",
		href: "https://taming.io/",
	}),
	new Playground({
		name: "devast.io",
		description: "サバイバルゲーム",
		href: "https://devast.io/",
	}),
	new Playground({
		name: "survev.io",
		description: "TPSバトロワ",
		href: "https://survev.io/",
	}),
	new Playground({
		name: "ストライカーズ オンライン",
		description: "シンプルな空手のゲーム",
		href: "https://splax.net/game/st.html",
	}),
	new Playground({
		name: "千の英雄と失われた王国",
		description: "コマンドと手描きグラフィックのテキスト型RPG",
		href: "https://abarayagames.com/ryugoroshi/",
	}),
	new Playground({
		name: "板対抗バトロワ",
		description: "まったり戦争",
		href: "https://br2ch.pgw.jp/br2ch/brlist.cgi",
	}),
	new Playground({
		name: "Bandit.RIP",
		description: "スマブラ風の格ゲー",
		href: "https://bandit.rip/",
	}),
	new Playground({
		name: "忍者パルクール",
		description: "忍者版オンリーアップ",
		href: "https://www.crazygames.com/game/ninja-parkour-multiplayer",
	}),
];

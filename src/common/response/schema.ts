export type HeadlineThread = {
	// 書き込み内容
	ccUserId: string;
	// メタ情報
	id: string;
	latestRes: string;
	latestResAt: Date;
	resCount: number;
	// 基本的な情報
	title: string;
	// unj-reze発スレは title が空。一覧で見出し代わりに本文を出すためのフォールバック用。
	contentText: string;
	boardId: number;
	// 動的なデータ
	online: number;
	ikioi: number;
	lolCount: number;
	goodCount: number;
	badCount: number;
};

export type SearchResult = {
	// 書き込み内容
	ccUserId: string;
	contentText: string;
	contentUrl: string;
	// メタ情報
	resNum: number;
	createdAt: Date;
	threadId: string;
	title: string;
	boardId: number;
	resCount: number;
};

export type Res = {
	yours: boolean;
	// 書き込み内容
	ccUserId: string;
	ccUserName: string;
	ccUserAvatar: number;
	contentText: string;
	contentUrl: string;
	contentType: number;
	contentData: string;
	commandResult: string;
	// unj-reze由来のアニメ/歩行グラ投稿。contentUrlがスプライトシートのときだけ入る
	animFrames: number | null;
	animFps: number | null;
	walkPreset: string | null;
	// メタ情報
	num: number;
	createdAt: Date;
	isOwner: boolean;
	sage: boolean;
	// unj-reze由来の返信関係。res.parent_num（DBの実カラム）をそのまま渡す。
	// 1（スレ1番=OP）またはnullのときは通常のBBS書き込みと区別しない。
	parentNum: number | null;
};

export type Thread = {
	yours: boolean;
	// 書き込み内容
	ccUserId: string;
	ccUserName: string;
	ccUserAvatar: number;
	contentText: string;
	contentUrl: string;
	contentType: number;
	contentData: string;
	// unj-reze由来のアニメ/歩行グラ投稿。contentUrlがスプライトシートのときだけ入る
	animFrames: number | null;
	animFps: number | null;
	walkPreset: string | null;
	// メタ情報
	id: string;
	createdAt: Date;
	resList: Res[];
	// 基本的な情報
	title: string;
	boardId: number;
	// 高度な設定
	varsan: boolean;
	sage: boolean;
	ccBitmask: number;
	contentTypesBitmask: number;
	resLimit: number;
	deletedAt: Date | null;
	// 動的なデータ
	resCount: number;
	ps: string;
	ageResNum: number;
	ageRes: Res | null;
	balsResNum: number;
	lolCount: number;
	goodCount: number;
	badCount: number;
};

export type Meta = {
	// 高度な設定
	varsan: boolean;
	sage: boolean;
	ccBitmask: number;
	contentTypesBitmask: number;
	// 動的なデータ
	ps: string;
	ageResNum: number;
	ageRes: Res | null;
	balsResNum: number;
};

export type Ninja = {
	pokemon: number;
	score: number;
};

export type Player = {
	userId: string;
	sAnimsId: number;
	msg: string;
	x: number;
	y: number;
	direction: number;
	updatedAt: Date;
};

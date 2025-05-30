export type HeadlineThread = {
	// 書き込み内容
	ccUserId: string;
	// メタ情報
	id: string;
	latestRes: string;
	latestResAt: Date;
	resCount: number;
	latestCursor: string;
	// 基本的な情報
	title: string;
	// 動的なデータ
	online: number;
	ikioi: number;
	lolCount: number;
	goodCount: number;
	badCount: number;
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
	commandResult: string;
	// メタ情報
	cursor: string;
	num: number;
	createdAt: Date;
	isOwner: boolean;
	sage: boolean;
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
	// メタ情報
	id: string;
	firstCursor: string;
	latestCursor: string;
	desc: boolean;
	createdAt: Date;
	resList: Res[];
	// 基本的な情報
	title: string;
	threadType: number;
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

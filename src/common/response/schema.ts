export type HeadlineThread = {
	// 書き込み内容
	ccUserId: string;
	// メタ情報
	id: string;
	latestResAt: Date;
	resCount: number;
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
	// 書き込み内容
	ccUserId: string;
	ccUserName: string;
	ccUserAvatar: number;
	content: string;
	contentUrl: string;
	contentType: number;
	// メタ情報
	id: string;
	num: number;
	isOwner: boolean;
	createdAt: Date;
};

export type Thread = {
	// 書き込み内容
	ccUserId: string;
	ccUserName: string;
	ccUserAvatar: number;
	content: string;
	contentUrl: string;
	contentType: number;
	// メタ情報
	id: string;
	isOwner: boolean;
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
	ageRes: Res | null;
	lolCount: number;
	goodCount: number;
	badCount: number;
};

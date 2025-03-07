export type HeadlineThread = {
	id: string;
	latestResAt: Date;
	resCount: number;
	title: string;
	userId: string;
	online: number;
	ikioi: number;
	lolCount: number;
	goodCount: number;
	badCount: number;
};

export type Res = {
	isOwner: boolean;
	num: number;
	createdAt: Date;
	ccUserId: string;
	ccUserName: string;
	ccUserAvatar: number;
	content: string;
	contentUrl: string;
	contentType: number;
};

export type Thread = {
	isOwner: boolean;
	id: string;
	latestResAt: Date;
	resCount: number;
	title: string;
	lolCount: number;
	goodCount: number;
	badCount: number;
	resList: Res[];
	deletedAt: Date;
	refThreadId: string;
	ps: string;
	resLimit: number;
	ageResNum: number;
	sage: boolean;
	threadType: number;
	ccType: number;
	contentTypesBitmask: number;
	banned: boolean;
	subbed: boolean;
};

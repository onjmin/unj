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
	ageRes: Res | null;
	ps: string;
	threadType: number;
	varsan: boolean;
	sage: boolean;
	ccBitmask: number;
	contentTypesBitmask: number;
	resLimit: number;
	deletedAt: Date;
};

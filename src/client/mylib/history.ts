export type History = {
	// 書き込み内容
	ccUserId: string;
	contentText: string;
	contentUrl: string;
	// メタ情報
	resNum: number;
	createdAt: Date;
	threadId: string;
	title: string;
	resCount: number;
};

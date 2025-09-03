export type Misskey = {
	misskeyId: string;
	hostname: string;
	title: string;
	api: string;
};

/**
 * Misskeyの情報を取得する関数
 */
export const findMisskey = (misskeyId: string) => {
	return misskeyList.find((item) => item.misskeyId === misskeyId);
};

export const misskeyList: Misskey[] = [
	{
		misskeyId: "inmusky",
		hostname: "inmusky.net",
		title: "いんむすきー",
		api: "https://inmusky.net/api/notes/local-timeline",
	},
	{
		misskeyId: "nukumori",
		hostname: "misskey.nukumori-sky.net",
		title: "ぬくもりすきー（Nukumori-Sky）",
		api: "https://misskey.nukumori-sky.net/api/notes/local-timeline",
	},
];

/**
 * Misskeyのタイムラインを取得する関数
 */
export const fetchMisskeyTimeline = (
	url: string,
	limit = 1,
	untilId?: string,
) => {
	const controller = new AbortController();
	const signal = controller.signal;

	const promise = fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			limit,
			untilId,
		}),
		signal,
	})
		.then((res) => (res.ok ? res.json() : []))
		.then((json) => (Array.isArray(json) ? (json as Note[]) : []))
		.catch(() => []);

	return {
		controller,
		promise,
	};
};

export interface User {
	id: string;
	name: string | null;
	username: string;
	host: string | null;
	avatarUrl: string;
	avatarBlurhash: string | null;
	avatarDecorations: unknown[]; // 構造が不明なため unknown[]
	isBot: boolean;
	isCat: boolean;
	emojis: Record<string, unknown>;
	onlineStatus: string;
	badgeRoles: unknown[];
}

// 画像などのファイルプロパティの型
export interface FileProperties {
	width: number;
	height: number;
}

// ファイル自体の型
export interface File {
	id: string;
	createdAt: string;
	name: string;
	type: string;
	md5: string;
	size: number;
	isSensitive: boolean;
	blurhash: string | null;
	properties: FileProperties;
	url: string;
	thumbnailUrl: string;
	comment: string | null;
	folderId: string | null;
	folder: unknown | null; // 構造が不明なため unknown
	userId: string;
	user: User | null; // userはnullになる可能性がある
}

export interface Note {
	id: string;
	createdAt: string;
	userId: string;
	user: User;
	text: string | null;
	cw: string | null;
	visibility: string;
	localOnly: boolean;
	reactionAcceptance: string | null;
	renoteCount: number;
	repliesCount: number;
	reactionCount: number;
	reactions: Record<string, number>;
	reactionEmojis: Record<string, unknown>;
	fileIds: string[]; // ファイルIDの配列なので string[] に変更
	files: File[]; // 画像データを含むため、新しく定義した File[] に変更
	replyId: string | null;
	renoteId: string | null;
	clippedCount: number;
	isHidden?: boolean;
}

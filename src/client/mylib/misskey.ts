export type Misskey = {
	misskeyId: string;
	hostname: string;
	title: string;
	channelId?: string;
};

/**
 * Misskeyの情報を取得する関数
 */
export const findMisskey = (boardKey: string, misskeyId: string) => {
	return misskeyList
		.get(boardKey)
		?.find((item) => item.misskeyId === misskeyId);
};

export const misskeyList: Map<string, Misskey[]> = new Map();

misskeyList.set("unj", [
	{
		misskeyId: "nukumori",
		hostname: "misskey.nukumori-sky.net",
		title: "ぬくもりすきー",
	},
]);

misskeyList.set("roze", [
	{
		misskeyId: "roze",
		hostname: "nijimiss.moe",
		title: "にじみすUTAU部",
		channelId: "01H17XY90GPQTSP2X1QPXRS1JB",
	},
]);

/**
 * Misskeyのタイムラインを取得する関数
 */
export const fetchMisskeyTimeline = (
	misskey: Misskey,
	limit = 1,
	untilId?: string,
) => {
	const controller = new AbortController();
	const signal = controller.signal;

	const isChannelsTimeline = "channelId" in misskey;
	const url = isChannelsTimeline
		? `https://${misskey.hostname}/api/channels/timeline`
		: `https://${misskey.hostname}/api/notes/local-timeline`;

	const promise = fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			limit,
			untilId,
			...(isChannelsTimeline ? { channelId: misskey.channelId } : {}),
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

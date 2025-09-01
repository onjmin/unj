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
];

/**
 * Misskeyのタイムラインを取得する関数
 */
export const fetchMisskeyTimeline = (url: string, limit = 1) => {
	const controller = new AbortController();
	const signal = controller.signal;

	const promise = fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ limit }),
		signal: signal,
	})
		.then((res) => res.json())
		.then((json) => (Array.isArray(json) ? (json as Timeline) : []))
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
	avatarDecorations: unknown[]; // 中身の構造が不明なため unknown[]
	isBot: boolean;
	isCat: boolean;
	emojis: Record<string, unknown>; // キーが変動するため Record を使用
	onlineStatus: string;
	badgeRoles: unknown[]; // 中身の構造が不明なため unknown[]
}

export interface Note {
	id: string;
	createdAt: string; // ISO 8601形式の文字列
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
	reactions: Record<string, number>; // キーが変動するため Record を使用
	reactionEmojis: Record<string, unknown>; // キーが変動するため Record を使用
	fileIds: unknown[]; // 中身の構造が不明なため unknown[]
	files: unknown[]; // 中身の構造が不明なため unknown[]
	replyId: string | null;
	renoteId: string | null;
	clippedCount: number;
}

export type Timeline = Note[];

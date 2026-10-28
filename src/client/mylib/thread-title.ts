/**
 * unj-reze発スレは title が空（unj-reze側 lib/db/pg.ts createPost 参照）。
 * 見出しが空欄や「無題」にならないよう、その場合だけ本文1行目を代わりに出す。
 */
export const threadTitleOf = (title: string, contentText: string): string => {
	if (title) return title;
	const line = (contentText || "").split(/\r\n|\r|\n/)[0]?.trim() ?? "";
	return line.length > 32 ? `${line.slice(0, 32)}…` : line || "無題";
};

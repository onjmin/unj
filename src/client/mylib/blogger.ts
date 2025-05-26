import { format } from "date-fns";
import { ja } from "date-fns/locale";

export type BloggerItem = {
	id: string;
	title: string;
	published: string;
	labels: string[];
	content: string;
};

export const formatDate = (date: string): string =>
	format(new Date(date), "MM月dd日", { locale: ja });

export const label2icon = new Map([
	["新機能", "update"],
	["脆弱性", "security"],
	["技術", "code"],
	["バグ", "bug_report"],
]);

import { BugIcon, CodeIcon, ShieldHalfIcon, ZapIcon } from "@lucide/svelte";
import { format, parseISO, isValid } from "date-fns";
import { ja } from "date-fns/locale";

export type BloggerItem = {
	id: string;
	title: string;
	published: string;
	labels: string[];
	content: string;
};

const safeFormat = (date: string, fmt: string): string => {
	const d = parseISO(date);
	if (!isValid(d)) return "";
	return format(d, fmt, { locale: ja });
};

/** yyyy年MM月dd日 */
export const formatDateYMD = (date: string): string =>
	safeFormat(date, "yyyy年MM月dd日");

/** MM月dd日 */
export const formatDateMD = (date: string): string =>
	safeFormat(date, "MM月dd日");

export const getLabelIconComponent = (label: string) => {
	if (label === "新機能") {
		return ZapIcon;
	}
	if (label === "脆弱性") {
		return ShieldHalfIcon;
	}
	if (label === "技術") {
		return CodeIcon;
	}
	if (label === "バグ") {
		return BugIcon;
	}
	return null;
};

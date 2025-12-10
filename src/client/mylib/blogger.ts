import { BugIcon, CodeIcon, ShieldHalfIcon, ZapIcon } from "@lucide/svelte";
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

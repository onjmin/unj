export class SiteInfo {
	id;
	name;
	description;
	href;
	hostnames;
	favicon;
	constructor({
		id, // フロントで使う
		name, // 表示用のラベル
		description, // 一言説明
		href, // URLテンプレ機能の対象
		hostnames, // href以外の許容ホスト名
	}: {
		id?: number;
		name: string;
		description: string;
		href: string;
		hostnames?: string[];
	}) {
		this.id = id ?? 0;
		this.name = name;
		this.description = description;
		this.href = href;
		const hostname = new URL(this.href).hostname;
		this.favicon = `https://www.google.com/s2/favicons?domain=${hostname}`;
		this.hostnames = new Set(hostnames ?? []);
		this.hostnames.add(hostname);
	}
}

export const findIn = (() => {
	const map: Map<SiteInfo[], Map<string, SiteInfo>> = new Map();
	return (arr: SiteInfo[], hostname: string): SiteInfo | null => {
		if (!map.has(arr)) {
			const m: Map<string, SiteInfo> = new Map();
			for (const siteInfo of arr) {
				for (const hostname of siteInfo.hostnames) {
					m.set(hostname, siteInfo);
				}
			}
			map.set(arr, m);
		}
		return map.get(arr)?.get(hostname) ?? null;
	};
})();

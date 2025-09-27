export class SiteInfo {
	readonly id;
	readonly name;
	readonly description;
	readonly src;
	readonly hostnames;
	readonly favicon;
	readonly href;
	constructor({
		id, // フロントで使う
		name, // 表示用のラベル
		description, // 一言説明
		src, // 実際に使われるURL
		hostnames, // src以外の許容ホスト名
		href, // 選択UIから飛べるリンク先
	}: {
		id?: number;
		name: string;
		description: string;
		src: string;
		hostnames?: string[];
		href?: string;
	}) {
		this.id = id ?? 0;
		this.name = name;
		this.description = description;
		this.src = src;
		const hostname = new URL(src).hostname;
		this.favicon = `https://www.google.com/s2/favicons?domain=${hostname}`;
		this.hostnames = new Set(hostnames ?? []);
		this.hostnames.add(hostname);
		this.href = href ?? src;
	}
}

export const findIn = (() => {
	const map: Map<SiteInfo[], Map<string, SiteInfo>> = new Map();
	const wildcard: Map<SiteInfo[], Map<string, SiteInfo>> = new Map();
	return (arr: SiteInfo[], hostname: string): SiteInfo | null => {
		if (!map.has(arr)) {
			const m: Map<string, SiteInfo> = new Map();
			const w: Map<string, SiteInfo> = new Map();
			for (const siteInfo of arr) {
				for (const hostname of siteInfo.hostnames) {
					if (hostname.startsWith("*")) {
						w.set(hostname, siteInfo);
					} else {
						m.set(hostname, siteInfo);
					}
				}
			}
			map.set(arr, m);
			wildcard.set(arr, w);
		}
		for (const [k, v] of wildcard.get(arr) ?? []) {
			if (hostname.endsWith(k.slice(1))) {
				return v;
			}
		}
		return map.get(arr)?.get(hostname) ?? null;
	};
})();

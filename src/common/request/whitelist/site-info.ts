export class SiteInfo {
	name;
	description;
	href;
	hostnames;
	favicon;
	constructor({
		name,
		description,
		href, // URLテンプレ機能の対象
		hostnames, // href以外の許容ホスト名
	}: {
		name: string;
		description: string;
		href: string;
		hostnames?: string[];
	}) {
		this.name = name;
		this.description = description;
		this.href = href;
		const hostname = new URL(this.href).hostname;
		this.favicon = `https://www.google.com/s2/favicons?domain=${hostname}`;
		this.hostnames = new Set(hostnames ?? []);
		this.hostnames.add(hostname);
	}
}

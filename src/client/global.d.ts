declare module "svelte-portal" {
	import Portal from "svelte-portal";
	export default Portal;
}

interface Window {
	twttr?: {
		widgets?: {
			load: (el?: HTMLElement) => void;
			createTweet?: (...args: unknown[]) => void;
		};
		ready?: (callback: (twttr: unknown) => void) => void;
		_e?: Array<() => void>;
	};
}

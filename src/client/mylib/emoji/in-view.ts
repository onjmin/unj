/**
 * 共有 IntersectionObserver による「画面内かどうか」の監視。
 *
 * アニメ絵文字(.gif)は表示されている限りデコードされ続けるため、
 * スレ閲覧時に画面外の大量の GIF がCPUを食い続ける。
 * 画面内に入ったときだけアニメ版に切り替えるための仕組み。
 *
 * 監視対象ごとに Observer を作るとコストが高いので、単一の
 * IntersectionObserver を共有し、要素 → コールバックの対応で配信する。
 */
const callbacks = new WeakMap<Element, (inView: boolean) => void>();

let observer: IntersectionObserver | null = null;
const getObserver = (): IntersectionObserver | null => {
	if (typeof IntersectionObserver === "undefined") return null;
	if (observer) return observer;
	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				callbacks.get(entry.target)?.(entry.isIntersecting);
			}
		},
		// 画面手前で先読みして切り替え、出入りのチラつきを抑える
		{ rootMargin: "100px" },
	);
	return observer;
};

type InViewParams = {
	/** false のときは監視せず、何もしない（静止画のみの絵文字向け） */
	enabled: boolean;
	onChange: (inView: boolean) => void;
};

/**
 * Svelte action: 要素が画面内に入った／出たを通知する。
 * IntersectionObserver 非対応環境では常に「画面内」として扱う。
 */
export const inView = (node: HTMLElement, params: InViewParams) => {
	if (!params.enabled) return {};
	const io = getObserver();
	if (!io) {
		params.onChange(true);
		return {};
	}
	callbacks.set(node, params.onChange);
	io.observe(node);
	return {
		destroy() {
			io.unobserve(node);
			callbacks.delete(node);
		},
	};
};

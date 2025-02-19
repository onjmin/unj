/**
 * 要素が視界に入ったことを判定するやつ
 */
export function visible(
	node: HTMLElement,
	callback: (visible: boolean) => void,
) {
	const observer = new IntersectionObserver(
		([entry]) => callback(entry.isIntersecting),
		{ threshold: 0.1 },
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
	};
}

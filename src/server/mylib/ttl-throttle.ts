/**
 * キー単位で間引く（先頭は即時、以降はinterval毎に最後の1回だけ実行）
 *
 * join往復などで同じroomへの通知が増幅しないようにする用途。
 * 実行する処理は送る直前に最新の状態を読むように書くこと。
 */
export const createThrottle = (interval: number) => {
	// key → 次の区切りで実行する処理（なければnull）
	const pending: Map<string, (() => void) | null> = new Map();
	const flush = (key: string) => {
		const fn = pending.get(key);
		if (!fn) {
			pending.delete(key);
			return;
		}
		pending.set(key, null);
		setTimeout(() => flush(key), interval); // fnが例外を投げても詰まらないよう先に予約
		fn();
	};
	return (key: string, fn: () => void) => {
		if (pending.has(key)) {
			pending.set(key, fn);
			return;
		}
		pending.set(key, null);
		setTimeout(() => flush(key), interval);
		fn();
	};
};

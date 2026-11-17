/**
 * 編集中のまま、タブを閉じる・再読み込みする・外のサイトへ移るときに
 * ブラウザの「このサイトを離れますか？」を出す。
 *
 * お絵描き・MML・暗号化の入力など、消えると困るエディタが開いている間だけ有効にする。
 * 同じページに複数のエディタがあってもよいように、使っている数を数えて、
 * 0 になったら確認を出さないようにする。
 *
 * 注意: svelte-routing のページ内の移動では beforeunload は起きない。
 *
 * 使い方（Svelte 5）:
 *   $effect(() => {
 *     if (!dirty) return;
 *     return guardLeave();
 *   });
 */
let count = 0;

const onBeforeUnload = (e: BeforeUnloadEvent) => {
	e.preventDefault();
	// 古いブラウザ（Chrome 119 以前など）は returnValue が要る
	e.returnValue = "";
};

/**
 * 離脱の確認を有効にし、解除する関数を返す。解除は何度呼んでも1回分だけ。
 */
export const guardLeave = (): (() => void) => {
	if (count === 0) window.addEventListener("beforeunload", onBeforeUnload);
	count++;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		count--;
		if (count === 0) window.removeEventListener("beforeunload", onBeforeUnload);
	};
};

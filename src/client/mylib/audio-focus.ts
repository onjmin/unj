/**
 * 同一ページ内で複数のコード進行プレイヤー（ChordPlayerPart）が同時に
 * 再生されないようにするための、モジュールスコープの単純な排他制御。
 *
 * unj-reze側（lib/audio-focus-context.tsx）と同じ「後勝ち＝新しく再生し始めた方が勝ち、
 * 古い方は止める」方式。Reactと違いページ全体でSvelteコンポーネントツリーの
 * 共通の祖先を挟む必要が無いので、Contextではなくモジュール変数で十分。
 */
let active: { id: symbol; stop: () => void } | null = null;

export function requestAudioFocus(id: symbol, stop: () => void): void {
	if (active && active.id !== id) {
		active.stop();
	}
	active = { id, stop };
}

export function releaseAudioFocus(id: symbol): void {
	if (active?.id === id) {
		active = null;
	}
}

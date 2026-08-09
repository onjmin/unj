/**
 * サイト全体（MML投稿・コード進行・YouTube・SoundCloud・その他埋め込み）で
 * 音声/動画が同時に再生されないようにするための、モジュールスコープの排他制御（オーディオフォーカス）。
 *
 * 「後勝ち＝新しく再生し始めた方が勝ち、古い方は止める」方式。
 */
type FocusId = symbol | string | object;

let active: { id: FocusId; stop: () => void } | null = null;

export function requestAudioFocus(id: FocusId, stop: () => void): void {
	if (active && active.id !== id) {
		try {
			active.stop();
		} catch (e) {
			console.error("[audio-focus] Error stopping previous playback", e);
		}
	}
	active = { id, stop };
}

export function releaseAudioFocus(id: FocusId): void {
	if (active?.id === id) {
		active = null;
	}
}

export function clearAudioFocus(): void {
	if (active) {
		try {
			active.stop();
		} catch (e) {
			console.error("[audio-focus] Error stopping active playback", e);
		}
		active = null;
	}
}

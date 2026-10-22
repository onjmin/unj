<script lang="ts">
  import type { ChordPlayerInstance } from "@onjmin/dtm";
  import { onMount } from "svelte";
  import { getStudio } from "../mylib/dtm.js";
  import { releaseAudioFocus, requestAudioFocus } from "../mylib/audio-focus.js";
  import { inView } from "../mylib/emoji/in-view.js";

  // コード進行はDTMのMMLと違い短文なので、contentTextにそのまま入っている。
  // R2への取得待ちが無い分、DtmPlayerPartよりシンプル。
  let { chords = "" }: { chords: string } = $props();

  let container: HTMLDivElement;
  let error = $state("");
  const focusId = Symbol("chord-player");

  // DtmPlayerPart と同じく、画面に近づいたレスだけプレイヤーを作る（作ったら壊さない）。
  let started = false;
  let mounted = $state(false);

  let inst: ChordPlayerInstance | null = null;
  let disposed = false;
  let poll: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    // サイト全体の音量（読者の好み）は getStudio() 内で studio.setMasterVolume() に
    // 一本化済み（studio.masterGain、全プレイヤー共有の出力段）なので、ここでは volume を
    // 指定しない。個別に適用すると studio.masterGain と二重に掛かってしまう。
    getStudio()
      .then((studio) => {
        if (disposed) return;
        inst = studio.mountChordPlayer(container, chords, {
          onStop: () => releaseAudioFocus(focusId),
        });
        mounted = true;
        // 同じページに複数のコード進行埋め込みがあると、片方の再生ボタンを
        // 押しても他方が鳴りっぱなしになる（排他制御が無かった）のを防ぐ。
        // isPlaying()のfalse→true遷移をポーリングして拾い、後から鳴らした方が
        // 前の再生を止める（後勝ち）。
        let wasPlaying = false;
        poll = setInterval(() => {
          const playing = !!inst?.isPlaying();
          if (playing && !wasPlaying) {
            requestAudioFocus(focusId, () => inst?.stop());
          } else if (!playing && wasPlaying) {
            releaseAudioFocus(focusId);
          }
          wasPlaying = playing;
        }, 200);
      })
      .catch((e) => {
        if (disposed) return;
        console.error("[chord] Failed to mount ChordPlayer", e);
        error = "コード進行の読み込みに失敗しました";
      });
  };

  onMount(() => {
    return () => {
      disposed = true;
      if (poll) clearInterval(poll);
      inst?.destroy();
      inst = null;
      releaseAudioFocus(focusId);
    };
  });
</script>

<div
  bind:this={container}
  class:min-h-12={!mounted}
  use:inView={{
    enabled: true,
    onChange: (v) => {
      if (!v || started) return;
      started = true;
      start();
    },
  }}
></div>
{#if error}
  <div class="text-red-500 text-sm">{error}</div>
{/if}

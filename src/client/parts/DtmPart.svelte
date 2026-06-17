<script lang="ts">
  import { type DawInstance, injectStyles, mountDAW } from "@onjmin/dtm";
  import { onMount } from "svelte";
  import { getAudio, playDrum, playNote, resumeAudio } from "../mylib/dtm.js";

  let { contentText = $bindable("") }: { contentText: string } = $props();

  let container: HTMLDivElement;
  let daw: DawInstance | null = null;
  let mmlLength = $state(contentText.length);

  onMount(() => {
    injectStyles();
    const { ctx } = getAudio();
    daw = mountDAW(container, {
      getAudioTime: () => ctx.currentTime,
      onResumeAudio: () => resumeAudio(),
      onPlayNote: playNote,
      onPlayDrum: playDrum,
      initialMML: contentText || undefined,
    });

    // ライブラリにMML変更イベントが無いため、生成MMLをポーリングで本文へ同期する。
    const pollId = setInterval(() => {
      const mml = daw?.getMML().minified ?? "";
      mmlLength = mml.length;
      if (mml !== contentText) contentText = mml;
    }, 500);

    return () => {
      clearInterval(pollId);
      daw?.destroy();
      daw = null;
    };
  });
</script>

<div class="w-full" bind:this={container}></div>

{#if mmlLength > 1024}
  <p class="text-red-500 text-xs mt-1">
    MMLが長すぎます（{mmlLength}/1024）。小節数を減らすか音符を整理してください。
  </p>
{/if}

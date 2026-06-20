<script lang="ts">
  import type { DawInstance } from "@onjmin/dtm";
  import { onMount } from "svelte";
  import { getStudio } from "../mylib/dtm.js";

  let { contentText = $bindable("") }: { contentText: string } = $props();

  let container: HTMLDivElement;
  let daw: DawInstance | null = null;
  let mmlLength = $state(contentText.length);

  onMount(() => {
    let pollId: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    // 共有スタジオ経由でマウントすると、音源・歌声・録音・MIDI・コードが一式そろう。
    // スタイル注入や AudioContext 配線もスタジオ/ライブラリ側が担うため、ここでは不要。
    getStudio().then((studio) => {
      if (disposed) return;
      daw = studio.mountEditor(container, {
        initialMML: contentText || undefined,
      });

      // ライブラリにMML変更イベントが無いため、生成MMLをポーリングで本文へ同期する。
      pollId = setInterval(() => {
        const mml = daw?.getMML().minified ?? "";
        mmlLength = mml.length;
        if (mml !== contentText) contentText = mml;
      }, 500);
    });

    return () => {
      disposed = true;
      if (pollId) clearInterval(pollId);
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

<script lang="ts">
  import type { ChordPlayerInstance } from "@onjmin/dtm";
  import { onMount } from "svelte";
  import { getStudio } from "../mylib/dtm.js";

  // コード進行はDTMのMMLと違い短文なので、contentTextにそのまま入っている。
  // R2への取得待ちが無い分、DtmPlayerPartよりシンプル。
  let { chords = "" }: { chords: string } = $props();

  let container: HTMLDivElement;
  let error = $state("");

  onMount(() => {
    let inst: ChordPlayerInstance | null = null;
    let disposed = false;
    getStudio()
      .then((studio) => {
        if (disposed) return;
        inst = studio.mountChordPlayer(container, chords, { volume: 50 });
      })
      .catch((e) => {
        if (disposed) return;
        console.error("[chord] Failed to mount ChordPlayer", e);
        error = "コード進行の読み込みに失敗しました";
      });
    return () => {
      disposed = true;
      inst?.destroy();
      inst = null;
    };
  });
</script>

<div bind:this={container}></div>
{#if error}
  <div class="text-red-500 text-sm">{error}</div>
{/if}

<script lang="ts">
  import type { MmlPlayerInstance } from "@onjmin/dtm";
  import { onMount } from "svelte";
  import { getStudio } from "../mylib/dtm.js";

  let { mml = "" }: { mml: string } = $props();

  let container: HTMLDivElement;

  onMount(() => {
    let player: MmlPlayerInstance | null = null;
    let disposed = false;
    // 共有スタジオ経由でマウントすると、楽器・ドラム・歌声がすべて鳴る。
    // volume:50 は編集UI（DAW）の既定マスタ音量に合わせる係数。
    getStudio().then((studio) => {
      if (disposed) return;
      player = studio.mountPlayer(container, mml, { volume: 50 });
    });
    return () => {
      disposed = true;
      player?.destroy();
      player = null;
    };
  });
</script>

<div bind:this={container}></div>

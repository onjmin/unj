<script lang="ts">
  import { decodeMml, type MmlPlayerInstance } from "@onjmin/dtm";
  import { onMount } from "svelte";
  import { fetchTextCloudflareR2 } from "../mylib/cloudflare-r2.js";
  import { getStudio } from "../mylib/dtm.js";

  // contentData はR2のURL。MML本文はレス一覧には載らないので、ここで取りに行く。
  // 表示は待たない（<img> と同じで、鳴らす直前に解決すればよい）。
  let { src = "" }: { src: string } = $props();

  let container: HTMLDivElement;
  let error = $state("");

  onMount(() => {
    let player: MmlPlayerInstance | null = null;
    let disposed = false;
    // 共有スタジオ経由でマウントすると、楽器・ドラム・歌声がすべて鳴る。
    // volume:50 は編集UI（DAW）の既定マスタ音量に合わせる係数。
    // スタジオのロードとMMLの取得は独立なので並行させる。
    Promise.all([getStudio(), fetchTextCloudflareR2(src)])
      .then(async ([studio, encoded]) => {
        if (disposed) return;
        const rawMml = await decodeMml(encoded);
        if (disposed) return;
        player = studio.mountPlayer(container, rawMml, { volume: 50 });
      })
      .catch((e) => {
        if (disposed) return;
        console.error("[dtm] Failed to load MML", e);
        error = "MMLの読み込みに失敗しました";
      });
    return () => {
      disposed = true;
      player?.destroy();
      player = null;
    };
  });
</script>

<div bind:this={container}></div>
{#if error}
  <div class="text-red-500 text-sm">{error}</div>
{/if}

<script lang="ts">
  import {
    decodeMml,
    encodeMml,
    type DtmStudio,
    type ModeSwitchInstance,
  } from "@onjmin/dtm";
  import { onMount } from "svelte";
  import { getStudio } from "../mylib/dtm.js";

  let { contentData = $bindable("") }: { contentData: string } = $props();

  let container: HTMLDivElement;
  let mmlLength = $state(contentData.length);

  let studio: DtmStudio | null = null;
  let modeSwitch: ModeSwitchInstance | null = null;
  let pollId: ReturnType<typeof setInterval> | null = null;
  let disposed = false;

  let currentRawMml = "";
  let encoding = false;
  let pendingRawMml: string | null = null;

  async function updateCompressedMml(rawMml: string) {
    if (encoding) {
      pendingRawMml = rawMml;
      return;
    }
    encoding = true;
    try {
      const compressed = await encodeMml(rawMml);
      if (disposed) return;
      contentData = compressed;
      mmlLength = compressed.length;
    } catch (e) {
      console.error("[dtm] Failed to encode MML", e);
    } finally {
      encoding = false;
      if (pendingRawMml !== null) {
        const next = pendingRawMml;
        pendingRawMml = null;
        if (next !== currentRawMml) {
          currentRawMml = next;
          updateCompressedMml(next);
        }
      }
    }
  }

  onMount(() => {
    getStudio().then(async (s) => {
      if (disposed) return;
      studio = s;

      const rawMml = await decodeMml(contentData);
      if (disposed) return;
      currentRawMml = rawMml;

      modeSwitch = studio.mountModeSwitch(container, {
        editorTarget: container,
        mode: "simple",
        position: "prepend",
        editorOptions: {
          initialMML: rawMml || undefined,
        },
        onMount: (dawInstance) => {
          pollId = setInterval(() => {
            const mml = dawInstance.getMML().minified ?? "";
            if (mml !== currentRawMml) {
              currentRawMml = mml;
              updateCompressedMml(mml);
            }
          }, 500);
        },
        onUnmount: () => {
          if (pollId) clearInterval(pollId);
          pollId = null;
        },
      });
    });

    return () => {
      disposed = true;
      if (pollId) clearInterval(pollId);
      modeSwitch?.destroy();
      modeSwitch = null;
    };
  });
</script>

<div class="w-full" bind:this={container}></div>

{#if mmlLength > 5000}
  <p class="text-red-500 text-xs mt-1">
    MMLが長すぎます（{mmlLength}/5000）。小節数を減らすか音符を整理してください。
  </p>
{/if}

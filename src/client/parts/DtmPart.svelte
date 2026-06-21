<script lang="ts">
  import {
    type DawInstance,
    type DawMode,
    type DtmStudio,
    type ModeSwitchInstance,
  } from "@onjmin/dtm";
  import { onMount } from "svelte";
  import { getStudio } from "../mylib/dtm.js";

  let { contentText = $bindable("") }: { contentText: string } = $props();

  let container: HTMLDivElement;
  let mmlLength = $state(contentText.length);

  let studio: DtmStudio | null = null;
  let modeSwitch: ModeSwitchInstance | null = null;
  let pollId: ReturnType<typeof setInterval> | null = null;
  let disposed = false;

  onMount(() => {
    getStudio().then((s) => {
      if (disposed) return;
      studio = s;

      modeSwitch = studio.mountModeSwitch(container, {
        editorTarget: container,
        mode: "simple",
        position: "prepend",
        editorOptions: {
          initialMML: contentText || undefined,
        },
        onMount: (dawInstance) => {
          pollId = setInterval(() => {
            const mml = dawInstance.getMML().minified ?? "";
            mmlLength = mml.length;
            if (mml !== contentText) contentText = mml;
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

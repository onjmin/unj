<script lang="ts">
  import type { Sequencer } from "@onjmin/dtm";
  import { PlayIcon, SquareIcon } from "@lucide/svelte";
  import { onDestroy } from "svelte";
  import { createMmlSequencer, resumeAudio } from "../mylib/dtm.js";

  let { mml = "" }: { mml: string } = $props();

  let playing = $state(false);
  let seq: Sequencer | null = null;

  const stop = () => {
    seq?.stop();
    seq = null;
    playing = false;
  };

  const toggle = async () => {
    if (playing) {
      stop();
      return;
    }
    await resumeAudio();
    seq = createMmlSequencer(mml, () => {
      seq = null;
      playing = false;
    });
    if (!seq) return;
    seq.start(0);
    playing = true;
  };

  onDestroy(stop);
</script>

<button
  type="button"
  onclick={toggle}
  class="inline-flex items-center gap-1 py-1 px-3 rounded-md text-sm font-medium text-white transition-colors bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
  {#if playing}
    <SquareIcon size={16} /> 停止
  {:else}
    <PlayIcon size={16} /> 再生
  {/if}
</button>

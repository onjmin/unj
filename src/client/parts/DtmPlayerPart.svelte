<script lang="ts">
  import { mountMmlPlayer, type MmlPlayerInstance } from "@onjmin/dtm";
  import { onMount } from "svelte";

  let { mml = "" }: { mml: string } = $props();

  let container: HTMLDivElement;
  let player: MmlPlayerInstance | null = null;

  onMount(() => {
    player = mountMmlPlayer(container, mml, { synth: true });
    return () => {
      player?.destroy();
      player = null;
    };
  });
</script>

<div bind:this={container}></div>

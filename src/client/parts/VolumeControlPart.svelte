<script lang="ts">
  import { onMount } from "svelte";
  import {
    VolumeIcon,
    Volume1Icon,
    Volume2Icon,
    VolumeOffIcon,
    VolumeXIcon,
  } from "@lucide/svelte";
  import {
    getMasterVolume,
    getMuted,
    setMasterVolume,
    setMuted,
    subscribeMasterVolume,
    subscribeMuted,
  } from "../mylib/master-volume.js";

  let volume = $state(getMasterVolume());
  let muted = $state(getMuted());
  let open = $state(false);
  let rootRef: HTMLDivElement;

  onMount(() => {
    const unsubVol = subscribeMasterVolume((v) => {
      volume = v;
    });
    const unsubMute = subscribeMuted((m) => {
      muted = m;
    });

    const onDown = (e: MouseEvent) => {
      if (open && rootRef && !rootRef.contains(e.target as Node)) {
        open = false;
      }
    };
    document.addEventListener("mousedown", onDown);

    return () => {
      unsubVol();
      unsubMute();
      document.removeEventListener("mousedown", onDown);
    };
  });
</script>

<div class="relative z-50" bind:this={rootRef}>
  <button
    onclick={() => (open = !open)}
    class={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
      open
        ? "bg-white/20 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`}
    aria-label="音量"
    title={muted ? "音量 ミュート中" : `音量 ${volume}%`}
  >
    {#if muted}
      <VolumeOffIcon class="w-5 h-5 text-red-300" />
    {:else if volume === 0}
      <VolumeXIcon class="w-5 h-5 text-gray-300" />
    {:else if volume <= 30}
      <VolumeIcon class="w-5 h-5" />
    {:else if volume <= 60}
      <Volume1Icon class="w-5 h-5" />
    {:else}
      <Volume2Icon class="w-5 h-5" />
    {/if}
  </button>

  {#if open}
    <div
      class="absolute right-0 top-full mt-1 z-50 w-44 bg-[#1a1a2e] border border-gray-700 rounded-lg shadow-2xl p-3 text-white"
    >
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs text-gray-300 font-bold">マスタ音量</span>
        <span class="text-xs text-gray-200 font-mono font-bold">
          {muted ? "ミュート中" : `${volume}%`}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          onclick={() => setMuted(!muted)}
          class={`shrink-0 p-1.5 rounded transition-colors ${
            muted
              ? "text-red-400 bg-red-400/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/10"
          }`}
          aria-label={muted ? "ミュート解除" : "ミュート"}
          title={muted ? "ミュート解除" : "ミュート"}
        >
          {#if muted}
            <VolumeOffIcon class="w-4 h-4" />
          {:else}
            <VolumeXIcon class="w-4 h-4" />
          {/if}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          oninput={(e) => setMasterVolume(Number((e.target as HTMLInputElement).value))}
          class="w-full accent-[#a3e635] cursor-pointer"
          disabled={muted}
        />
      </div>
    </div>
  {/if}
</div>

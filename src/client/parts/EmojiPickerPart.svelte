<script lang="ts">
  import { ChevronDownIcon, SmileIcon } from "@lucide/svelte";
  import CustomEmojiPart from "./emoji/CustomEmojiPart.svelte";
  import {
    customAnimeEmojiMap,
    customEmojiMap,
  } from "../mylib/emoji/custom.js";

  let { contentText = $bindable("") } = $props();

  const insertEmoji = (name: string) => {
    contentText += `:${name}:`;
  };
</script>

<div>
  <div class="mt-2 w-full rounded-lg border border-gray-500/10 p-3 shadow">
    <div class="mb-3">
      <div
        class="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-500/50"
      >
        <SmileIcon size={14} />
        <span>絵文字</span>
        <ChevronDownIcon size={14} />
      </div>

      <div class="flex flex-wrap gap-1">
        {#each customEmojiMap as [name, id]}
          <button
            class="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-500/10"
            onclick={() => insertEmoji(name)}
          >
            <CustomEmojiPart size="22" emoji={id} alt={`:${name}:`} />
          </button>
        {/each}

        {#each customAnimeEmojiMap as [name, id]}
          <button
            class="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-500/10"
            onclick={() => insertEmoji(name)}
          >
            <CustomEmojiPart size="22" emoji={id} alt={`:${name}:`} anime />
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

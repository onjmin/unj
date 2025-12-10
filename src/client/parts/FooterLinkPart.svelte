<script lang="ts">
  import { CircleArrowLeftIcon } from "@lucide/svelte";
  import { navigate } from "svelte-routing";
  import { makePathname } from "../mylib/env.js";

  let { board } = $props();
</script>

<div class="flex flex-col space-y-2 p-4 bg-gray-800 text-gray-200 rounded-lg">
  <button
    class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
    onclick={() => navigate(makePathname(`/${board.key}`))}
  >
    <CircleArrowLeftIcon size={16} />
    <span class="text-sm font-medium">板トップに戻る</span>
  </button>

  <button
    class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
    onclick={() => navigate(makePathname(`/${board.key}/history`))}
  >
    <CircleArrowLeftIcon size={16} />
    <span class="text-sm font-medium">履歴に戻る</span>
  </button>
</div>

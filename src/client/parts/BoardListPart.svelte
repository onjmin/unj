<script lang="ts">
  import { Link } from "svelte-routing";
  import { publicBoards } from "../../common/request/board.js";
  import { makePathname } from "../mylib/env.js";
</script>

<div class="w-60 mx-auto">
  <ul class="p-2 space-y-1 text-left">
    <li class="text-sm text-gray-500">板一覧</li>

    {#each publicBoards as b}
      <li class="rounded-md even:bg-gray-500/10">
        <Link
          to={makePathname(`/${b.key}`)}
          class="block px-3 py-1 rounded-md transition-colors"
        >
          {b.name}
        </Link>
      </li>
    {/each}
  </ul>
</div>

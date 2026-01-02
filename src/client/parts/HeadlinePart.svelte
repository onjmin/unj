<script lang="ts">
  import { Link } from "svelte-routing";
  import type { Board } from "../../common/request/board.js";
  import type { HeadlineThread } from "../../common/response/schema.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { makePathname } from "../mylib/env.js";
  import MessageBoxPart from "./MessageBoxPart.svelte";

  let { board }: { board: Board } = $props();

  let items: HeadlineThread[] | null = $state(null);
  let error = $state(false);

  let cache: ObjectStorage<HeadlineThread[]>;
  $effect(() => {
    cache = new ObjectStorage<HeadlineThread[]>(`headlineCache###${board.id}`);
    cache
      .get()
      .then((v) => {
        items = v ?? [];
      })
      .catch(() => {
        error = true;
      });
  });

  let laaaaaaaag = $state(false);
  $effect(() => {
    const id = setTimeout(() => {
      laaaaaaaag = true;
    }, 4096);
    return () => clearTimeout(id);
  });
</script>

<div
  class="h-[8svh] overflow-y-auto border border-gray-500/20 rounded-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
>
  <div class="px-2 py-1">
    <h2 class="text-xs leading-none font-semibold mb-1">ヘッドライン</h2>

    {#if error}
      <MessageBoxPart
        title="エラー発生"
        description={["ヘッドラインの読み込みに失敗しました。"]}
      />
    {:else if items === null}
      <p class="text-gray-500">ヘッドライン取得中…</p>
      {#if laaaaaaaag}
        <MessageBoxPart
          title="まだ終わらない？"
          description={[
            "キャッシュが壊れているかも。",
            "再読み込みしてみてね。",
          ]}
        />
      {/if}
    {:else if items.length === 0}
      <p class="text-gray-500 text-xs py-2">
        表示できるヘッドラインがありません。
      </p>
    {:else}
      <ul class="list-none p-0 m-0">
        {#each items as thread}
          <li class="odd:bg-gray-500/20">
            <div class="flex items-center px-2 py-1">
              <div
                class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-left text-xs"
              >
                <Link
                  to={makePathname(`/${board.key}/thread/${thread.id}`)}
                  class="block truncate"
                >
                  {thread.title}
                </Link>
              </div>
              <div
                class="shrink-0 ml-2 text-xs text-gray-500 whitespace-nowrap"
              >
                ({thread.resCount})
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

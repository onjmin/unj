<script lang="ts">
  import { MegaphoneIcon } from "@lucide/svelte";
  import { Link } from "svelte-routing";
  import type { Board } from "../../common/request/board.js";
  import {
    type BloggerItem,
    formatDateYMDCompact,
    getLabelIconComponent,
  } from "../mylib/blogger.js";
  import { decodeEnv, makePathname } from "../mylib/env.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import MessageBoxPart from "./MessageBoxPart.svelte";

  let { board }: { board: Board } = $props();

  const VITE_BLOGGER_BLOG_ID = decodeEnv(import.meta.env.VITE_BLOGGER_BLOG_ID);
  const VITE_BLOGGER_API_KEY = decodeEnv(import.meta.env.VITE_BLOGGER_API_KEY);

  let items: BloggerItem[] | null = $state(null);
  const cache = new ObjectStorage<BloggerItem[]>("newsCache");
  $effect(() => {
    cache.get().then((v) => {
      if (v && !items) items = v;
    });
  });

  let error = $state(false);
  $effect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/blogger/v3/blogs/${VITE_BLOGGER_BLOG_ID}/posts?maxResults=334&key=${VITE_BLOGGER_API_KEY}&fields=items(id,title,published,labels)`,
        ).then((response) => response.json());
        items = res.items;
        cache.set(items);
      } catch (err) {
        error = true;
      }
    })();
  });

  let laaaaaaaag = $state(false);
  $effect(() => {
    const id = setTimeout(() => {
      laaaaaaaag = true;
    }, 4096);
    return () => clearTimeout(id);
  });

  let currentPage = $state(1);
  const itemsPerPage = 2;
  let currentItems = $derived(
    items ? items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : []
  );
  let totalPages = $derived(items ? Math.ceil(items.length / itemsPerPage) : 0);
</script>

<div class="mt-2.5 mb-3 bg-white border-2 border-[#ffcc00] rounded-xl p-2.5 text-xs text-gray-800 shadow-xs relative">
  <div class="flex items-center justify-between mb-1 border-b border-gray-200 pb-1">
    <h2 class="text-xs font-bold text-gray-700 flex items-center m-0">
      <MegaphoneIcon size={12} class="mr-1 shrink-0" />
      ニュース
    </h2>
    {#if totalPages > 1}
      <div class="flex items-center space-x-2 text-[10px]">
        <button
          class="px-2 py-0.5 bg-gray-100 rounded disabled:opacity-50 border border-gray-300"
          onclick={() => currentPage--}
          disabled={currentPage === 1}
        >
          前へ
        </button>
        <span>{currentPage} / {totalPages}</span>
        <button
          class="px-2 py-0.5 bg-gray-100 rounded disabled:opacity-50 border border-gray-300"
          onclick={() => currentPage++}
          disabled={currentPage === totalPages}
        >
          次へ
        </button>
      </div>
    {/if}
  </div>

  {#if error}
    <MessageBoxPart
      title="エラー発生"
      description={[
        "ニュース取得失敗。。",
        "管理人に言ったら直してくれるかも。",
      ]}
    />
  {:else if items === null}
    <p class="text-gray-500 py-1">ニュース取得中…</p>
    {#if laaaaaaaag}
      <MessageBoxPart
        title="まだ終わらない？"
        description={["サーバーが落ちてるかも。。", "ページ更新してみてね。"]}
      />
    {/if}
  {:else if items}
    <ul class="list-none p-0 m-0 space-y-1.5 mt-1.5">
      {#each currentItems as item}
        <li>
          <span class="font-bold text-gray-700">【{formatDateYMDCompact(item.published)}】</span><br />
          <span class="ml-1 text-gray-800 flex items-start">
            <span class="shrink-0">・</span>
            <Link
              to={makePathname(`/${board.key}/news/${item.id}`)}
              class="text-purple-700 hover:underline break-words"
            >
              {item.title}
            </Link>
          </span>
          {#if item.labels?.length}
            {@const chip = item.labels.at(0) ?? ""}
            {@const IconComponent = getLabelIconComponent(chip)}
            <div class="ml-3 mt-0.5">
              <span class="inline-flex items-center h-4 text-[9px] font-medium px-1.5 py-0.5 rounded border border-gray-300 text-gray-500">
                {#if IconComponent}
                  <IconComponent size={10} class="mr-1 shrink-0" />
                {/if}
                {chip}
              </span>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
</style>

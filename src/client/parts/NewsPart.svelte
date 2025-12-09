<script lang="ts">
  import {
    BugIcon,
    CodeIcon,
    RssIcon,
    ShieldHalfIcon,
    ZapIcon,
  } from "@lucide/svelte";
  import { Link } from "svelte-routing";
  import type { Board } from "../../common/request/board.js";
  import { type BloggerItem, formatDate } from "../mylib/blogger.js";
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
          `https://www.googleapis.com/blogger/v3/blogs/${VITE_BLOGGER_BLOG_ID}/posts?key=${VITE_BLOGGER_API_KEY}&fields=items(id,title,published,labels)`,
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

  const getLabelIconComponent = (label: string) => {
    console.log(label);
    if (label === "新機能") {
      return ZapIcon;
    }
    if (label === "脆弱性") {
      return ShieldHalfIcon;
    }
    if (label === "技術") {
      return CodeIcon;
    }
    if (label === "バグ") {
      return BugIcon;
    }
    return null;
  };
</script>

<div
  class="h-[25vh] overflow-y-auto border border-gray-500/10 rounded-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-3 flex items-center">
      <RssIcon size={24} class="mr-2" />
      ニュース
    </h2>
    {#if error}
      <MessageBoxPart
        title="エラー発生"
        description={[
          "ニュース取得失敗。。",
          "管理人に言ったら直してくれるかも。",
        ]}
      />
    {:else if items === null}
      <p class="text-gray-500">ニュース取得中…</p>
      {#if laaaaaaaag}
        <MessageBoxPart
          title="まだ終わらない？"
          description={["サーバーが落ちてるかも。。", "ページ更新してみてね。"]}
        />
      {/if}
    {:else if items}
      <div class="w-full">
        <ul class="list-none p-0 m-0">
          {#each items as item, i}
            <li class="last:mb-0">
              <div
                class="flex items-center px-3 py-2 sm:px-2 sm:py-1 hover:bg-gray-500/10 transition-colors"
              >
                <div
                  class="flex-shrink-0 text-xs sm:text-sm text-gray-500 mr-4 w-16 sm:w-20"
                >
                  {formatDate(item.published)}
                </div>
                <div class="hidden md:flex flex-shrink-0 mr-4 space-x-2">
                  {#if item.labels}
                    {#each item.labels.slice(0, 2) as chip}
                      {@const IconComponent = getLabelIconComponent(chip)}
                      {#if IconComponent}
                        <span
                          class="inline-flex items-center h-5 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-500/10 bg-gray-100/10 text-gray-700 whitespace-nowrap"
                        >
                          <IconComponent
                            size={12}
                            class="mr-1 text-gray-500 flex-shrink-0"
                          />
                          {chip}
                        </span>
                      {:else}
                        <span
                          class="inline-flex items-center h-5 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-500/10 bg-gray-100/10 text-gray-700 whitespace-nowrap"
                        >
                          {chip}
                        </span>
                      {/if}
                    {/each}
                  {/if}
                </div>
                <div
                  class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-left text-sm"
                >
                  <Link
                    to={makePathname(`/${board.key}/news/${item.id}`)}
                    class="block truncate">{item.title}</Link
                  >
                </div>
              </div>
            </li>
            {#if i !== items.length - 1}
              <hr class="border-t border-gray-500/10 my-1 mx-0" />
            {/if}
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

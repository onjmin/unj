<script lang="ts">
  import { RssIcon } from "@lucide/svelte";
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
</script>

<div
  class="h-[8svh] overflow-y-auto border border-gray-500/20 rounded-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
>
  <div class="px-2 py-1">
    <h2 class="text-xs leading-none font-semibold mb-1 flex items-center">
      <RssIcon size={12} class="mr-1 shrink-0" />
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
          {#each items as item}
            <li class="odd:bg-gray-500/20">
              <div class="flex items-center px-2 py-1">
                <div class="shrink-0 text-xs text-gray-500 mr-3 w-16">
                  {formatDateYMDCompact(item.published)}
                </div>
                <div class="hidden md:flex shrink-0 mr-4 space-x-2">
                  {#if item.labels?.length}
                    {@const chip = item.labels.at(0) ?? ""}
                    {@const IconComponent = getLabelIconComponent(chip)}
                    <span
                      class="inline-flex items-center h-5 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-500/40 text-gray-500 whitespace-nowrap"
                    >
                      {#if IconComponent}
                        <IconComponent
                          size={12}
                          class="mr-1 text-gray-500 shrink-0"
                        />
                      {/if}
                      <span class="text-sm text-gray-500">
                        {chip}
                      </span>
                    </span>
                  {/if}
                </div>
                <div
                  class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-left text-sm"
                >
                  <Link
                    to={makePathname(`/${board.key}/news/${item.id}`)}
                    class="block truncate"
                  >
                    {item.title}
                  </Link>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

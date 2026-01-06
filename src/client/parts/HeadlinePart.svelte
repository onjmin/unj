<script lang="ts">
  import { navigate } from "svelte-routing";
  import type { Board } from "../../common/request/board.js";
  import type { HeadlineThread } from "../../common/response/schema.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { makePathname } from "../mylib/env.js";
  import {
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
    differenceInMonths,
    differenceInSeconds,
    differenceInWeeks,
    differenceInYears,
  } from "date-fns";
  import MessageBoxPart from "./MessageBoxPart.svelte";
  import { RssIcon } from "@lucide/svelte";
  import { findMisskey } from "../mylib/misskey.js";
  import { queryResultLimit } from "../../common/request/schema.js";
  import { socket } from "../mylib/socket.js";
  import { scrollToTop } from "../mylib/scroll.js";

  let { board }: { board: Board } = $props();

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    if (date > now) return "0秒";
    if (differenceInYears(now, date) > 0)
      return `${differenceInYears(now, date)}年`;
    if (differenceInMonths(now, date) > 0)
      return `${differenceInMonths(now, date)}か月`;
    if (differenceInWeeks(now, date) > 0)
      return `${differenceInWeeks(now, date)}週間`;
    if (differenceInDays(now, date) > 0)
      return `${differenceInDays(now, date)}日`;
    if (differenceInHours(now, date) > 0)
      return `${differenceInHours(now, date)}時間`;
    if (differenceInMinutes(now, date) > 0)
      return `${differenceInMinutes(now, date)}分`;
    return `${differenceInSeconds(now, date)}秒`;
  };

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

  /**
   * 新規スレッド or 新着レス
   * 競合を避けるため、受信してもキャッシュを上書きしない。
   */
  const handleNewHeadline = (data: { ok: boolean; new: HeadlineThread }) => {
    if (!data.ok || !items) return;
    if (items.length > 128) {
      items.pop();
    }
    items.unshift(data.new);
  };

  $effect(() => {
    // コンポーネントの中ではhello-goodbye処理を使わない
    socket?.on("newHeadline", handleNewHeadline);
    return () => {
      socket?.off("newHeadline", handleNewHeadline);
    };
  });
</script>

<div class="my-2 flex justify-center text-center">
  <div
    class="w-[490px] max-w-full h-[50svh] sm:h-[25svh] overflow-y-auto border border-gray-500/20 rounded-md scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
  >
    <div class="px-2 py-1">
      <h2 class="text-xs leading-none font-semibold mb-1 flex items-center">
        <RssIcon size={12} class="mr-1 shrink-0" />
        ヘッドライソ
      </h2>

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
            {@const misskey = findMisskey(board.key, thread.id)}
            {@const href = makePathname(
              misskey
                ? `/${board.key}/misskey/${misskey.misskeyId}`
                : `/${board.key}/thread/${thread.id}/${thread.resCount > queryResultLimit ? thread.resCount - 8 : "2"}?top`,
            )}
            <li>
              <div
                class="px-2 py-1 text-xs text-left cursor-pointer hover:bg-gray-500/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
                role="link"
                tabindex="0"
                onclick={() => {
                  navigate(href);
                  scrollToTop();
                }}
                onkeydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
              >
                <!-- 1行目：ヘッドライン（背景あり） -->
                <div class="truncate bg-gray-500/10 px-1">
                  <!-- 日時 -->
                  <span class="text-gray-500 shrink-0">
                    {formatTimeAgo(thread.latestResAt)}
                  </span>

                  <!-- 新着レス数 -->
                  {#if differenceInSeconds(Date.now(), thread.latestResAt) <= 64}
                    <span class="text-red-500 font-medium shrink-0"> +1 </span>
                  {/if}

                  <span class="font-medium">
                    <a
                      {href}
                      onclick={(e) => {
                        if (e.button === 0) e.preventDefault();
                      }}
                    >
                      {thread.title}
                    </a>
                    {#if !misskey}
                      <span class="shrink-0">
                        ({thread.resCount})
                      </span>
                    {/if}
                  </span>
                </div>

                <!-- 2行目：最新レス（背景なし） -->
                {#if thread.latestRes}
                  <div class="mt-0.5 truncate px-2">
                    {thread.latestRes}
                  </div>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

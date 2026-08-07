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

<div class="my-2 w-full">
  <div
    class="w-full max-h-[300px] overflow-y-auto border border-gray-400 bg-white shadow-sm"
  >
    {#if error}
      <MessageBoxPart
        title="エラー発生"
        description={["ヘッドラインの読み込みに失敗しました。"]}
      />
    {:else if items === null}
      <p class="text-gray-500 text-xs p-2">ヘッドライン取得中…</p>
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
      <p class="text-gray-500 text-xs py-2 text-center">
        表示できるヘッドラインがありません。
      </p>
    {:else}
      <ul class="list-none p-0 m-0 text-xs">
        {#each items as thread, idx}
          {@const href = makePathname(
            `/${board.key}/thread/${thread.id}/${thread.resCount > queryResultLimit ? thread.resCount - 8 : "2"}?top`,
          )}
          <li class={idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}>
            <div
              class="px-2 py-1.5 text-left cursor-pointer hover:bg-yellow-50 transition border-b border-gray-200/60"
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
              <!-- 1行目：経過時間 + Δ件数 + スレタイトル(レス数) -->
              <div class="truncate text-[12.5px] leading-tight">
                <span class="text-gray-400 font-normal mr-0.5">
                  {formatTimeAgo(thread.latestResAt)}
                </span>

                <span class="text-red-600 font-bold mr-1">
                  +{Math.max(1, (idx % 15) + 1)}
                </span>

                <a
                  {href}
                  class="font-normal text-[#0000ee] hover:underline"
                  onclick={(e) => {
                    if (e.button === 0) e.preventDefault();
                  }}
                >
                  {thread.title}<span class="text-[#3300cc]">({thread.resCount})</span>
                </a>
              </div>

              <!-- 2行目：最新レス -->
              {#if thread.latestRes}
                <div class="mt-0.5 truncate text-[11.5px] text-gray-700 leading-tight">
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

<script lang="ts">
  import { navigate } from "svelte-routing";
  import type { Board } from "../../common/request/board.js";
  import type { HeadlineThread } from "../../common/response/schema.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { threadTitleOf } from "../mylib/thread-title.js";
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

  let {
    board,
    initialItems = null,
  }: {
    board: Board;
    initialItems?: HeadlineThread[] | null;
  } = $props();

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
    if (initialItems && initialItems.length > 0) {
      items = initialItems;
      return;
    }
    cache = new ObjectStorage<HeadlineThread[]>(`headlineCache###${board.id}`);
    cache
      .get()
      .then((v) => {
        if (!items || items.length === 0) {
          items = v ?? [];
        }
      })
      .catch(() => {
        error = true;
      });
  });

  $effect(() => {
    if (initialItems && initialItems.length > 0) {
      items = initialItems;
    }
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
    const set = new Set<string>();
    items = items.filter((v) => {
      if (set.has(v.id)) return false;
      set.add(v.id);
      return true;
    });
  };

  $effect(() => {
    // コンポーネントの中ではhello-goodbye処理を使わない
    socket?.on("newHeadline", handleNewHeadline);
    return () => {
      socket?.off("newHeadline", handleNewHeadline);
    };
  });
</script>

<div class="unj-hl">
  <h3 class="unj-hl-title">この板の新着スレ</h3>
  <div class="unj-hl-list">
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
        {#each items as thread}
          {@const href = makePathname(
            `/${board.key}/thread/${thread.id}/${thread.resCount > queryResultLimit ? thread.resCount - 8 : "2"}?top`,
          )}
          <li class="unj-hl-li">
            <div
              class="unj-hl-row"
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
              <!-- 1行目：経過時間 + スレタイトル(レス数) -->
              <div class="truncate text-[13px] leading-snug">
                <span class="unj-hl-ago">
                  {formatTimeAgo(thread.latestResAt)}前
                </span>

                <a
                  {href}
                  class="hover:underline"
                  onclick={(e) => {
                    if (e.button === 0) e.preventDefault();
                  }}
                >
                  {threadTitleOf(
                    thread.title,
                    thread.contentText,
                  )}<span class="unj-hl-count">({thread.resCount})</span>
                </a>
              </div>

              <!-- 2行目：最新レス -->
              {#if thread.latestRes}
                <div class="unj-hl-latest">
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

<style>
  .unj-hl {
    margin: 12px 8px;
    text-align: left;
  }
  .unj-hl-title {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: bold;
    color: var(--unj-text-sub);
  }
  .unj-hl-list {
    max-height: 320px;
    overflow-y: auto;
    background: var(--unj-panel);
    border: 1px solid var(--unj-border);
  }
  .unj-hl-li + .unj-hl-li {
    border-top: 1px solid var(--unj-border-soft);
  }
  .unj-hl-row {
    padding: 6px 8px;
    cursor: pointer;
  }
  .unj-hl-row:hover {
    background: var(--unj-panel-alt);
  }
  .unj-hl-ago {
    color: var(--unj-text-faint);
    margin-right: 4px;
    font-size: 11.5px;
  }
  .unj-hl-count {
    color: var(--unj-text-sub);
  }
  .unj-hl-latest {
    margin-top: 2px;
    font-size: 12px;
    color: var(--unj-text-sub);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

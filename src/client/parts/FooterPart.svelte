<script lang="ts">
  import {
    HistoryIcon,
    HouseIcon,
    PencilLineIcon,
    SearchIcon,
  } from "@lucide/svelte";
  import { navigate } from "svelte-routing";
  import { undefinedBoard } from "../../common/request/board.js";
  import { makePathname } from "../mylib/env.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { type ResHistory } from "../mylib/res-history.js";
  import { historyBadgeSeenTotal } from "../mylib/unj-storage.js";

  let { board = undefinedBoard, menu = true } = $props();

  // 履歴バッジ: 監視中スレの「新着レス数」合計。
  // 一度履歴ページを開いたら、その時点の合計を historyBadgeSeenTotal に記録し、
  // 以後は合計がそれを上回るまでバッジ(数値)を出さない。
  const resHistoryCache = new ObjectStorage<ResHistory[]>("resHistoryCache");
  let unreadTotal = $state(0);
  $effect(() => {
    resHistoryCache.get().then((v) => {
      unreadTotal = (v ?? []).reduce(
        (sum, h) => sum + Math.max(0, h.resCount - h.resNum),
        0,
      );
    });
  });
  const seenTotal = $derived(Number(historyBadgeSeenTotal.value ?? "0") || 0);
  const showBadge = $derived(unreadTotal > 0 && unreadTotal > seenTotal);

  const openHistory = () => {
    historyBadgeSeenTotal.value = String(unreadTotal);
    navigate(makePathname(`/${board.key}/history`));
  };
</script>

<footer class="unj-footer-part">
  {#if menu}
    <nav class="unj-bottom-nav">
      <button
        class="nav-item"
        onclick={() => {
          if (location.pathname.endsWith(`/${board.key}`)) {
            location.reload();
          } else {
            navigate(makePathname(`/${board.key}`));
          }
        }}
      >
        <HouseIcon size={20} />
        <span class="nav-label">板トップ</span>
      </button>

      <button
        class="nav-item"
        onclick={() => navigate(makePathname(`/${board.key}/make-thread`))}
      >
        <PencilLineIcon size={20} />
        <span class="nav-label">スレ立て</span>
      </button>

      <button
        class="nav-item"
        onclick={() => navigate(makePathname(`/${board.key}/search`))}
      >
        <SearchIcon size={20} />
        <span class="nav-label">検索</span>
      </button>

      <button class="nav-item" onclick={openHistory}>
        <span class="icon-wrap">
          <HistoryIcon size={20} />
          {#if showBadge}
            <span class="badge">{unreadTotal > 99 ? "99+" : unreadTotal}</span>
          {/if}
        </span>
        <span class="nav-label">履歴</span>
      </button>
    </nav>
  {:else}
    <div class="unj-footer-note">
      <a
        href="https://ja.wikipedia.org/wiki/%E8%87%AA%E7%94%B1%E8%8A%B8%E8%A1%93%E3%83%A9%E3%82%A4%E3%82%BB%E3%83%B3%E3%82%B9"
        target="_blank"
        rel="noopener noreferrer">著作権コピーレフト</a
      >：うんｊはまとめ自由
    </div>
  {/if}
</footer>

<style>
  .unj-footer-part {
    z-index: 64;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: var(--unj-shell-max);
    margin: 0 auto;
  }
  .unj-bottom-nav {
    display: flex;
    align-items: stretch;
    background: var(--unj-panel);
    border-top: 1px solid var(--unj-border);
    height: 54px;
    padding-bottom: env(safe-area-inset-bottom);
    box-sizing: content-box;
  }
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: transparent;
    border: none;
    color: var(--unj-text-sub);
    cursor: pointer;
    padding: 0;
  }
  .nav-item:hover {
    color: var(--unj-bar);
    background: var(--unj-panel-alt);
  }
  :global(html.unj-dark) .nav-item:hover {
    color: var(--unj-title);
  }
  .nav-item:active {
    opacity: 0.7;
  }
  .icon-wrap {
    position: relative;
    display: inline-flex;
  }
  .nav-label {
    font-size: 10.5px;
    font-weight: bold;
  }
  .badge {
    position: absolute;
    top: -5px;
    right: -12px;
    background-color: var(--unj-new);
    color: #ffffff;
    font-size: 9px;
    font-weight: bold;
    border-radius: 999px;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .unj-footer-note {
    text-align: center;
    padding: 8px;
    font-size: 12px;
    color: var(--unj-text-faint);
    background: var(--unj-bg);
    border-top: 1px solid var(--unj-border-soft);
  }
</style>

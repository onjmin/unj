<script lang="ts">
  import { navigate } from "svelte-routing";
  import { undefinedBoard } from "../../common/request/board.js";
  import { makePathname } from "../mylib/env.js";

  let { board = undefinedBoard, menu = true } = $props();
</script>

<footer class="unj-footer-part">
  {#if menu}
    <div class="unj-bottom-nav">
      <button
        class="nav-item"
        onclick={() => navigate(makePathname(`/${board.key}/art`))}
      >
        <span class="nav-icon">🏆</span>
        <span class="nav-label">ランキング</span>
      </button>

      <button
        class="nav-item"
        onclick={() => navigate(makePathname(`/${board.key}/make-thread`))}
      >
        <span class="nav-icon">✏️</span>
        <span class="nav-label">スレ作成</span>
      </button>

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
        <span class="nav-icon">🏠</span>
        <span class="nav-label">トップ&更新</span>
      </button>

      <button
        class="nav-item"
        onclick={() => navigate(makePathname(`/${board.key}/search`))}
      >
        <span class="nav-icon">🔍</span>
        <span class="nav-label">検索</span>
      </button>

      <button
        class="nav-item relative"
        onclick={() => navigate(makePathname(`/${board.key}/history`))}
      >
        <div class="icon-wrap">
          <span class="nav-icon">📖</span>
          <span class="badge">3</span>
        </div>
        <span class="nav-label">履歴</span>
      </button>
    </div>
  {:else}
    <div class="opacity-70 text-center py-2 text-xs text-gray-400">
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
    max-width: 600px;
    margin: 0 auto;
  }
  .unj-bottom-nav {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background-color: #222222;
    border-top: 1px solid #333333;
    padding: 4px 0 6px 0;
    height: 52px;
  }
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    flex: 1;
    padding: 0;
  }
  .nav-item:active {
    opacity: 0.7;
  }
  .icon-wrap {
    position: relative;
    display: inline-block;
  }
  .nav-icon {
    font-size: 18px;
    line-height: 1.1;
  }
  .nav-label {
    font-size: 9.5px;
    color: #cccccc;
    margin-top: 2px;
    font-weight: 500;
  }
  .badge {
    position: absolute;
    top: -4px;
    right: -8px;
    background-color: #ef4444;
    color: #ffffff;
    font-size: 9px;
    font-weight: bold;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
</style>

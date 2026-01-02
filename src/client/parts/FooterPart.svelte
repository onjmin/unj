<script lang="ts">
  import BottomAppBar, { Section } from "@smui-extra/bottom-app-bar";
  import IconButton from "@smui/icon-button";
  import { navigate } from "svelte-routing";
  import { undefinedBoard } from "../../common/request/board.js";
  import { makePathname } from "../mylib/env.js";
  import {
    isEnabledRightMenu,
    isMobile,
    openLeft,
    openRight,
  } from "../mylib/store.js";

  let { board = undefinedBoard, menu = true } = $props();
</script>

<footer class="unj-footer-part">
  {#if menu}
    <BottomAppBar variant="static">
      <Section align="start" toolbar>
        <IconButton
          class="material-icons"
          onclick={() => {
            if (isMobile) {
              $openRight = false;
            }
            $openLeft = !$openLeft;
          }}>menu</IconButton
        >
      </Section>
      <Section>
        <div class="icon-container">
          <IconButton
            class="material-icons"
            aria-label="edit_note"
            onclick={() => navigate(makePathname(`/${board.key}/new`))}
            >edit_note</IconButton
          >
          <div class="label-overlay">スレ作成</div>
        </div>
        <div class="icon-container">
          <IconButton
            class="material-icons"
            aria-label="settings"
            onclick={() => navigate(makePathname(`/${board.key}/config`))}
            >settings</IconButton
          >
          <div class="label-overlay">設定</div>
        </div>
        <div class="icon-container">
          <IconButton
            class="material-icons"
            aria-label="search"
            onclick={() => navigate(makePathname(`/${board.key}/search`))}
            >search</IconButton
          >
          <div class="label-overlay">検索</div>
        </div>
        <div class="icon-container">
          <IconButton
            class="material-icons"
            aria-label="history"
            onclick={() => navigate(makePathname(`/${board.key}/history`))}
            >history</IconButton
          >
          <div class="label-overlay">履歴</div>
        </div>
      </Section>
      <Section align="end" toolbar>
        <IconButton
          class="material-icons"
          style="visibility:{$isEnabledRightMenu ? 'visible' : 'hidden'};"
          onclick={() => {
            if (isMobile) {
              $openLeft = false;
            }
            $openRight = !$openRight;
          }}>menu</IconButton
        >
      </Section>
    </BottomAppBar>
  {:else}
    <div class="opacity-70 text-center">
      <hr class="opacity-10" />
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
    overflow: hidden;
  }
  .icon-container {
    position: relative;
    display: inline-block;
  }
  .label-overlay {
    position: absolute;
    bottom: 0;
    transform: translateX(-50%) translateY(100%);
    left: 50%;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 4px;
    pointer-events: none;
    white-space: nowrap;
  }
</style>

<script lang="ts">
  import { navigate } from "svelte-routing";
  import { makePathname } from "../mylib/env.js";

  let { board } = $props();
</script>

<!-- 2ch のスレ末尾の「掲示板に戻る 全部 1- 最新50」のようなメニュー帯 -->
<nav class="unj-menubar unj-footer-links">
  <button onclick={() => navigate(makePathname(`/${board.key}`))}
    >掲示板に戻る</button
  >
  <button onclick={() => navigate(makePathname(`/${board.key}/history`))}
    >書き込み履歴</button
  >
</nav>

<style>
  .unj-footer-links {
    border-top: 1px solid var(--unj-border);
    margin-top: 8px;
  }
</style>

<script lang="ts">
  import { navigate } from "svelte-routing";
  import { DEV_MODE, STG_MODE, makePathname, pathname } from "../mylib/env.js";

  let {
    board = undefinedBoard,
    children = null,
    title = "",
    menu = true,
  } = $props();
  import { ArrowLeftIcon } from "@lucide/svelte";
  import { undefinedBoard } from "../../common/request/board.js";
  import {
    isEnabledRightMenu,
    isMobile,
    openLeft,
    openRight,
  } from "../mylib/store.js";
  import LeftMenuPart from "./LeftMenuPart.svelte";
  import RightMenuPart from "./RightMenuPart.svelte";

  if (DEV_MODE) {
    title = `DEV - ${title}`;
  }
  if (STG_MODE) {
    title = `STG - ${title}`;
  }

  $isEnabledRightMenu = children !== null;
  let pathname1 = $state("");
  let pathname2 = $state("");
  $effect(() => {
    if (!board) return;
    pathname1 = pathname().split("/")[1] ?? "";
    pathname2 = pathname().split("/")[2] ?? "";
  });
</script>

<svelte:head>
  <title>{title}</title>
  <!-- TODO:通知時にアイコンを切り替える -->
  <!-- <link rel="icon" href="static/favicons/favicon.ico" /> -->
</svelte:head>

<header class="unj-header-part w-full bg-gray-800 text-gray-200 shadow-md">
  <div class="max-w-6xl mx-auto px-4 flex items-center">
    <!-- ヘッダー左端：ボタン -->
    {#if pathname1 === board.key}
      {#if pathname2 !== ""}
        <button
          class="flex items-center space-x-1 px-3 py-2 rounded bg-gray-600 text-gray-200 hover:opacity-80"
          onclick={() => navigate(makePathname(`/${board.key}`))}
        >
          <ArrowLeftIcon class="w-5 h-5" />
          <span class="text-sm font-medium">板TOP</span>
        </button>
      {:else}
        <button
          class="flex items-center space-x-1 px-3 py-2 rounded bg-gray-600 text-gray-200 hover:opacity-80"
          onclick={() => navigate(makePathname("/"))}
        >
          <ArrowLeftIcon class="w-5 h-5" />
          <span class="text-sm font-medium">板一覧</span>
        </button>
      {/if}
    {:else}
      <!-- empty -->
    {/if}

    <!-- 中央＋右をぜいたくに使う -->
    <div class="flex-1 text-center">
      <h1 class="text-xl font-bold inline-flex items-center space-x-2">
        <span>{title}</span>
        <img
          src={`${import.meta.env.BASE_URL}static/favicons/loze.png`}
          alt="Logo"
          class="h-8"
        />
      </h1>
    </div>
  </div>
</header>

{#if menu}
  <LeftMenuPart {board} open={$openLeft} />
  {#if children !== null}
    <RightMenuPart open={$openRight && $isEnabledRightMenu}>
      {@render children?.()}
    </RightMenuPart>
  {/if}
  <button
    type="button"
    class="unj-main-part-overlay {isMobile && ($openLeft || $openRight)
      ? ''
      : 'hidden'}"
    onclick={() => {
      $openLeft = false;
      $openRight = false;
    }}>うんｊ</button
  >
{/if}

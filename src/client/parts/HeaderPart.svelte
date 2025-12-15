<script lang="ts">
  import { navigate } from "svelte-routing";
  import { DEV_MODE, STG_MODE, makePathname, pathname } from "../mylib/env.js";

  let {
    board = undefinedBoard,
    children = null,
    title = "",
    menu = true,
  } = $props();
  import { ArrowLeftIcon, MessageCircleQuestionMarkIcon } from "@lucide/svelte";
  import { undefinedBoard } from "../../common/request/board.js";
  import { seededRandArray } from "../../common/util.js";
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
    document
      .querySelector("head > link[rel='icon']")
      ?.setAttribute(
        "href",
        board.favicon || makePathname("/static/favicons/loze.png"),
      );
  });
</script>

<svelte:head>
  <title>{title}</title>
  <!-- <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Yuji+Mai&display=swap"
  />
  <style>
    .unj-font {
      font-family: "Yuji Mai", sans-serif !important;
    }
  </style> -->
</svelte:head>

<!-- <div class="absolute inset-0 z-0">
  <img
    src={seededRandArray(
      [
        "https://images.unsplash.com/photo-1665582300475-d9b6f074495b",
        "https://images.unsplash.com/photo-1598983870677-01e066a0b901",
        "https://images.unsplash.com/photo-1666324574196-9d027f7ad5e0",
        "https://images.unsplash.com/photo-1635078645658-9adaefeddc7f",
        "https://plus.unsplash.com/premium_photo-1663840243055-535e20f4056f",
        "https://plus.unsplash.com/premium_photo-1695680239779-c9c0a8642eb9",
        "https://plus.unsplash.com/premium_photo-1694111280528-cbeb3bc37cfd",
      ],
      new Date().getHours().toString(),
    )}
    alt="Background"
    class="h-screen w-full object-cover opacity-20"
    aria-hidden="true"
  />
</div> -->

<header class="unj-header-part w-full bg-gray-800 text-gray-200 shadow-md">
  <div class="max-w-6xl mx-auto px-4 flex items-center">
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
    <div class="flex-1 text-center">
      <h1 class="text-xl font-bold inline-flex items-center space-x-2">
        <span>{title}</span>
      </h1>
    </div>
    <a
      href="https://unj.gitbook.io/unj"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center space-x-1 px-3 py-2 rounded bg-gray-600 text-gray-200 hover:opacity-80 ml-4"
    >
      <MessageCircleQuestionMarkIcon class="w-5 h-5 text-gray-200" />
    </a>
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

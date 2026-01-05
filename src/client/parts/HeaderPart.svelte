<script lang="ts">
  import { navigate } from "svelte-routing";
  import { DEV_MODE, STG_MODE, makePathname, pathname } from "../mylib/env.js";
  import { ArrowLeftIcon, MessageCircleQuestionMarkIcon } from "@lucide/svelte";
  import { undefinedBoard } from "../../common/request/board.js";
  import { seededRandArray } from "../../common/util.js";
  import {
    isEnabledRightMenu,
    isMobile,
    openLeft,
    openRight,
    customBackgroundUrl,
    customBackgroundOpacity,
    isDarkMode,
    backgroundEmbedding,
  } from "../mylib/store.js";
  import LeftMenuPart from "./LeftMenuPart.svelte";
  import RightMenuPart from "./RightMenuPart.svelte";
  import { Anniversary, isAnniversary } from "../mylib/anniversary.js";

  let {
    board = undefinedBoard,
    children = null,
    title = "",
    menu = true,
  } = $props();

  let displayTitle = $state("");
  $effect(() => {
    if (DEV_MODE) displayTitle = `DEV - ${title}`;
    if (STG_MODE) displayTitle = `STG - ${title}`;
    displayTitle = title;
  });

  $effect(() => {
    $isEnabledRightMenu = children !== null;
    if (isMobile) {
      $openLeft = false;
      $openRight = false;
    }
  });

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
  <title>{displayTitle}</title>
  {#if $isDarkMode}
    <style>
      a {
        color: #8ab4f8 !important;
      }
      a:visited {
        color: #c58af9 !important;
      }
    </style>
  {:else}
    <style>
      a {
        color: #1a73e8 !important;
      }
      a:visited {
        color: #6f42c1 !important;
      }
    </style>
  {/if}

  {#if isAnniversary([Anniversary.HALLOWEEN])}
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Yuji+Mai&display=swap"
    />
    <style>
      .unj-font {
        font-family: "Yuji Mai", sans-serif !important;
      }
    </style>
  {/if}
</svelte:head>

{#if !$backgroundEmbedding}
  {#if $customBackgroundUrl !== "" && $customBackgroundUrl !== "null"}
    <div class="absolute inset-0 z-0">
      <img
        src={$customBackgroundUrl}
        alt="Background"
        class="h-screen w-full object-cover"
        style="opacity:{$customBackgroundOpacity};"
        aria-hidden="true"
      />
    </div>
  {:else if isAnniversary([Anniversary.NEW_YEAR])}
    <div class="absolute inset-0 z-0">
      <img
        src="https://plus.unsplash.com/premium_photo-1661964177687-57387c2cbd14"
        alt="Background"
        class="h-screen w-full object-cover opacity-20"
        aria-hidden="true"
      />
    </div>
  {:else if isAnniversary([Anniversary.HALLOWEEN])}
    <div class="absolute inset-0 z-0">
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
        class="h-screen w-full object-cover opacity-10"
        aria-hidden="true"
      />
    </div>
  {:else if isAnniversary([Anniversary.CHRISTMAS])}
    <div
      aria-hidden="true"
      class="absolute inset-0 z-0 pointer-events-none opacity-60 snow"
    ></div>
  {/if}
{/if}

<header class="unj-header-part w-full bg-gray-800 text-gray-200 shadow-md">
  <div class="text-xs sm:text-sm max-w-6xl mx-auto px-4 flex items-center">
    {#if pathname1 === board.key}
      {#if pathname2 !== ""}
        <button
          class="flex items-center space-x-1 px-3 py-2 rounded bg-gray-600 text-gray-200 hover:opacity-80"
          onclick={() => navigate(makePathname(`/${board.key}`))}
        >
          <ArrowLeftIcon class="w-4 h-4" />
          <span class="font-medium">板TOP</span>
        </button>
      {:else}
        <button
          class="flex items-center space-x-1 px-3 py-2 rounded bg-gray-600 text-gray-200 hover:opacity-80"
          onclick={() => navigate(makePathname("/"))}
        >
          <ArrowLeftIcon class="w-4 h-4" />
          <span class="font-medium">板一覧</span>
        </button>
      {/if}
    {:else}
      <!-- empty -->
    {/if}
    <div class="flex-1 text-center">
      <h1 class="sm:text-lg font-bold inline-flex items-center space-x-2">
        <span>{displayTitle}</span>
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
  <div
    tabindex="0"
    role="button"
    onkeydown={() => {}}
    class="unj-main-part-overlay {isMobile && ($openLeft || $openRight)
      ? ''
      : 'hidden'}"
    onclick={() => {
      $openLeft = false;
      $openRight = false;
    }}
  ></div>
{/if}

<style>
  .snow {
    position: absolute;
    inset: 0;

    background-image: radial-gradient(
        3.5px 3.5px at 30px 40px,
        white 100%,
        transparent 0
      ),
      radial-gradient(3px 3px at 120px 180px, white 100%, transparent 0),
      radial-gradient(2.5px 2.5px at 200px 90px, white 100%, transparent 0),
      radial-gradient(2.5px 2.5px at 160px 260px, white 100%, transparent 0),
      radial-gradient(2px 2px at 80px 300px, white 100%, transparent 0);

    /* ★ タイルと移動量を一致させる */
    background-size: 320px 320px;

    animation:
      snow-fall 8s linear infinite,
      snow-drift-a 9s ease-in-out infinite;
  }

  .snow::after {
    content: "";
    position: absolute;
    inset: 0;

    background-image: radial-gradient(
        2px 2px at 60px 80px,
        white 100%,
        transparent 0
      ),
      radial-gradient(1.5px 1.5px at 180px 220px, white 100%, transparent 0),
      radial-gradient(1.5px 1.5px at 100px 300px, white 100%, transparent 0),
      radial-gradient(1px 1px at 240px 140px, white 100%, transparent 0);

    background-size: 360px 360px;

    animation:
      snow-fall-bg 14s linear infinite,
      snow-drift-b 11s ease-in-out infinite;

    opacity: 0.55;
  }

  @keyframes snow-fall {
    from {
      background-position-y: 0;
    }
    to {
      background-position-y: 320px;
    }
  }

  @keyframes snow-fall-bg {
    from {
      background-position-y: 0;
    }
    to {
      background-position-y: 360px;
    }
  }

  @keyframes snow-drift-a {
    0% {
      background-position-x: 0;
    }
    50% {
      background-position-x: 32px;
    }
    100% {
      background-position-x: 0;
    }
  }

  @keyframes snow-drift-b {
    0% {
      background-position-x: 0;
    }
    50% {
      background-position-x: -24px;
    }
    100% {
      background-position-x: 0;
    }
  }
</style>

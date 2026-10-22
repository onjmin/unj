<script lang="ts">
  import { navigate } from "svelte-routing";
  import { DEV_MODE, STG_MODE, makePathname, pathname } from "../mylib/env.js";
  import { undefinedBoard } from "../../common/request/board.js";
  import { seededRandArray } from "../../common/util.js";
  import {
    customBackgroundUrl,
    customBackgroundOpacity,
    isDarkMode,
    backgroundEmbedding,
  } from "../mylib/store.js";
  import { Anniversary, isAnniversary } from "../mylib/anniversary.js";
  import VolumeControlPart from "./VolumeControlPart.svelte";

  // menuは今は未使用。以前は書き込みフォームや高度な設定を追いやる
  // 横スライドパネル(RightMenuPart)の表示可否だったが、実機(hayabusaモバイル版)
  // に合わせてそのパネル自体を廃止し、各ページの本来の場所にインライン表示するよう
  // 移設した。呼び出し側の互換性のためpropだけ残してある。
  let {
    board = undefinedBoard,
    title = "",
    menu = true,
    online = null,
    pv = null,
    bgColor = "#000044",
  }: {
    board?: typeof undefinedBoard;
    title?: string;
    menu?: boolean;
    online?: number | null;
    pv?: number | null;
    bgColor?: string;
  } = $props();

  let displayTitle = $state("");
  $effect(() => {
    if (DEV_MODE) displayTitle = `DEV - ${title}`;
    if (STG_MODE) displayTitle = `STG - ${title}`;
    displayTitle = title;
  });

  // リンク色などは global.css の色の変数で決める。ダークは html に印を付けて切り替える。
  $effect(() => {
    document.documentElement.classList.toggle("unj-dark", $isDarkMode);
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
        board.favicon || makePathname("/static/favicons/favicon.png"),
      );
  });
</script>

<svelte:head>
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
  {:else if isAnniversary([Anniversary.VALENTINE])}
    <div
      class="absolute inset-0 z-0 opacity-40"
      style="background-image: url('https://i.imgur.com/MuGvBdL.png'); background-repeat: repeat; background-size: auto;"
      aria-hidden="true"
    ></div>
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

<header
  class="unj-header-part unj-header"
  style={bgColor !== "#000044" && bgColor !== "#000033" && bgColor !== "#000000"
    ? `background-color:${bgColor};`
    : ""}
>
  <div class="unj-header-inner">
    {#if pathname1 === board.key}
      <button
        class="unj-header-back"
        title={pathname2 !== "" ? "板に戻る" : "トップに戻る"}
        onclick={() =>
          navigate(
            makePathname(pathname2 !== "" ? `/${board.key}` : "/"),
          )}
      >
        ＜
      </button>
    {/if}
    <h1 class="unj-header-title">
      {displayTitle || "うんｊ"}
    </h1>
    <div class="unj-header-tools">
      <VolumeControlPart />
      <button
        onclick={() => navigate(makePathname(`/${board.key}/config`))}
        class="unj-header-link"
        title="設定"
      >
        設定
      </button>
    </div>
  </div>
</header>

<style>
  .unj-header {
    background: var(--unj-bar);
    color: var(--unj-bar-text);
    border-bottom: 2px solid rgba(0, 0, 0, 0.25);
    position: relative;
  }
  .unj-header-inner {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 44px;
    padding: 0 6px;
  }
  .unj-header-back {
    flex: none;
    color: var(--unj-bar-text);
    font-weight: bold;
    font-size: 16px;
    width: 32px;
    height: 32px;
    border-radius: 3px;
  }
  .unj-header-back:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .unj-header-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 15px;
    font-weight: bold;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    padding-left: 4px;
  }
  .unj-header-tools {
    flex: none;
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .unj-header-link {
    color: var(--unj-bar-text);
    font-size: 13px;
    text-decoration: underline;
    text-underline-offset: 2px;
    padding: 6px 8px;
    border-radius: 3px;
  }
  .unj-header-link:hover {
    background: rgba(255, 255, 255, 0.15);
  }
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

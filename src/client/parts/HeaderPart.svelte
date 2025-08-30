<script lang="ts">
  import { DEV_MODE, STG_MODE } from "../mylib/env.js";

  let {
    children = null,
    title = "",
    menu = true,
    bookmark = $bindable(null),
  } = $props();
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

  const calcIsMobile = () => window.innerWidth < 768;
  $isEnabledRightMenu = children !== null;

  $effect(() => {
    // ソフトウェアキーボードが出現すると画面幅が変わるため、最初の1回だけ実行する
    $isMobile = calcIsMobile();
    const isPC = !$isMobile;
    $openLeft = isPC;
    $openRight = isPC;
  });
</script>

<svelte:head>
  <title>{title}</title>
  <!-- TODO:通知時にアイコンを切り替える -->
  <!-- <link rel="icon" href="static/favicons/favicon.ico" /> -->
</svelte:head>

<header class="unj-header-part w-full bg-gray-800 text-gray-200 shadow-md">
  <div class="max-w-6xl mx-auto px-4 flex items-center justify-center gap-2">
    <h1 class="text-xl font-bold">{title}</h1>
    <img
      src={`${import.meta.env.BASE_URL}static/favicons/loze.png`}
      alt="Logo"
      class="h-10"
    />
  </div>
</header>

{#if menu}
  <LeftMenuPart open={$openLeft} />
  {#if children !== null}
    <RightMenuPart open={$openRight && $isEnabledRightMenu}>
      {@render children?.()}
    </RightMenuPart>
  {/if}
  <button
    type="button"
    class="unj-main-part-overlay {$isMobile && ($openLeft || $openRight)
      ? ''
      : 'hidden'}"
    onclick={() => {
      $openLeft = false;
      $openRight = false;
    }}>うんｊ</button
  >
{/if}

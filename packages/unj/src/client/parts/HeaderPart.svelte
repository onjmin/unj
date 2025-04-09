<script lang="ts">
  import IconButton from "@smui/icon-button";
  import Snackbar, { Label } from "@smui/snackbar";
  import TopAppBar, { Title, Row, Section } from "@smui/top-app-bar";
  import { DEV_MODE, STG_MODE, pathname } from "../mylib/env.js";
  import {
    isEnabledRightMenu,
    isMobile,
    openLeft,
    openRight,
  } from "../mylib/store.js";
  import {
    showContactGuide,
    showTermsGuide,
    showThreadGuide,
  } from "../mylib/unj-storage.js";
  import LeftMenuPart from "./LeftMenuPart.svelte";
  import RightMenuPart from "./RightMenuPart.svelte";

  let {
    children = null,
    title = "",
    menu = true,
    bookmark = $bindable(null),
  } = $props();

  if (DEV_MODE) {
    title = `DEV - ${title}`;
  }
  if (STG_MODE) {
    title = `STG - ${title}`;
  }

  const calcIsMobile = () => window.innerWidth < 768;
  isEnabledRightMenu.set(children !== null);

  $effect(() => {
    // ソフトウェアキーボードが出現すると画面幅が変わるため、最初の1回だけ実行する
    isMobile.set(calcIsMobile());
    const isPC = !$isMobile;
    openLeft.set(isPC);
    openRight.set(isPC);
  });

  let snackbar: Snackbar;
  $effect(() => () => snackbar.close());

  let done = $state(false);
  const guides = [
    {
      done: showThreadGuide,
      path: "/thread",
      text: "レスは右上の三本線から！",
    },
    {
      done: showTermsGuide,
      path: "/terms",
      text: "よくある質問は右上の三本線を参照",
    },
    {
      done: showContactGuide,
      path: "/contact",
      text: "「開示請求」はAGPL3タブの右側に隠れています",
    },
  ];
</script>

<svelte:head>
  <title>{title}</title>
  <!-- TODO:通知時にアイコンを切り替える -->
  <!-- <link rel="icon" href="static/favicons/favicon.ico" /> -->
</svelte:head>

<header class="unj-header-part">
  <TopAppBar variant="static">
    <Row>
      {#if menu}
        <Section align="start" toolbar>
          <IconButton
            class="material-icons"
            onclick={() => {
              if ($isMobile) {
                openRight.set(false);
              }
              openLeft.update((v) => !v);
            }}>menu</IconButton
          >
        </Section>
        <Section align="start" toolbar style="visibility:hidden;">
          <IconButton class="material-icons"></IconButton>
        </Section>
      {/if}
      <Section>
        <Title style="width: 100svw; text-align: center;">{title}</Title>
      </Section>
      {#if menu}
        <Section
          align="end"
          toolbar
          style="visibility:{bookmark === null ? 'hidden' : 'visible'};"
        >
          <IconButton
            class="material-icons"
            onclick={() => {
              bookmark = !bookmark;
              if (bookmark) {
                snackbar.open();
              } else {
                snackbar.close();
              }
            }}>{bookmark ? "star" : "star_outline"}</IconButton
          >
        </Section>
        <Section align="end" toolbar>
          <IconButton
            class="material-icons"
            style="visibility:{$isEnabledRightMenu ? 'visible' : 'hidden'};"
            onclick={() => {
              if ($isMobile) {
                openLeft.set(false);
              }
              openRight.update((v) => !v);
            }}>menu</IconButton
          >
        </Section>
      {/if}
    </Row>
  </TopAppBar>
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
      openLeft.set(false);
      openRight.set(false);
    }}>うんｊ</button
  >
  {#each guides as guide}
    <button
      type="button"
      class="guide unj-main-part-overlay {$isMobile &&
      !done &&
      !guide.done.value &&
      pathname().startsWith(guide.path)
        ? ''
        : 'hidden'}"
      onclick={() => {
        done = true;
        guide.done.value = "done";
      }}>{guide.text}</button
    >
  {/each}
{/if}

<Snackbar bind:this={snackbar}>
  <Label>#後で見る</Label>
</Snackbar>

<style>
  .guide {
    color: white;
    text-align: right;
    font-size: 2rem;
    z-index: 256;
  }
</style>

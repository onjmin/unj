<script lang="ts">
  import IconButton from "@smui/icon-button";
  import TopAppBar, { Title, Row, Section } from "@smui/top-app-bar";
  import { DEV_MODE, STG_MODE } from "../mylib/env.js";
  import LeftMenuPart from "./LeftMenuPart.svelte";
  import RightMenuPart from "./RightMenuPart.svelte";

  let { children = null, title = "", menu = true, bookmark = false } = $props();
  if (DEV_MODE) {
    title = `DEV - ${title}`;
  }
  if (STG_MODE) {
    title = `STG - ${title}`;
  }

  let isMobile = $state(false);
  let openLeft = $state(false);
  let openRight = $state(false);
  const isEnabledRightMenu = children !== null;

  const onResize = () => {
    isMobile = window.innerWidth < 768;
    openLeft = !isMobile;
    if (isEnabledRightMenu) {
      openRight = openLeft;
    }
  };

  const main = () => {
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  };

  $effect(() => {
    return main();
  });

  let isAlreadyBookmark = $state(false); // TODO
</script>

<svelte:head>
  <title>{title}</title>
  <!-- TODO:通知時にアイコンを切り替える -->
  <!-- <link rel="icon" href="static/favicons/favicon.ico" /> -->
  <style>
    :root {
      --top-margin: 64px;
      --bottom-margin: 64px;
      --any-margin: 24px;
    }
  </style>
</svelte:head>

<header class="unj-header-part">
  <TopAppBar variant="static">
    <Row>
      <Section align="start" toolbar style="{menu || 'visibility:hidden'};">
        <IconButton
          class="material-icons"
          onclick={() => {
            if (isEnabledRightMenu && isMobile && openRight) {
              openRight = false;
            }
            openLeft = !openLeft;
          }}>menu</IconButton
        >
      </Section>
      <Section align="start" toolbar style="visibility:hidden;">
        <IconButton class="material-icons"></IconButton>
      </Section>
      <Section>
        <Title style="width: 100vw; text-align: center;">{title}</Title>
      </Section>
      <Section align="end" toolbar style="{bookmark || 'visibility:hidden'};">
        <IconButton
          class="material-icons"
          onclick={() => {
            isAlreadyBookmark = !isAlreadyBookmark;
          }}>{isAlreadyBookmark ? "bookmark" : "bookmark_border"}</IconButton
        >
      </Section>
      <Section
        align="end"
        toolbar
        style="{(menu && isEnabledRightMenu) || 'visibility:hidden'};"
      >
        <IconButton
          class="material-icons"
          onclick={() => {
            if (isEnabledRightMenu && isMobile && openLeft) {
              openLeft = false;
            }
            openRight = !openRight;
          }}>menu</IconButton
        >
      </Section>
    </Row>
  </TopAppBar>
</header>

{#if menu}
  <LeftMenuPart open={openLeft} />
{/if}

{#if children !== null}
  <RightMenuPart open={openRight}>
    {@render children?.()}
  </RightMenuPart>
{/if}

<style>
  .unj-header-part {
    height: var(--top-margin);
  }
</style>

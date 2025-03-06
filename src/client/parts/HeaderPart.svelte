<script lang="ts">
  import IconButton from "@smui/icon-button";
  import Snackbar, { Label } from "@smui/snackbar";
  import TopAppBar, { Title, Row, Section } from "@smui/top-app-bar";
  import { DEV_MODE, STG_MODE, pathname } from "../mylib/env.js";
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

  const isEnabledRightMenu = children !== null;
  let openLeft = $state(false);
  let openRight = $state(false);
  let isMobile = $state(false);

  const onResize = () => {
    isMobile = calcIsMobile();
    const isPC = !isMobile;
    openLeft = isPC || pathname().slice(1).indexOf("/") === -1;
    openRight = isPC;
  };

  $effect(() => {
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  let snackbar: Snackbar;
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
              if (isMobile) {
                openRight = false;
              }
              openLeft = !openLeft;
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
          style="{bookmark !== null || 'visibility:hidden'};"
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
            }}>{bookmark ? "bookmark" : "bookmark_border"}</IconButton
          >
        </Section>
        <Section
          align="end"
          toolbar
          style="{isEnabledRightMenu || 'visibility:hidden'};"
        >
          <IconButton
            class="material-icons"
            onclick={() => {
              if (isMobile) {
                openLeft = false;
              }
              openRight = !openRight;
            }}>menu</IconButton
          >
        </Section>
      {/if}
    </Row>
  </TopAppBar>
</header>

{#if menu}
  <LeftMenuPart open={openLeft} />
  {#if children !== null}
    <RightMenuPart open={openRight && isEnabledRightMenu}>
      {@render children?.()}
    </RightMenuPart>
  {/if}
  <button
    type="button"
    class="unj-main-part-overlay {isMobile && (openLeft || openRight)
      ? ''
      : 'hidden'}"
    onclick={() => {
      openLeft = false;
      openRight = false;
    }}>うんｊ</button
  >
{/if}

<Snackbar bind:this={snackbar}>
  <Label>#後で見る</Label>
</Snackbar>

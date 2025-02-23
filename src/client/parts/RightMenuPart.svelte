<script lang="ts">
  import Card, { Content } from "@smui/card";
  import { Header, Subtitle, Title } from "@smui/drawer";
  import List from "@smui/list";
  import TopAppBar, { Row } from "@smui/top-app-bar";

  let { children, open = false } = $props();
</script>

<div class="drawer-container-right {open ? '' : 'hidden'}">
  <Card>
    <TopAppBar variant="static" fixed><Row /></TopAppBar>
    <Header>
      <Title>サブメニュー</Title>
      <Subtitle>ここにページ固有のUIが入ります。</Subtitle>
    </Header>
    <Content>
      <List>
        {@render children?.()}
      </List>
    </Content>
  </Card>
</div>

<style>
  .drawer-container-right {
    opacity: 0.9;
    position: fixed;
    z-index: 16;
    top: 0;
    bottom: 0;
    overflow-y: auto;
    border: 1px solid
      var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.1));
    transition: transform 0.3s ease;
    max-width: 100svw;
    width: 256px;
    right: 0;
    transform: translateX(0);
    background-color: black;
  }
  .drawer-container-right.hidden {
    transform: translateX(100%);
  }
</style>

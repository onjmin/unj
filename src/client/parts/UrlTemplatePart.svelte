<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import IconButton from "@smui/icon-button";
  import List, {
    Item,
    Graphic,
    Text,
    PrimaryText,
    SecondaryText,
  } from "@smui/list";
  import Portal from "svelte-portal";
  import { contentTemplateMap } from "../../common/request/content-schema.js";
  import type { SiteInfo } from "../../common/request/whitelist/site-info.js";

  let {
    open = $bindable(false),
    contentUrl = $bindable(""),
    contentType = 0,
  } = $props();

  let selectionIndex = $state(0);
  let href = $state("");
  let temp: SiteInfo[] = $state([]);

  $effect(() => {
    temp = contentTemplateMap.get(contentType) ?? [];
  });

  $effect(() => {
    href = temp[selectionIndex] ? temp[selectionIndex].href : "";
    if (open && temp.length <= selectionIndex) {
      selectionIndex = 0;
    }
  });
</script>

<Portal target="body">
  <Dialog class="unj-dialog-part" bind:open>
    <Title>URLテンプレ機能</Title>
    <Content>
      <div>
        {#if contentType === 4}
          <p>みんなで遊べるブラウザゲームを集めました。</p>
        {:else if contentType === 8}
          <p>画像が埋め込まれます。</p>
        {:else if contentType === 16}
          <p>GIF画像が埋め込まれます。</p>
        {:else if contentType === 32}
          <p>動画再生プレイヤーが埋め込まれます。</p>
        {:else if contentType === 64}
          <p>音楽再生プレイヤーが埋め込まれます。</p>
        {/if}
      </div>
      <div style="text-align:left;">
        <List twoLine avatarList singleSelection selectedIndex={selectionIndex}>
          {#each temp as siteInfo, i}
            <Item
              onSMUIAction={() => (selectionIndex = i)}
              selected={selectionIndex === i}
            >
              <Graphic
                class="favicon-item-graphic"
                style="background-image: url({siteInfo.favicon});"
              />
              <Text>
                <PrimaryText>{siteInfo.name}</PrimaryText>
                <SecondaryText>{siteInfo.description}</SecondaryText>
              </Text>
              <IconButton
                class="material-icons"
                onclick={() => window.open(siteInfo.href, "_blank")}
                >open_in_new</IconButton
              >
            </Item>
          {/each}
        </List>
      </div>
    </Content>
    <Actions>
      <Button
        action="accept"
        onclick={() => {
          if (href !== "") {
            contentUrl = href;
          }
        }}
      >
        <Label>貼り付け</Label>
      </Button>
      <Button action="reject">
        <Label>キャンセル</Label>
      </Button>
    </Actions>
  </Dialog>
</Portal>

<style>
  :global(.favicon-item-graphic) {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
</style>

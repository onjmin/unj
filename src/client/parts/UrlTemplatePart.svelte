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

  let {
    children = null,
    open = $bindable(false),
    contentUrl = $bindable(""),
    list = [],
  } = $props();

  let selectionIndex = $state(0);
  let href = $state("");

  $effect(() => {
    href = list[selectionIndex] ? list[selectionIndex].href : "";
    if (open && list.length <= selectionIndex) {
      selectionIndex = 0;
    }
  });
</script>

<Portal target="body">
  <Dialog class="unj-dialog-part" bind:open>
    <Title>URLテンプレ機能</Title>
    <Content>
      {#if children !== null}
        <div>
          {@render children?.()}
        </div>
      {/if}
      <div>
        <List
          class="demo-list"
          twoLine
          avatarList
          singleSelection
          selectedIndex={selectionIndex}
        >
          {#each list as siteInfo, i}
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
  * :global(.demo-list) {
    text-align: left;
  }
  :global(.favicon-item-graphic) {
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }
</style>

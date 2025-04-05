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
  import { sAnimsMap } from "../../common/request/s-anims.js";

  let { open = $bindable(false), nowSAnimsId = $bindable(0) } = $props();

  const index2key = [...sAnimsMap.keys()];
  let selectionIndex = $state(index2key.indexOf(nowSAnimsId));
  const closeHandler = (e: CustomEvent<{ action: string }>) => {
    switch (e.detail.action) {
      case "accept":
        nowSAnimsId = index2key[selectionIndex];
        break;
      default:
        selectionIndex = index2key.indexOf(nowSAnimsId);
        break;
    }
  };
</script>

<Portal target="body">
  <Dialog class="unj-dialog-part" bind:open onSMUIDialogClosed={closeHandler}>
    <Title>着せ替え機能</Title>
    <Content>
      <div style="text-align:left;">
        <List twoLine avatarList singleSelection selectedIndex={selectionIndex}>
          {#each sAnimsMap.values() as sAnim, i}
            <Item
              onSMUIAction={() => (selectionIndex = i)}
              selected={selectionIndex === i}
            >
              {#if sAnim.src}
                <Graphic
                  class="s-anims-item-graphic"
                  style="background-image:url({sAnim.src});"
                />
              {/if}
              <Text>
                <PrimaryText>{sAnim.name}</PrimaryText>
                <SecondaryText>{sAnim.description}</SecondaryText>
              </Text>
              {#if sAnim.href}
                <IconButton
                  class="material-icons"
                  onclick={() => window.open(String(sAnim.href), "_blank")}
                  >open_in_new</IconButton
                >
              {/if}
            </Item>
          {/each}
        </List>
      </div>
    </Content>
    <Actions>
      <Button action="accept">
        <Label>選択</Label>
      </Button>
      <Button action="reject">
        <Label>キャンセル</Label>
      </Button>
    </Actions>
  </Dialog>
</Portal>

<style>
  :global(.s-anims-item-graphic) {
    background-repeat: no-repeat;
    background-position: 0 -32px;
    width: 16px !important;
    height: 16px !important;
    transform: scale(2);
  }
</style>

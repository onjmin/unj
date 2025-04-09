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
  import { avatarMap } from "../../common/request/avatar.js";

  let { open = $bindable(false), userAvatar = $bindable(0) } = $props();

  const index2key = [...avatarMap.keys()];
  let selectionIndex = $state(index2key.indexOf(userAvatar));
  const closeHandler = (e: CustomEvent<{ action: string }>) => {
    switch (e.detail.action) {
      case "accept":
        userAvatar = index2key[selectionIndex];
        break;
      default:
        selectionIndex = index2key.indexOf(userAvatar);
        break;
    }
  };
</script>

<Portal target="body">
  <Dialog class="unj-dialog-part" bind:open onSMUIDialogClosed={closeHandler}>
    <Title>アイコン機能</Title>
    <Content>
      <div style="text-align:left;">
        <List twoLine avatarList singleSelection selectedIndex={selectionIndex}>
          {#each avatarMap.values() as avatar, i}
            <Item
              onSMUIAction={() => (selectionIndex = i)}
              selected={selectionIndex === i}
            >
              {#if avatar.src}
                <Graphic
                  class="avatar-item-graphic"
                  style="background-image:url({avatar.src});"
                />
              {/if}
              <Text>
                <PrimaryText>{avatar.name}</PrimaryText>
                <SecondaryText>{avatar.description}</SecondaryText>
              </Text>
              {#if avatar.href}
                <IconButton
                  class="material-icons"
                  onclick={() => window.open(String(avatar.href), "_blank")}
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
  :global(.avatar-item-graphic) {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
</style>

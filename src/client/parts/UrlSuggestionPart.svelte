<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Header, Title, Content, Actions } from "@smui/dialog";
  import IconButton from "@smui/icon-button";
  import List, {
    Item,
    Graphic,
    Text,
    PrimaryText,
    SecondaryText,
  } from "@smui/list";

  let {
    children = null,
    open = $bindable(false),
    content_url = $bindable(""),
    list = [],
  } = $props();

  let selectionIndex = $state(0);
  let href = $state("");

  $effect(() => {
    href = list[selectionIndex] ? list[selectionIndex].href : "";
  });
</script>

<Dialog
  class="unj-dialog-part"
  bind:open
  fullscreen
  aria-labelledby="fullscreen-title"
  aria-describedby="fullscreen-content"
>
  <Header>
    <Title id="fullscreen-title">URLテンプレ</Title>
    <IconButton action="close" class="material-icons">close</IconButton>
  </Header>
  <Content id="fullscreen-content">
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
              class="unj-playground-item-graphic"
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
          content_url = href;
        }
      }}
    >
      <Label>貼り付け</Label>
    </Button>
  </Actions>
</Dialog>

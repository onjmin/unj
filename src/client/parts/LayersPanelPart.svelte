<script lang="ts">
  import Button, { Label, Icon } from "@smui/button";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import List, {
    Item,
    Graphic,
    Text,
    PrimaryText,
    SecondaryText,
    Meta,
  } from "@smui/list";
  import * as oekaki from "../mylib/oekaki/layered-canvas.js";

  let { open = $bindable(false), activeLayer = $bindable(null) } = $props();

  let layers: (oekaki.LayeredCanvas | null)[] = $state([]);

  $effect(() => {
    layers = oekaki.getLayers();
  });
  $effect(() => {
    selectionIndex = layers.map((v) => v?.index).indexOf(activeLayer?.index);
  });

  let selectionIndex: number = $state(0);
  const closeHandler = (e: CustomEvent<{ action: string }>) => {
    switch (e.detail.action) {
      case "accept":
        activeLayer = layers[selectionIndex];
        break;
      default:
        selectionIndex = layers
          .map((v) => v?.index)
          .indexOf(activeLayer?.index);
        break;
    }
  };
</script>

<Dialog class="unj-dialog-part" bind:open onSMUIDialogClosed={closeHandler}>
  <Title>レイヤーパネル</Title>
  <Content>
    <div>
      <Icon class="material-icons">arrow_upward</Icon>
      最背面
    </div>
    <div style="text-align:left;">
      <List twoLine avatarList singleSelection selectedIndex={selectionIndex}>
        {#each layers as layer, i}
          {#if layer}
            <Item
              onSMUIAction={() => (selectionIndex = i)}
              selected={selectionIndex === i}
            >
              <Graphic
                class="canvas-preview-item-graphic"
                style="background-image:url({layer.used
                  ? layer.canvas.toDataURL('image/png')
                  : 'https://placehold.co/32x32?text=new'});"
              />
              <Text>
                <PrimaryText>{layer.name}</PrimaryText>
                <SecondaryText>{layer.opacity}</SecondaryText>
              </Text>
              <Meta
                class="material-icons"
                onclick={() => {
                  const { next } = layer;
                  if (next) {
                    layer.swap(next.index);
                    layers = oekaki.getLayers();
                  }
                }}>arrow_downward</Meta
              >
              <Meta
                class="material-icons"
                onclick={() => {
                  const { prev } = layer;
                  if (prev) {
                    layer.swap(prev.index);
                    layers = oekaki.getLayers();
                  }
                }}>arrow_upward</Meta
              >
            </Item>
          {/if}
        {/each}
      </List>
    </div>
    <div>
      <Icon class="material-icons">arrow_downward</Icon>
      最前面
    </div>
    <Button
      variant="raised"
      onclick={() => {
        activeLayer = new oekaki.LayeredCanvas(
          `レイヤー #${layers.length + 1}`,
        );
        layers = oekaki.getLayers();
      }}>レイヤー追加</Button
    >
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

<style>
  :global(.canvas-preview-item-graphic) {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    border-radius: 0 !important;
  }
</style>

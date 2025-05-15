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

  let { open = $bindable(false) } = $props();
</script>

<Dialog class="unj-dialog-part" bind:open>
  <Title>レイヤーパネル</Title>
  <Content>
    <!-- index|サムネ|レイヤー名|上|下 -->
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

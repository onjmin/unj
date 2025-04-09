<script lang="ts">
  import Banner, { Icon } from "@smui/banner";
  import Button, { Label } from "@smui/button";
  import Checkbox from "@smui/checkbox";
  import Dialog, { Header, Title, Content, Actions } from "@smui/dialog";
  import FormField from "@smui/form-field";
  import IconButton from "@smui/icon-button";
  import { visible } from "../mylib/dom.js";
  import { termsAgreement } from "../mylib/unj-storage.js";
  import TermsPart from "./TermsPart.svelte";

  let { openConfirm = false } = $props();
  let openTerms = $state(false);
  let openTermsWarn = $state(false);
  let isAlreadyScrollEnd = $state(false);
  let termsChecked = $state(false);

  const closeHandler = (e: CustomEvent<{ action: string }>) => {
    switch (e.detail.action) {
      case "close":
        openConfirm = true;
        break;
      case "reject":
        openTermsWarn = true;
        break;
      case "accept":
        termsAgreement.value = "yes";
        break;
    }
  };
</script>

<!--利用規約に未同意の場合 -->

<Banner class="unj-dialog-part" bind:open={openConfirm} centered mobileStacked>
  {#snippet icon()}
    <Icon class="material-icons">warning</Icon>
  {/snippet}
  {#snippet label()}
    <Label
      >本サービスの利用を開始する前に、利用規約の全文を読んで同意してください。</Label
    >
  {/snippet}
  {#snippet actions()}
    <Button onclick={() => (openTerms = true)}>表示する</Button>
    <Button onclick={() => (openTermsWarn = true)}>表示しない</Button>
  {/snippet}
</Banner>

<!--「利用規約を表示しない」を選んだ場合 -->

<Dialog
  class="unj-dialog-part"
  bind:open={openTermsWarn}
  aria-labelledby="disagree-title"
  aria-describedby="disagree-content"
  onSMUIDialogClosed={closeHandler}
>
  <Title id="disagree-title">ダメです。</Title>
  <Content id="disagree-content"
    >利用規約に同意しない場合は、お使いいただけません。</Content
  >
  <Actions>
    <Button>
      <Label>OK</Label>
    </Button>
  </Actions>
</Dialog>

<!--「利用規約を表示する」を選んだ場合 -->

<Dialog
  class="unj-dialog-part"
  bind:open={openTerms}
  fullscreen
  aria-labelledby="terms-title"
  aria-describedby="terms-content"
  onSMUIDialogClosed={closeHandler}
>
  <Header>
    <Title id="terms-title">うんｊ利用規約</Title>
    <IconButton action="close" class="material-icons">close</IconButton>
  </Header>
  <Content id="terms-content">
    <TermsPart />
    <div
      use:visible={(visible) => {
        if (visible && !isAlreadyScrollEnd) {
          isAlreadyScrollEnd = true;
        }
      }}
    ></div>
  </Content>
  <Actions style="display: flex; align-items: center; gap: 1rem;">
    <FormField style="margin-right: auto;">
      <Checkbox bind:checked={termsChecked} disabled={!isAlreadyScrollEnd} />
      {#snippet label()}
        はい、全文を読んで理解しました。
      {/snippet}
    </FormField>
    <Button action="accept" disabled={!termsChecked}>
      <Label>同意する</Label>
    </Button>
    <Button action="reject">
      <Label>同意しない</Label>
    </Button>
  </Actions>
</Dialog>

<script lang="ts">
  import Banner, { Icon } from "@smui/banner";
  import Button, { Label } from "@smui/button";
  import Checkbox from "@smui/checkbox";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import FormField from "@smui/form-field";
  import TopAppBar, { Row, Section } from "@smui/top-app-bar";
  import { Link } from "svelte-routing";
  import { visible } from "../mylib/dom.js";
  import { load, save } from "../mylib/storage.js";
  import TermsPart from "./TermsPart.svelte";

  let { openAttention = false } = $props();
  let openTerms = $state(false);
  let openTermsWarn = $state(false);

  let isAlreadyScrollEnd = $state(false);
  let termsChecked = $state(false);

  const closeHandler = async (e: CustomEvent<{ action: string }>) => {
    switch (e.detail.action) {
      case "close":
        openAttention = true;
        break;
      case "reject":
        openTermsWarn = true;
        break;
      case "accept":
        await save("termsAgreement", "yes");
        load("termsAgreement").then((v) => {
          openAttention = "yes" !== (v ?? "");
        });
        break;
    }
  };
</script>

<header>
  <TopAppBar variant="static">
    <Row>
      <Section>
        <Link
          to="/"
          style="text-decoration: none; color: inherit; cursor: pointer;"
        >
          <Title>うんｊ</Title>
        </Link>
      </Section>
    </Row>
  </TopAppBar>

  <!--利用規約に未同意の場合 -->

  <Banner bind:open={openAttention} centered mobileStacked>
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
    bind:open={openTermsWarn}
    aria-labelledby="simple-title"
    aria-describedby="simple-content"
    onSMUIDialogClosed={closeHandler}
  >
    <Title id="simple-title">ダメです。</Title>
    <Content id="simple-content"
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
    bind:open={openTerms}
    fullscreen
    aria-labelledby="fullscreen-title"
    aria-describedby="fullscreen-content"
    onSMUIDialogClosed={closeHandler}
  >
    <Title id="fullscreen-title">うんｊ利用規約</Title>
    <Content id="fullscreen-content">
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
</header>

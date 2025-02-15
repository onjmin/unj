<script lang="ts">
  import Banner, { Icon, CloseReason } from "@smui/banner";
  import Button, { Label } from "@smui/button";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import TopAppBar, { Row, Section } from "@smui/top-app-bar";
  import { dangerousLoad, dangerousSave } from "../mylib/storage.js";
  import TermsPart from "./TermsPart.svelte";

  let { openAttention = false } = $props();
  let openTerms = $state(false);
  let openTermsWarn = $state(false);

  const closeHandler = async (e: CustomEvent<{ action: string }>) => {
    switch (e.detail.action) {
      case "close":
        openAttention = true;
        break;
      case "reject":
        openTermsWarn = true;
        break;
      case "accept":
        await dangerousSave("isAlreadyAgreedTerms", "yes");
        dangerousLoad("isAlreadyAgreedTerms").then((v) => {
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
        <Title>うんｊ</Title>
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
    <Content id="fullscreen-content"><TermsPart /></Content>
    <Actions>
      <Button action="accept">
        <Label>同意する</Label>
      </Button>
      <Button action="reject">
        <Label>同意しない</Label>
      </Button>
    </Actions>
  </Dialog>
</header>

<script lang="ts">
  import Autocomplete from "@smui-extra/autocomplete";
  import Textfield from "@smui/Textfield";
  import Checkbox from "@smui/checkbox";
  import FormField from "@smui/form-field";
  import CharacterCounter from "@smui/textfield/character-counter";
  import { VITE_ADMIN_EMAIL } from "../../mylib/env.js";

  let { enabledSubmit = $bindable(false) } = $props();

  let requesterName = $state("");
  let requesterAgency = $state("");
  let requesterPosition = $state("");
  let contactPhone = $state("");
  let requestType = $state("");
  let targetUserId = $state("");
  let targetContent = $state("");
  let requestPeriodStart = $state("");
  let requestPeriodEnd = $state("");
  let legalBasis = $state("");
  let caseNumber = $state("");

  let check1 = $state(false);
  let check2 = $state(false);

  const check = () => {
    enabledSubmit =
      requesterName !== "" &&
      requesterAgency !== "" &&
      requesterPosition !== "" &&
      contactPhone !== "" &&
      requestType !== "" &&
      targetUserId !== "" &&
      targetContent !== "" &&
      requestPeriodStart !== "" &&
      requestPeriodEnd !== "" &&
      legalBasis !== "" &&
      check1 &&
      check2;
  };

  export const toStr = () => {
    return "";
  };
</script>

<Textfield
  label="連絡先電話番号"
  bind:value={contactPhone}
  type="tel"
  input$maxlength={16}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>
<Textfield label="請求者氏名" bind:value={requesterName} input$maxlength={16}>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>
<Textfield label="所属機関" bind:value={requesterAgency} input$maxlength={32}>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>
<Textfield label="職位" bind:value={requesterPosition} input$maxlength={32}>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<Autocomplete
  combobox
  options={["IPアドレス情報", "書き込み内容"]}
  bind:value={requestType}
  label="開示請求の種類"
/>

<Textfield
  label="対象ユーザーID"
  bind:value={targetUserId}
  input$maxlength={16}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>
<Textfield
  textarea
  label="開示対象となる書き込み内容"
  bind:value={targetContent}
  input$maxlength={256}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<Textfield
  label="対象期間（開始）"
  bind:value={requestPeriodStart}
  type="date"
/>
<Textfield label="対象期間（終了）" bind:value={requestPeriodEnd} type="date" />

<Autocomplete
  combobox
  options={["刑事訴訟法", "電気通信事業法", "プロバイダ責任制限法"]}
  bind:value={legalBasis}
  label="請求の法的根拠"
/>

<Textfield
  label="事件番号（任意）"
  bind:value={caseNumber}
  input$maxlength={64}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<FormField>
  <Checkbox bind:checked={check1} onchange={check} />
  {#snippet label()}
    本請求は正当な権限のもとで行われていることを確認しました
  {/snippet}
</FormField>

<FormField>
  <Checkbox bind:checked={check2} onchange={check} />
  {#snippet label()}
    開示された情報は法的手続きを遵守し適切に管理されることを誓約します
  {/snippet}
</FormField>

{#snippet mail()}
  <a href="mailto:{VITE_ADMIN_EMAIL}?subject=[legal]件名">メール</a>
{/snippet}

{#if enabledSubmit}
  <p>念のため{@render mail()}も送ってください。</p>
{/if}

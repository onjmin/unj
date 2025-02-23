<script lang="ts">
  import Autocomplete from "@smui-extra/autocomplete";
  import Textfield from "@smui/Textfield";
  import Checkbox from "@smui/checkbox";
  import FormField from "@smui/form-field";
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

  export const validate = () => {
    return true;
  };

  export const toStr = () => {
    return "";
  };
</script>

<Textfield label="連絡先電話番号" bind:value={contactPhone} type="tel" />
<Textfield label="請求者氏名" bind:value={requesterName} />
<Textfield label="所属機関" bind:value={requesterAgency} />
<Textfield label="職位" bind:value={requesterPosition} />

<Autocomplete
  combobox
  options={["IPアドレス情報", "書き込み内容"]}
  bind:value={requestType}
  label="開示請求の種類"
/>

<Textfield label="対象ユーザーID" bind:value={targetUserId} />
<Textfield textarea label="対象の書き込み内容" bind:value={targetContent} />

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

<Textfield label="事件番号（任意）" bind:value={caseNumber} />

<FormField>
  <Checkbox bind:checked={check1} />
  {#snippet label()}
    本請求は正当な権限のもとで行われていることを確認しました
  {/snippet}
</FormField>

<FormField>
  <Checkbox bind:checked={check2} />
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

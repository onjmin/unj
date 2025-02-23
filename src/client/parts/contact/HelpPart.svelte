<script lang="ts">
  import Autocomplete from "@smui-extra/autocomplete";
  import Textfield from "@smui/Textfield";
  import CharacterCounter from "@smui/textfield/character-counter";

  let { enabledSubmit = $bindable(false) } = $props();

  let feature = $state("");
  let overview = $state("");
  let detail = $state("");

  const check = () => {
    enabledSubmit = feature !== "" && overview !== "" && detail !== "";
  };

  export const toStr = () => {
    return [
      `対象機能：${feature}`,
      `要約：${overview}`,
      `詳細：${detail}`,
    ].join("\n");
  };
</script>

<Autocomplete
  combobox
  label="ヘルプが欲しい機能"
  bind:value={feature}
  onchange={check}
  options={[
    "スレ立て",
    "ヘッドライン",
    "閲覧履歴",
    "#後で見る",
    "個人設定",
    "利用規約",
    "お問い合わせ",
    "新機能のお知らせ",
    "TOP絵集",
    "リンク集",
  ]}
/>

<Textfield
  label="お困り事の説明（一言で）"
  bind:value={overview}
  input$maxlength={32}
  onchange={check}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<Textfield
  textarea
  label="お困り事の詳細（3行で）"
  bind:value={detail}
  input$maxlength={128}
  onchange={check}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

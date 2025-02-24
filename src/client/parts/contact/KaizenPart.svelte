<script lang="ts">
  import Autocomplete from "@smui-extra/autocomplete";
  import Textfield from "@smui/Textfield";
  import CharacterCounter from "@smui/textfield/character-counter";

  let { fill = $bindable(false) } = $props();

  let feature = $state("");
  let overview = $state("");
  let detail = $state("");

  $effect(() => {
    fill = feature !== "" && overview !== "" && detail !== "";
  });

  export const getInputArray = () => [
    `対象機能：${feature}`,
    `要約：${overview}`,
    `詳細：${detail}`,
  ];
</script>

<Autocomplete
  combobox
  label="改善してほしい機能"
  bind:value={feature}
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
  label="改善案の説明（一言で）"
  bind:value={overview}
  input$maxlength={32}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<Textfield
  textarea
  label="改善案の詳細（3行で）"
  bind:value={detail}
  input$maxlength={128}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

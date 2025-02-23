<script lang="ts">
  import Autocomplete from "@smui-extra/autocomplete";
  import Textfield from "@smui/Textfield";

  let target = $state("");
  let overview = $state("");
  let detail = $state("");

  export const validate = () => {
    return true;
  };

  export const toStr = () => {
    return "";
  };
</script>

<Autocomplete
  combobox
  label="改善してほしい機能"
  bind:value={target}
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

<Textfield label="改善案の説明（1行で）" bind:value={overview} />
<Textfield textarea label="改善案の詳細（3行で）" bind:value={detail} />

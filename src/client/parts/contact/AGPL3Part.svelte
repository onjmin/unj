<script lang="ts">
  import Textfield from "@smui/Textfield";

  let username = $state("");

  export const validate = () => {
    return true;
  };

  export const toStr = () => {
    return "";
  };
</script>

<p>AGPL3.0の条件に従い、難読化前の元ソースコードを提供します。</p>
<p>
  Privateリポジトリのアクセス権を付与するので、GitHubのユーザ名を送ってください。
</p>
<Textfield label="GitHubのユーザ名" bind:value={username} />
<p>Contributeも歓迎します。</p>

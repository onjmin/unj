<script lang="ts">
  import Textfield from "@smui/Textfield";
  import CharacterCounter from "@smui/textfield/character-counter";

  let { enabledSubmit = $bindable(false) } = $props();

  let username = $state("");

  const check = () => {
    enabledSubmit = username !== "";
  };

  export const toStr = () => `ユーザ名：${username}`;
</script>

<p>AGPL3.0の条件に従い、難読化前の元ソースコードを提供します。</p>
<p>
  Privateリポジトリのアクセス権を付与するので、GitHubのユーザ名を送ってください。
</p>
<Textfield
  label="GitHubのユーザ名"
  bind:value={username}
  input$maxlength={39}
  onchange={check}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<p>Contributeも歓迎します。</p>

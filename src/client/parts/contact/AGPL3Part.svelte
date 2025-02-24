<script lang="ts">
  import Textfield from "@smui/Textfield";
  import CharacterCounter from "@smui/textfield/character-counter";

  let { fill = $bindable(false) } = $props();

  let username = $state("");

  $effect(() => {
    fill = username !== "";
  });

  export const toStr = () => `ユーザ名：${username}`;
</script>

<p>
  本プロジェクトでは、AGPL3.0の条件に基づき、難読化前のソースコードをご提供いたします。
</p>
<p>
  また、プライベートリポジトリへのアクセス権を付与いたしますので、GitHubのユーザー名をご連絡ください。
</p>
<Textfield label="GitHubのユーザ名" bind:value={username} input$maxlength={39}>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>
<p>なお、コントリビュートも歓迎いたします。</p>

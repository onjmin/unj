<script lang="ts">
  import Textfield from "@smui/Textfield";
  import CharacterCounter from "@smui/textfield/character-counter";

  let { fill = $bindable(false) } = $props();

  let username = $state("");
  let sanitizedUsername = $state("");

  $effect(() => {
    fill = username !== "";
    sanitizedUsername = username.replace(/[^a-zA-Z0-9\-]/g, "");
  });

  export const getInputArray = () => [`ユーザ名：${username}`];
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
<div class="github-profile-embed">
  {#if sanitizedUsername !== ""}
    <img
      src="https://github.com/{sanitizedUsername}.png"
      alt="{sanitizedUsername}'s Avatar"
      width="100"
      style="border-radius: 50%; margin-right: 10px;"
    />
    <img
      src="https://github-readme-stats.vercel.app/api?username={sanitizedUsername}&show_icons=true&theme=dark"
      alt="GitHub Stats"
    />
  {/if}
</div>
<p>なお、コントリビュートも歓迎いたします。</p>

<style>
  .github-profile-embed img {
    max-width: 90svw;
  }
</style>

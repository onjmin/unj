<script lang="ts">
  import Textfield from "@smui/Textfield";
  import IconButton, { Icon } from "@smui/icon-button";
  import Select, { Option } from "@smui/select";
  import CharacterCounter from "@smui/textfield/character-counter";
  import {
    contentTypeOptions,
    getContentTemplate,
  } from "../../common/validation/content-schema.js";
  import type { SiteInfo } from "../../common/validation/whitelist/site-info.js";
  import UrlSuggestionPart from "./UrlSuggestionPart.svelte";

  let {
    content = $bindable(""),
    content_url = $bindable(""),
    content_type = $bindable(1),
  } = $props();

  let open = $state(false);
  let list: SiteInfo[] = $state([]);

  $effect(() => {
    list = getContentTemplate(content_type) ?? [];
  });
</script>

<UrlSuggestionPart bind:open bind:content_url {list}>
  {#if content_type === 4}
    <p>みんなで遊べるブラウザゲームを集めました。</p>
  {:else if content_type === 8}
    <p>画像が埋め込まれます。</p>
  {:else if content_type === 16}
    <p>GIF画像が埋め込まれます。</p>
  {:else if content_type === 32}
    <p>動画再生プレイヤーが埋め込まれます。</p>
  {:else if content_type === 64}
    <p>音楽再生プレイヤーが埋め込まれます。</p>
  {/if}
</UrlSuggestionPart>

<Textfield textarea label="本文" bind:value={content} input$maxlength={1024}>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<Select bind:value={content_type} label="本文の形式">
  {#each contentTypeOptions as v}
    <Option value={v.bit}>{v.label}</Option>
  {/each}
</Select>

<Textfield
  label="URL欄"
  bind:value={content_url}
  input$maxlength={1024}
  style="{content_type !== 1 || 'visibility:hidden'};"
>
  {#snippet trailingIcon()}
    <IconButton
      class="material-icons"
      onclick={() => (open = true)}
      style="{content_type > 2 || 'visibility:hidden'};">add_link</IconButton
    >
  {/snippet}
  {#snippet helper()}
    <CharacterCounter style="{content_type !== 1 || 'visibility:hidden'};" />
  {/snippet}
</Textfield>

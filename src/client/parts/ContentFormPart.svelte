<script lang="ts">
  import IconButton, { Icon } from "@smui/icon-button";
  import Select, { Option } from "@smui/select";
  import Textfield from "@smui/textfield";
  import CharacterCounter from "@smui/textfield/character-counter";
  import {
    contentTemplateMap,
    contentTypeOptions,
  } from "../../common/request/content-schema.js";
  import type { SiteInfo } from "../../common/request/whitelist/site-info.js";
  import UrlSuggestionPart from "./UrlSuggestionPart.svelte";

  let {
    disabled = false,
    content = $bindable(""),
    contentUrl = $bindable(""),
    contentType = $bindable(1),
  } = $props();

  let open = $state(false);
  let list: SiteInfo[] = $state([]);

  $effect(() => {
    list = contentTemplateMap.get(contentType) ?? [];
  });
</script>

<UrlSuggestionPart bind:open bind:contentUrl {list}>
  {#if contentType === 4}
    <p>みんなで遊べるブラウザゲームを集めました。</p>
  {:else if contentType === 8}
    <p>画像が埋め込まれます。</p>
  {:else if contentType === 16}
    <p>GIF画像が埋め込まれます。</p>
  {:else if contentType === 32}
    <p>動画再生プレイヤーが埋め込まれます。</p>
  {:else if contentType === 64}
    <p>音楽再生プレイヤーが埋め込まれます。</p>
  {/if}
</UrlSuggestionPart>

<Textfield
  {disabled}
  textarea
  label="本文"
  bind:value={content}
  input$maxlength={1024}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<Select {disabled} bind:value={contentType} label="本文の形式">
  {#each contentTypeOptions as v}
    <Option value={v.bit}>{v.label}</Option>
  {/each}
</Select>

<Textfield
  {disabled}
  label="URL欄"
  bind:value={contentUrl}
  input$maxlength={1024}
  style="visibility:{contentType === 1 ? 'hidden' : 'visible'};"
>
  {#snippet trailingIcon()}
    <IconButton
      {disabled}
      class="material-icons"
      onclick={() => (open = true)}
      style="visibility:{contentType <= 2 ? 'hidden' : 'visible'};"
      >add_link</IconButton
    >
  {/snippet}
  {#snippet helper()}
    <CharacterCounter
      style="visibility:{contentType === 1 ? 'hidden' : 'visible'};"
    />
  {/snippet}
</Textfield>

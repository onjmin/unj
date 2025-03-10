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
  import AvatarPart from "./AvatarPart.svelte";
  import UrlTemplatePart from "./UrlTemplatePart.svelte";

  let {
    disabled = false,
    userName = $bindable(""),
    userAvatar = $bindable(0),
    content = $bindable(""),
    contentUrl = $bindable(""),
    contentType = $bindable(1),
  } = $props();

  let openUrlTemplate = $state(false);
  let openAvatar = $state(false);
  let list: SiteInfo[] = $state([]);

  $effect(() => {
    list = contentTemplateMap.get(contentType) ?? [];
  });
</script>

<UrlTemplatePart bind:open={openUrlTemplate} bind:contentUrl {list}>
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
</UrlTemplatePart>

<AvatarPart bind:open={openAvatar} bind:userAvatar />

<Textfield {disabled} label="名前" bind:value={userName} input$maxlength={32}>
  {#snippet trailingIcon()}
    <IconButton
      {disabled}
      class="material-icons"
      onclick={() => (openAvatar = true)}>image</IconButton
    >
  {/snippet}
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>
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
      onclick={() => (openUrlTemplate = true)}
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

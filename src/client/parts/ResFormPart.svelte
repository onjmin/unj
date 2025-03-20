<script lang="ts">
  import IconButton, { Icon } from "@smui/icon-button";
  import Select, { Option } from "@smui/select";
  import Textfield from "@smui/textfield";
  import CharacterCounter from "@smui/textfield/character-counter";
  import { contentTypeOptions } from "../../common/request/content-schema.js";
  import { Postload } from "../mylib/idb/postload.js";
  import AvatarPart from "./AvatarPart.svelte";
  import UrlTemplatePart from "./UrlTemplatePart.svelte";

  let {
    disabled = false,
    userName = $bindable(""),
    userAvatar = $bindable(0),
    content = $bindable(""),
    contentUrl = $bindable(""),
    contentType = $bindable(0),
  } = $props();

  let openUrlTemplate = $state(false);
  let openAvatar = $state(false);

  // postload
  const userNamePostload = new Postload("userName");
  userNamePostload.promise.then(() => {
    userName = userNamePostload.value ?? "";
  });
  $effect(() => {
    userNamePostload.value = userName;
  });

  // postload
  let loaded = $state(false);
  const userAvatarPostload = new Postload("userAvatar");
  userAvatarPostload.promise.then(() => {
    userAvatar = userAvatarPostload.value
      ? Number(userAvatarPostload.value)
      : 0;
    loaded = true;
  });
  $effect(() => {
    userAvatarPostload.value = String(userAvatar);
  });
</script>

{#if loaded}
  <AvatarPart bind:open={openAvatar} bind:userAvatar />
{/if}

<UrlTemplatePart bind:open={openUrlTemplate} bind:contentUrl {contentType} />

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

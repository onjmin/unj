<script lang="ts">
  import IconButton from "@smui/icon-button";
  import Select, { Option } from "@smui/select";
  import Textfield from "@smui/textfield";
  import CharacterCounter from "@smui/textfield/character-counter";
  import { avatarMap } from "../../common/request/avatar.js";
  import { contentTypeOptions } from "../../common/request/content-schema.js";
  import audio from "../../common/request/whitelist/audio.js";
  import gif from "../../common/request/whitelist/gif.js";
  import image from "../../common/request/whitelist/image.js";
  import { findIn } from "../../common/request/whitelist/site-info.js";
  import unjGames from "../../common/request/whitelist/unj-games.js";
  import video from "../../common/request/whitelist/video.js";
  import { UnjStorage } from "../mylib/unj-storage.js";
  import AvatarPart from "./AvatarPart.svelte";
  import UrlTemplatePart from "./UrlTemplatePart.svelte";

  const regexUrl =
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;

  let {
    disabled = false,
    textarea = $bindable(null),
    userName = $bindable(""),
    userAvatar = $bindable(0),
    contentText = $bindable(""),
    contentUrl = $bindable(""),
    contentType = $bindable(0),
    contentTypesBitmask = 0,
  } = $props();

  let openUrlTemplate = $state(false);
  let openAvatar = $state(false);

  // UnjStorage
  const userNameUnjStorage = new UnjStorage("userName");
  userName = userNameUnjStorage.value ?? "";
  $effect(() => {
    userNameUnjStorage.value = userName;
  });

  // UnjStorage
  const userAvatarUnjStorage = new UnjStorage("userAvatar");
  userAvatar = userAvatarUnjStorage.value
    ? Number(userAvatarUnjStorage.value)
    : 0;
  $effect(() => {
    userAvatarUnjStorage.value = String(userAvatar);
  });

  let avatarSrc = $state("");
  $effect(() => {
    avatarSrc = avatarMap.get(userAvatar)?.src ?? "";
  });
</script>

<AvatarPart bind:open={openAvatar} bind:userAvatar />
<UrlTemplatePart bind:open={openUrlTemplate} bind:contentUrl {contentType} />

<Textfield
  {disabled}
  label="名前"
  bind:value={userName}
  input$maxlength={32}
  class="unj-username-textfield"
  style={avatarSrc ? `background-image:url(${avatarSrc});` : ""}
>
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
  bind:this={textarea}
  bind:value={contentText}
  input$maxlength={256}
  onpaste={(e: ClipboardEvent) => {
    const pasteText = e.clipboardData?.getData("text");
    const m = pasteText?.match(regexUrl);
    if (!m) return;
    let url;
    try {
      url = new URL(m[0]);
    } catch (err) {}
    if (!url) return;
    let _contentType = 0;
    if (!!findIn(image, url.hostname)) _contentType = 4;
    else if (!!findIn(gif, url.hostname)) _contentType = 8;
    else if (!!findIn(video, url.hostname)) _contentType = 16;
    else if (!!findIn(audio, url.hostname)) _contentType = 32;
    else if (!!findIn(unjGames, url.hostname)) _contentType = 64;
    else _contentType = 2;
    if ((_contentType & contentTypesBitmask) !== 0) {
      contentType = _contentType;
      contentUrl = url.href;
    }
    setTimeout(() => (contentText = contentText.replace(m[0], "")));
  }}
>
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

<Select {disabled} key={String} bind:value={contentType} label="本文の形式">
  {#each contentTypeOptions as v}
    {#if (v.bit & contentTypesBitmask) !== 0}
      <Option value={v.bit}>{v.label}</Option>
    {/if}
  {/each}
</Select>

<Textfield
  {disabled}
  label="URL欄"
  bind:value={contentUrl}
  input$maxlength={256}
  style="visibility:{contentType <= 1 ? 'hidden' : 'visible'};"
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
      style="visibility:{contentType <= 1 ? 'hidden' : 'visible'};"
    />
  {/snippet}
</Textfield>

<style>
  :global(.unj-username-textfield) {
    background-repeat: no-repeat;
    background-position: right center;
    background-size: auto 200%;
  }
</style>

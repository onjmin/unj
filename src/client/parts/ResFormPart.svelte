<script lang="ts">
  import IconButton from "@smui/icon-button";
  import Select, { Option } from "@smui/select";
  import Textfield from "@smui/textfield";
  import CharacterCounter from "@smui/textfield/character-counter";
  import { avatarMap } from "../../common/request/avatar.js";
  import {
    Enum,
    contentTypeOptions,
  } from "../../common/request/content-schema.js";
  import audio from "../../common/request/whitelist/audio.js";
  import gif from "../../common/request/whitelist/gif.js";
  import image from "../../common/request/whitelist/image.js";
  import { findIn } from "../../common/request/whitelist/site-info.js";
  import unjGames from "../../common/request/whitelist/unj-games.js";
  import video from "../../common/request/whitelist/video.js";
  import { UnjStorage } from "../mylib/unj-storage.js";
  import AvatarPart from "./AvatarPart.svelte";
  import ColorWheelPart from "./ColorWheelPart.svelte";
  import OekakiPart from "./OekakiPart.svelte";
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
    threadId,
    oekaki,
    toDataURL = $bindable(),
    tryRes,
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

  const visibleUrlField = (contentType: number) =>
    contentType === Enum.Url || visibleTemplate(contentType);

  const visibleTemplate = (contentType: number) =>
    contentType === Enum.Image ||
    contentType === Enum.Gif ||
    contentType === Enum.Video ||
    contentType === Enum.Audio ||
    contentType === Enum.Games;
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
  onkeyup={(e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter") {
      tryRes();
    }
  }}
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
    if (!!findIn(gif, url.hostname) && url.href.slice(-4) === ".gif") {
      _contentType = Enum.Gif;
    } else if (!!findIn(image, url.hostname)) _contentType = Enum.Image;
    else if (!!findIn(video, url.hostname)) _contentType = Enum.Video;
    else if (!!findIn(audio, url.hostname)) _contentType = Enum.Audio;
    else if (!!findIn(unjGames, url.hostname)) _contentType = Enum.Games;
    else _contentType = Enum.Url;
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
  style="visibility:{visibleUrlField(contentType) ? 'visible' : 'hidden'};"
>
  {#snippet trailingIcon()}
    <IconButton
      {disabled}
      class="material-icons"
      onclick={() => (openUrlTemplate = true)}
      style="visibility:{visibleTemplate(contentType) ? 'visible' : 'hidden'};"
      >add_link</IconButton
    >
  {/snippet}
  {#snippet helper()}
    <CharacterCounter
      style="visibility:{visibleUrlField(contentType) ? 'visible' : 'hidden'};"
    />
  {/snippet}
</Textfield>

{#key contentType}
  {#if contentType === Enum.Oekaki}
    {#if oekaki}
      <OekakiPart {threadId} bind:toDataURL />
    {:else}
      <ColorWheelPart />
    {/if}
  {/if}
{/key}

<style>
  :global(.unj-username-textfield) {
    background-repeat: no-repeat;
    background-position: right center;
    background-size: auto 200%;
  }
</style>

<script lang="ts">
  import IconButton from "@smui/icon-button";
  import Select, { Option } from "@smui/select";
  import Textfield from "@smui/textfield";
  import CharacterCounter from "@smui/textfield/character-counter";
  import {
    Enum,
    contentTypeOptions,
    urlRegex,
  } from "../../common/request/content-schema.js";
  import audio from "../../common/request/whitelist/audio.js";
  import game from "../../common/request/whitelist/game.js";
  import gif from "../../common/request/whitelist/gif.js";
  import image from "../../common/request/whitelist/image.js";
  import { findIn } from "../../common/request/whitelist/site-info.js";
  import sns from "../../common/request/whitelist/sns.js";
  import video from "../../common/request/whitelist/video.js";
  import { UnjStorage } from "../mylib/unj-storage.js";
  import AvatarPart from "./AvatarPart.svelte";
  import EncryptPart from "./EncryptPart.svelte";
  import ImageUploaderPart from "./ImageUploaderPart.svelte";
  import UrlTemplatePart from "./UrlTemplatePart.svelte";
  import EmojiPickerPart from "./EmojiPickerPart.svelte";
  import { XIcon } from "@lucide/svelte";

  let {
    board,
    disabled = false,
    textarea = $bindable(null),
    userName = $bindable(""),
    userAvatar = $bindable(0),
    password = $bindable(""),
    contentText = $bindable(""),
    contentUrl = $bindable(""),
    contentType = $bindable(0),
    contentTypesBitmask = 0,
    activeLayer = $bindable(null),
    tryRes,
    isExpand = true,
    previewUrl = $bindable(""),
    menu = false,
  } = $props();

  let openUrlTemplate = $state(false);
  let openAvatar = $state(false);
  let fileName = $state("");
  let openEmojiPicker = $state(false);
  let openImageUploader = $derived(contentType === Enum.Image);

  // UnjStorage
  const userNameUnjStorage = new UnjStorage(`userName###${board.id}`);
  userName = userNameUnjStorage.value ?? "";
  $effect(() => {
    userNameUnjStorage.value = userName;
  });

  // UnjStorage
  const userAvatarUnjStorage = new UnjStorage(`userAvatar###${board.id}`);
  userAvatar = userAvatarUnjStorage.value
    ? Number(userAvatarUnjStorage.value)
    : 0;
  $effect(() => {
    userAvatarUnjStorage.value = String(userAvatar);
  });

  // UnjStorage
  const passwordUnjStorage = new UnjStorage(`password###${board.id}`);
  password = passwordUnjStorage.value ?? "";
  $effect(() => {
    passwordUnjStorage.value = password;
  });

  let avatarSrc = $state("");
  $effect(() => {
    avatarSrc = board.avatarMap.get(userAvatar)?.src ?? "";
  });

  const visibleUrlField = (contentType: number) =>
    contentType === Enum.Url || visibleTemplate(contentType);

  const visibleTemplate = (contentType: number) =>
    contentType === Enum.Image ||
    contentType === Enum.Gif ||
    contentType === Enum.Video ||
    contentType === Enum.Audio ||
    contentType === Enum.Game ||
    contentType === Enum.Sns;

  const onpaste = async (e: ClipboardEvent) => {
    let imageItem: DataTransferItem | null = null;
    let textItem: DataTransferItem | null = null;
    for (const v of e.clipboardData?.items ?? []) {
      if (v.kind === "file" && v.type.startsWith("image/")) imageItem = v;
      if (v.kind === "string" && v.type === "text/plain") textItem = v;
    }
    if (imageItem) {
      // 画像ペーストの場合
      const _contentType = Enum.Image;
      if ((_contentType & contentTypesBitmask) === 0) return;
      const blob = imageItem.getAsFile();
      if (!blob) return;
      URL.revokeObjectURL(previewUrl);
      fileName = "クリップボードの画像";
      previewUrl = URL.createObjectURL(blob);
      contentUrl = previewUrl;
      contentType = _contentType;
    } else if (textItem) {
      // 文字列ペーストの場合
      const pasteText = await new Promise<string>((resolve) =>
        textItem.getAsString(resolve),
      );
      const m = pasteText?.trim().match(urlRegex);
      if (!m) return;
      let url: URL | undefined;
      try {
        url = new URL(m[0]);
      } catch (err) {}
      if (!url) return;
      let _contentType = 0;
      if (findIn(gif, url.hostname) && url.href.slice(-4) === ".gif") {
        _contentType = Enum.Gif;
      } else if (findIn(image, url.hostname)) _contentType = Enum.Image;
      else if (findIn(video, url.hostname)) _contentType = Enum.Video;
      else if (findIn(audio, url.hostname)) _contentType = Enum.Audio;
      else if (findIn(game, url.hostname)) _contentType = Enum.Game;
      else if (findIn(sns, url.hostname)) _contentType = Enum.Sns;
      else _contentType = Enum.Url;
      if ((_contentType & contentTypesBitmask) !== 0) {
        contentType = _contentType;
        contentUrl = url.href;
      }
      setTimeout(() => {
        contentText = contentText.replace(m[0], "").trim();
      });
    }
  };
</script>

<AvatarPart {board} bind:open={openAvatar} bind:userAvatar />
<UrlTemplatePart bind:open={openUrlTemplate} bind:contentUrl {contentType} />

<Textfield
  {disabled}
  label="名前"
  bind:value={userName}
  input$maxlength={32}
  class="unj-username-textfield"
  style={avatarSrc
    ? `background-image:linear-gradient(rgba(127,127,127,0.5),rgba(127,127,127,0.5)),url(${avatarSrc});`
    : ""}
>
  {#snippet trailingIcon()}
    {#if userAvatar}
      <IconButton
        {disabled}
        class="material-icons"
        onclick={() => (userAvatar = 0)}>person_off</IconButton
      >
    {:else}
      <IconButton
        {disabled}
        class="material-icons"
        onclick={() => (openAvatar = true)}>person</IconButton
      >
    {/if}
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
  input$rows={Math.max(contentText.split("\n").length, 2)}
  input$cols={32}
  input$maxlength={1024}
  onkeyup={(e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter") {
      tryRes();
    }
  }}
  {onpaste}
>
  {#snippet trailingIcon()}
    <div class="flex gap-1 ml-auto">
      <IconButton
        {disabled}
        class="material-icons relative"
        onclick={(e: PointerEvent) => {
          e.preventDefault();
          openEmojiPicker = !openEmojiPicker;
        }}
      >
        mood
        {#if openEmojiPicker}
          <XIcon
            class="pointer-events-none absolute inset-0 m-auto text-red-500/50"
          />
        {/if}
      </IconButton>
      <IconButton
        {disabled}
        class="material-icons"
        onclick={(e: PointerEvent) => {
          e.preventDefault();
          const _contentType = openImageUploader ? Enum.Text : Enum.Image;
          if ((_contentType & contentTypesBitmask) === 0) return;
          contentType = _contentType;
        }}
      >
        {openImageUploader ? "hide_image" : "image"}
      </IconButton>
    </div>
  {/snippet}
  {#snippet helper()}
    <CharacterCounter />
  {/snippet}
</Textfield>

{#if openEmojiPicker}
  <EmojiPickerPart bind:contentText />
{/if}

{#if isExpand}
  <Select {disabled} key={String} bind:value={contentType} label="本文の形式">
    {#each contentTypeOptions as v}
      {#if (v.bit & contentTypesBitmask) !== 0}
        <Option value={v.bit}>{v.label}</Option>
      {/if}
    {/each}
  </Select>
{/if}

{#if visibleUrlField(contentType)}
  <Textfield
    {disabled}
    label="URL欄"
    bind:value={contentUrl}
    input$maxlength={1024}
    {onpaste}
  >
    {#snippet trailingIcon()}
      {#if visibleTemplate(contentType)}
        {#if contentUrl === ""}
          <IconButton
            {disabled}
            class="material-icons"
            onclick={() => {
              openUrlTemplate = true;
            }}
          >
            add_link
          </IconButton>
        {:else}
          <IconButton
            {disabled}
            class="material-icons"
            onclick={() => {
              URL.revokeObjectURL(previewUrl);
              previewUrl = "";
              contentUrl = "";
            }}
          >
            link_off
          </IconButton>
        {/if}
      {/if}
    {/snippet}
    {#snippet helper()}
      <CharacterCounter />
    {/snippet}
  </Textfield>
{/if}

{#key contentType}
  {#if openImageUploader}
    <ImageUploaderPart bind:fileName bind:previewUrl bind:contentUrl {menu} />
  {/if}
  {#if contentType === Enum.Encrypt}
    <EncryptPart bind:password />
  {/if}
{/key}

<br />

<style>
  :global(.unj-username-textfield) {
    background-repeat: no-repeat;
    background-position: right center;
    background-size: auto 200%;
  }
</style>

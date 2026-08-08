<script lang="ts">
  import IconButton from "@smui/icon-button";
  import Select, { Option } from "@smui/select";
  import Textfield from "@smui/textfield";
  import CharacterCounter from "@smui/textfield/character-counter";
  import {
    Enum,
    contentTypeOptions,
  } from "../../common/request/content-schema.js";
  import { UnjStorage } from "../mylib/unj-storage.js";
  import AvatarPart from "./AvatarPart.svelte";
  import EncryptPart from "./EncryptPart.svelte";
  import ImageUploaderPart from "./ImageUploaderPart.svelte";
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
    contentData = $bindable(""),
    encryptPlaintext = $bindable(""),
    contentTypesBitmask = 0,
    activeLayer = $bindable(null),
    tryRes,
    isExpand = true,
    previewUrl = $bindable(""),
    menu = false,
  } = $props();

  let openAvatar = $state(false);
  let fileName = $state("");
  let openEmojiPicker = $state(false);
  let openImageUploader = $derived(contentType === Enum.Image);

  // 名前欄の保存
  let userNameUnjStorage: UnjStorage;
  $effect(() => {
    if (!board?.id) return;
    const storage = new UnjStorage(`userName###${board.id}`);
    userNameUnjStorage = storage;
    userName = storage.value ?? "";
  });
  $effect(() => {
    if (!userNameUnjStorage) return;
    if (userNameUnjStorage.value === userName) return;
    userNameUnjStorage.value = userName;
  });

  // 選択中のアイコンの保存
  let userAvatarUnjStorage: UnjStorage;
  $effect(() => {
    if (!board?.id) return;
    const storage = new UnjStorage(`userAvatar###${board.id}`);
    userAvatarUnjStorage = storage;
    userAvatar = storage.value ? Number(storage.value) : 0;
  });
  $effect(() => {
    if (!userAvatarUnjStorage) return;
    const v = String(userAvatar);
    if (userAvatarUnjStorage.value === v) return;
    userAvatarUnjStorage.value = v;
  });

  // 暗号レスのパスワードの保存
  let passwordUnjStorage: UnjStorage;
  $effect(() => {
    if (!board?.id) return;
    const storage = new UnjStorage(`password###${board.id}`);
    passwordUnjStorage = storage;
    password = storage.value ?? "";
  });
  $effect(() => {
    if (!passwordUnjStorage) return;
    if (passwordUnjStorage.value === password) return;
    passwordUnjStorage.value = password;
  });

  let avatarSrc = $state("");
  $effect(() => {
    avatarSrc = board.avatarMap.get(userAvatar)?.src ?? "";
  });

  // 画像のクリップボードペーストだけここで拾う。URL文字列のペーストは
  // 通常のテキストとしてそのままcontentTextに入り、送信時にdetectContentTypeFromText
  // （content-schema.ts）が本文中のURLから種別・contentUrlを自動判定する。
  const onpaste = async (e: ClipboardEvent) => {
    let imageItem: DataTransferItem | null = null;
    for (const v of e.clipboardData?.items ?? []) {
      if (v.kind === "file" && v.type.startsWith("image/")) imageItem = v;
    }
    if (!imageItem) return;
    const _contentType = Enum.Image;
    if ((_contentType & contentTypesBitmask) === 0) return;
    const blob = imageItem.getAsFile();
    if (!blob) return;
    URL.revokeObjectURL(previewUrl);
    fileName = "クリップボードの画像";
    previewUrl = URL.createObjectURL(blob);
    contentUrl = previewUrl;
    contentType = _contentType;
  };
</script>

<AvatarPart {board} bind:open={openAvatar} bind:userAvatar />

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
  label={contentType === Enum.Dtm || contentType === Enum.Encrypt ? "コメント（任意）" : "本文"}
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

{#key contentType}
  {#if openImageUploader}
    <ImageUploaderPart bind:fileName bind:previewUrl bind:contentUrl {menu} />
  {/if}
  {#if contentType === Enum.Encrypt}
    <EncryptPart bind:plaintext={encryptPlaintext} bind:password />
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

<script lang="ts">
  import {
    Enum,
    contentTypeOptions,
  } from "../../common/request/content-schema.js";
  import { UnjStorage } from "../mylib/unj-storage.js";
  import AvatarPart from "./AvatarPart.svelte";
  import EncryptPart from "./EncryptPart.svelte";
  import ImageUploaderPart from "./ImageUploaderPart.svelte";
  import EmojiPickerPart from "./EmojiPickerPart.svelte";
  import { ImageIcon, SmileIcon, XIcon } from "@lucide/svelte";

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

  // 1ページにフォームが2つ（下部とポップアップ）あるので、label の for を分ける
  const uid = Math.random().toString(36).slice(2, 8);

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

<!-- 2ch の書き込み欄に寄せた、名前と本文だけの素朴なフォーム -->
<div class="unj-resform">
  <div class="unj-resform-name">
    <label class="unj-resform-label" for="unj-resform-name-{uid}">名前：</label>
    <input
      id="unj-resform-name-{uid}"
      class="unj-input unj-resform-name-input"
      {disabled}
      bind:value={userName}
      maxlength={32}
      placeholder="名無し"
      autocomplete="off"
    />
    {#if userAvatar}
      <button
        type="button"
        class="unj-resform-avatar"
        {disabled}
        title="アイコンを外す"
        onclick={() => (userAvatar = 0)}
      >
        {#if avatarSrc}
          <img src={avatarSrc} alt="" />
        {/if}
        <XIcon size={12} />
      </button>
    {:else}
      <button
        type="button"
        class="unj-btn unj-resform-small"
        {disabled}
        onclick={() => (openAvatar = true)}>アイコン</button
      >
    {/if}
  </div>

  <textarea
    class="unj-input unj-resform-text"
    {disabled}
    bind:this={textarea}
    bind:value={contentText}
    rows={Math.min(Math.max(contentText.split("\n").length, 3), 12)}
    maxlength={1024}
    placeholder={contentType === Enum.Dtm || contentType === Enum.Encrypt
      ? "コメント（任意）"
      : "本文（Ctrl+Enter で書き込む）"}
    onkeyup={(e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        tryRes();
      }
    }}
    {onpaste}
  ></textarea>

  <div class="unj-resform-tools">
    <button
      type="button"
      class="unj-btn unj-resform-small"
      class:unj-on={openEmojiPicker}
      {disabled}
      onclick={(e) => {
        e.preventDefault();
        openEmojiPicker = !openEmojiPicker;
      }}
    >
      <SmileIcon size={14} />絵文字
    </button>
    {#if (Enum.Image & contentTypesBitmask) !== 0}
      <button
        type="button"
        class="unj-btn unj-resform-small"
        class:unj-on={openImageUploader}
        {disabled}
        onclick={(e) => {
          e.preventDefault();
          const next = openImageUploader ? Enum.Text : Enum.Image;
          if ((next & contentTypesBitmask) === 0) return;
          contentType = next;
        }}
      >
        <ImageIcon size={14} />画像
      </button>
    {/if}
    <span class="unj-resform-count">{contentText.length}/1024</span>
  </div>

  {#if openEmojiPicker}
    <EmojiPickerPart bind:contentText />
  {/if}

  {#if isExpand}
    <label class="unj-resform-type">
      本文の形式：
      <select class="unj-input" {disabled} bind:value={contentType}>
        {#each contentTypeOptions as v}
          {#if (v.bit & contentTypesBitmask) !== 0}
            <option value={v.bit}>{v.label}</option>
          {/if}
        {/each}
      </select>
    </label>
  {/if}

  {#key contentType}
    {#if openImageUploader}
      <ImageUploaderPart bind:fileName bind:previewUrl bind:contentUrl {menu} />
    {/if}
    {#if contentType === Enum.Encrypt}
      <EncryptPart bind:plaintext={encryptPlaintext} bind:password />
    {/if}
  {/key}
</div>

<style>
  .unj-resform {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    text-align: left;
  }
  .unj-resform-name {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .unj-resform-label {
    flex: none;
    font-size: 13px;
    color: var(--unj-text-sub);
  }
  .unj-resform-name-input {
    flex: 1;
  }
  .unj-resform-avatar {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--unj-text-sub);
  }
  .unj-resform-avatar img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  .unj-resform-text {
    width: 100%;
    resize: vertical;
    line-height: 1.5;
  }
  .unj-resform-tools {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .unj-resform-small {
    font-size: 12px;
    min-height: 30px;
    padding: 3px 10px;
  }
  .unj-resform-small.unj-on {
    border-color: var(--unj-link);
    color: var(--unj-link);
  }
  .unj-resform-count {
    margin-left: auto;
    font-size: 11px;
    color: var(--unj-text-faint);
  }
  .unj-resform-type {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--unj-text-sub);
  }
</style>

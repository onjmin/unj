<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import IconButton from "@smui/icon-button";
  import Snackbar from "@smui/snackbar";
  import Textfield from "@smui/textfield";
  import { format } from "date-fns";
  import { ja } from "date-fns/locale";
  import { avatarMap } from "../../common/request/avatar.js";
  import { seededRandArray } from "../../common/util.js";
  import { activeController } from "../mylib/background-embed.js";
  import { adminTwitterUsername, makeHref } from "../mylib/env.js";
  import EmbedPart from "./EmbedPart.svelte";

  let {
    children = null,
    backgroundEmbedControls = false,
    focus,
    input = $bindable(""),
    // 書き込み内容
    ccUserId = "",
    ccUserName = "",
    ccUserAvatar = 0,
    contentText = "",
    contentUrl = "",
    contentType = 0,
    commandResult = "",
    ps = "",
    // メタ情報
    cursor = "",
    num = 0,
    isOwner = false,
    sage = false,
    createdAt = new Date(),
    // メタ情報
    threadId = "",
    threadTitle = "",
  } = $props();

  let open = $state(false);
  let snackbar: Snackbar;
  let snackbar2: Snackbar;
  $effect(() => () => snackbar.close());
  $effect(() => () => snackbar2.close());

  const makeSharedLink = () => makeHref(`/thread/${threadId}/${cursor}`);
  let sharedLink = $state("");

  $effect(() => {
    if (open) {
      sharedLink = makeSharedLink();
    }
  });
</script>

<Dialog
  bind:open
  selection
  aria-labelledby="share-title"
  aria-describedby="share-content"
>
  <Title id="share-title"
    >{num > 1 ? `>>${num}のレスを共有` : "このスレを共有"}</Title
  >
  <Content id="share-content">
    <Button
      onclick={() => {
        const url = new URL("https://x.com/intent/post");
        Object.entries({
          url: makeSharedLink(),
          text: threadTitle,
          via: adminTwitterUsername,
          related: adminTwitterUsername,
        }).forEach(([k, v]) => url.searchParams.append(k, v));
        window.open(url.href, "_blank");
      }}
      variant="raised">Xで共有</Button
    >
    <Textfield bind:value={sharedLink} label="共有リンク">
      {#snippet trailingIcon()}
        <IconButton
          class="material-icons"
          onclick={async () => {
            try {
              await navigator.clipboard.writeText(makeSharedLink());
              snackbar.open();
            } catch (err) {}
          }}>content_copy</IconButton
        >
      {/snippet}
    </Textfield>
  </Content>
  <Actions>
    <Button>
      <Label>閉じる</Label>
    </Button>
  </Actions>
</Dialog>

<Snackbar bind:this={snackbar}>
  <Label>コピーしました</Label>
</Snackbar>

<Snackbar bind:this={snackbar2}>
  <Label>バツポチしました</Label>
</Snackbar>

<div class="res">
  <!-- 上段: 名前欄 -->
  <div class="name-row">
    <button
      class="reply {sage ? 'sage' : ''}"
      onclick={() => {
        const m = input.match(/>>([0-9]+)/);
        if (m) {
          input = input.replace(/>>([0-9]+)/, `>>${num}`);
        } else {
          input = input.replace(/^[^\S]*/, `>>${num}\n`);
        }
        focus();
      }}
      >{num}：<span class="user-name"
        >{ccUserName !== ""
          ? ccUserName
          : seededRandArray(
              [
                "花散れば名無し",
                "鳥啼けば名無し",
                "風吹けば名無し",
                "月沈めば名無し",
              ],
              threadId,
            )}</span
      >
    </button>：{format(createdAt, "yy/MM/dd(EEE) HH:mm:ss", {
      locale: ja,
    })}
    ID:{ccUserId !== "" ? ccUserId : "???"}
    {#if isOwner}
      <span class="thread-owner system-color">主</span>
    {/if}
    <IconButton class="material-icons" onclick={() => (open = true)}
      >share</IconButton
    >
    <IconButton
      class="material-icons"
      onclick={() => {
        snackbar2.open();
      }}>block</IconButton
    >
    {#if backgroundEmbedControls}
      <IconButton
        class="material-icons"
        onclick={() => {
          activeController?.play();
        }}>play_arrow</IconButton
      >
      <IconButton
        class="material-icons"
        onclick={() => {
          activeController?.pause();
        }}>pause</IconButton
      >
    {/if}
  </div>
  <!-- 下段: アイコンと内容 -->
  <div class="content-row">
    <!-- 固定幅・高さのアイコン -->
    {#if ccUserAvatar && avatarMap.get(ccUserAvatar)}
      <div
        class="avatar"
        style="background-image:url({avatarMap.get(ccUserAvatar)?.src});"
      ></div>
    {:else}
      <div class="empty-avatar"></div>
    {/if}
    <!-- 右側のコンテンツ領域 -->
    <div class="content">
      {#if contentText !== ""}
        <div class="content-text">
          {contentText}
        </div>
      {/if}
      {#if commandResult !== ""}
        <div class="content-text system-color">
          {commandResult}
        </div>
      {/if}
      {#if ps !== ""}
        <div class="ps">
          <br />
          <div class="system-color">※追記</div>
          <div class="content-text">{ps}</div>
        </div>
      {/if}
      {#if contentUrl !== ""}
        <div class="content-url">
          <a href={contentUrl} target="_blank" rel="noopener noreferrer">
            {contentUrl}
          </a>
        </div>
        {#key num}
          <div class="content-embed">
            <EmbedPart {ccUserAvatar} {contentUrl} {contentType} />
          </div>
        {/key}
      {/if}
    </div>
  </div>
  {@render children?.()}
</div>

<style>
  .system-color {
    color: #e57373;
  }
  .sage {
    text-decoration: underline;
  }
  .sage:before {
    content: "↓";
  }
  .reply {
    background-color: transparent; /* 背景を透明に */
    border: none; /* 枠線をなくす（必要に応じて） */
    color: inherit; /* 親要素の文字色を継承 */
    font-size: inherit; /* 親要素のフォントサイズを継承 */
    cursor: pointer;
    padding-right: 0;
  }
  .reply:hover {
    opacity: 0.8; /* ホバー時の透明度を変更（任意） */
  }
  .res {
    border: 2mm ridge rgba(255, 255, 255, 0.1);
  }
  /* 名前欄は全幅で上段に表示 */
  .name-row {
    width: 100%;
  }
  .user-name {
    color: #409090;
    font-weight: bold;
  }
  .thread-owner {
    font-size: small;
  }
  /* content-row はアイコンと内容を横並びに */
  .content-row {
    display: flex;
    align-items: flex-start;
    width: 100%;
  }
  /* avatar は固定サイズ、左側に配置 */
  .empty-avatar {
    width: 32px;
  }
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    margin-right: 8px;
    background-size: cover;
    background-position: center center;
  }
  /* content は縦並びに、右側の残りスペースを使用 */
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    inline-size: 768px;
    max-inline-size: 100%;
  }
  /* content-text は改行を含むテキストを自動折り返し */
  .content-text {
    display: block;
    white-space: pre-wrap; /* 改行も反映、必要に応じて折り返す */
    overflow-wrap: break-word; /* 長い単語も折り返し */
    margin-bottom: 2px;
  }
  .content-url,
  .content-embed {
    margin-bottom: 2px;
  }
  .content-url a {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>

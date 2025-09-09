<script lang="ts">
  import { createToaster } from "@skeletonlabs/skeleton-svelte";
  import { Toaster } from "@skeletonlabs/skeleton-svelte";
  import IconButton from "@smui/icon-button";
  import { format } from "date-fns";
  import { ja } from "date-fns/locale";
  import { avatarMap } from "../../common/request/avatar.js";
  import { seededRandArray } from "../../common/util.js";
  import { activeController } from "../mylib/background-embed.js";
  import { makeHref } from "../mylib/env.js";
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
    num = 0,
    isOwner = false,
    sage = false,
    createdAt = new Date(),
    // メタ情報
    threadId = "",
  } = $props();

  const toaster = createToaster();
</script>

<div
  class="bg-transparent border-[2mm] border-solid border-white border-opacity-10 p-4 rounded-lg shadow-inner"
>
  <!-- 上段: 名前欄 -->
  <div class="w-full text-gray-500 text-sm">
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
      >{num}：<span class="text-[#409090] font-bold"
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
      <span class="text-xs system-color">主</span>
    {/if}
    <button
      class="material-icons text-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 ease-in-out font-['Lucida_Grande']"
      onclick={() => {
        if (ccUserId) {
          toaster.success({
            title: `ID:${ccUserId}をバツポチしました`,
          });
        }
      }}
    >
      close
    </button>
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
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="cursor-pointer"
          >
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

<Toaster {toaster}></Toaster>

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

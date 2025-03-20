<script lang="ts">
  import { format } from "date-fns";
  import { ja } from "date-fns/locale";
  import { avatarMap } from "../../common/request/avatar.js";
  import { seededRandArray } from "../../common/util.js";
  import EmbedPart from "./EmbedPart.svelte";

  let {
    children = null,
    input = $bindable(""),
    // 書き込み内容
    ccUserId = "",
    ccUserName = "",
    ccUserAvatar = 0,
    content = "",
    contentUrl = "",
    contentType = 0,
    commandResult = "",
    // メタ情報
    id = "",
    num = 0,
    isOwner = false,
    sage = false,
    createdAt = new Date(),
    // メタ情報
    threadId = "",
  } = $props();
</script>

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
      <span class="thread-owner">主</span>
    {/if}
  </div>
  <!-- 下段: アイコンと内容 -->
  <div class="content-row">
    <!-- 固定幅・高さのアイコン -->
    {#if ccUserAvatar && avatarMap.get(ccUserAvatar)}
      <div class="avatar">
        <img src={avatarMap.get(ccUserAvatar)?.src} alt="User Avatar" />
      </div>
    {:else}
      <div class="empty-avatar"></div>
    {/if}
    <!-- 右側のコンテンツ領域 -->
    <div class="content">
      {#if content !== ""}
        <div class="content-text">
          {content}
        </div>
      {/if}
      {#if commandResult !== ""}
        <div class="command-result">
          {commandResult}
        </div>
      {/if}
      {#if contentUrl !== ""}
        <div class="content-url">
          <a href={contentUrl} target="_blank" rel="noopener noreferrer">
            {contentUrl}
          </a>
        </div>
      {/if}
      <div class="content-embed">
        <EmbedPart {ccUserAvatar} {contentUrl} {contentType} />
      </div>
    </div>
  </div>
  {@render children?.()}
</div>

<style>
  .sage {
    text-decoration: underline;
  }
  .sage:before {
    content: "🠋";
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
    padding: 8px;
  }
  /* 名前欄は全幅で上段に表示 */
  .name-row {
    width: 100%;
    margin-bottom: 8px;
  }
  .user-name {
    color: #66c0b5;
    font-weight: bold;
  }
  .thread-owner {
    color: #e57373;
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
    flex: 0 0 auto;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    margin-right: 8px;
    overflow: hidden;
    display: flex; /* 中央寄せするならflexが楽 */
    justify-content: center;
    align-items: center;
    background-color: #333; /* 透明な画像の場合の背景 */
  }
  .avatar img {
    width: 100%;
    height: auto;
    object-fit: cover;
    object-position: center center;
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
    margin-bottom: 4px;
  }
  .command-result {
    color: #e57373;
    display: block;
    white-space: pre-wrap; /* 改行も反映、必要に応じて折り返す */
    overflow-wrap: break-word; /* 長い単語も折り返し */
    margin-bottom: 4px;
  }
  .content-url,
  .content-embed {
    margin-bottom: 4px;
  }
  .content-url a {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>

<script lang="ts">
  import { BanIcon, XIcon } from "@lucide/svelte";
  import { Toast, createToaster } from "@skeletonlabs/skeleton-svelte";
  import IconButton from "@smui/icon-button";
  import { format } from "date-fns";
  import { ja } from "date-fns/locale";
  import { Link } from "svelte-routing";
  import {
    Enum,
    ankaRegex,
    contentTemplateMap,
  } from "../../common/request/content-schema.js";
  import { findIn } from "../../common/request/whitelist/site-info.js";
  import { seededRandArray } from "../../common/util.js";
  import { activeController } from "../mylib/background-embed.js";
  import { makePathname } from "../mylib/env.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { jumpToAnka, makeUnjResNumId } from "../mylib/scroll.js";
  import DecryptPart from "./DecryptPart.svelte";
  import EmbedPart from "./EmbedPart.svelte";
  import {
    customAnimeEmojiMap,
    customEmojiMap,
  } from "../mylib/emoji/custom.js";
  import CustomEmojiPart from "./emoji/CustomEmojiPart.svelte";

  let {
    board,
    children = null,
    backgroundEmbedControls = false,
    focus,
    ignoreList = $bindable(),
    oekakiCollab = $bindable(""),
    bindContentText = $bindable(""),
    bindContentType = $bindable(0),
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

  const url = (() => {
    try {
      return new URL(contentUrl);
    } catch (err) {}
  })();
  const temp = contentTemplateMap.get(contentType) ?? [];
  const siteInfo = url ? findIn(temp, url.hostname) : null;

  const toaster = createToaster();
  const ignoreListCache = new ObjectStorage<string[]>("ignoreListCache");
  let showBlockButtons: boolean = $state(false);

  const ankaRegex2 = new RegExp(ankaRegex.source); // 分類チェック用に g なしで生成
  const discordEmojiRegex = /:[A-Za-z0-9_]{1,32}:/;
  const combinedRegex = new RegExp(
    `\n|${ankaRegex.source}|${discordEmojiRegex.source}`,
    "g",
  );

  const parseContent = function* (text: string) {
    let lastIndex = 0;
    let match: RegExpExecArray | null = combinedRegex.exec(text);

    while (match !== null) {
      if (match.index > lastIndex) {
        yield {
          type: "text" as const,
          value: text.slice(lastIndex, match.index),
        };
      }

      const token = match[0];

      if (token === "\n") {
        yield {
          type: "br" as const,
          value: null,
        };
      }

      if (ankaRegex2.test(token)) {
        yield {
          type: "anka" as const,
          value: token.slice(2), // >>1234 → "1234"
        };
      }

      if (discordEmojiRegex.test(token)) {
        const key = token.slice(1, -1); // :name: → "name"

        if (customEmojiMap.has(key)) {
          yield {
            type: "customEmoji" as const,
            value: customEmojiMap.get(key),
            alt: token,
          };
        }

        if (customAnimeEmojiMap.has(key)) {
          yield {
            type: "customAnimeEmoji" as const,
            value: customAnimeEmojiMap.get(key),
            alt: token,
          };
        }
      }

      lastIndex = combinedRegex.lastIndex;
      match = combinedRegex.exec(text);
    }

    if (lastIndex < text.length) {
      yield {
        type: "text" as const,
        value: text.slice(lastIndex),
      };
    }
  };
</script>

<div
  id={makeUnjResNumId(num)}
  class="bg-transparent p-4 rounded-lg shadow-inner"
>
  <!-- 上段: 名前欄 -->
  <div class="unj-font w-full text-gray-500 text-sm">
    <button
      class="reply {sage ? 'sage' : ''}"
      onclick={() => {
        bindContentText = bindContentText
          .replace(ankaRegex, "")
          .replace(/^[^\S]*/, `>>${num}\n`);
        focus();
      }}
      >{num}：<span
        class={`font-bold ${ccUserName.includes("★") ? "text-red-400" : "text-teal-600"}`}
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

    {#if ccUserId === ""}
      ID:???
    {:else if ccUserId === "AI"}
      ID:{ccUserId}
    {:else}
      ID:<Link to={makePathname(`/${board.key}/search?q=${ccUserId}`)}
        >{ccUserId}</Link
      >
    {/if}

    {#if isOwner}
      <span class="text-xs text-red-400">主</span>
    {/if}
    {#if showBlockButtons}
      <div class="inline-flex shrink-0 space-x-2 items-end">
        <button
          class="p-1 rounded-full text-red-500 bg-gray-100 hover:text-gray-500 self-end"
          onclick={() => {
            if (ccUserId && ignoreList) {
              toaster.success({
                title: `ID:${ccUserId}をバツポチしました`,
              });
              ignoreList.add(ccUserId);
              ignoreList = new Set(ignoreList);
              ignoreListCache.set([...ignoreList]);
              showBlockButtons = false; // 処理後に元の状態に戻す
            }
          }}
        >
          <BanIcon class="h-4 w-4" />
        </button>

        <button
          class="p-1 rounded-full hover:text-gray-500 self-end"
          onclick={() => {
            showBlockButtons = false; // 元の状態に戻る
          }}
        >
          <XIcon class="h-4 w-4" />
        </button>
      </div>
    {:else}
      <button
        class="hover:text-gray-500 transition-colors duration-200 ease-in-out self-end"
        onclick={() => {
          showBlockButtons = true; // クリックで2つのボタンを表示
        }}
      >
        <XIcon class="h-4 w-4" />
      </button>
    {/if}
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
    {#if ccUserAvatar && board.avatarMap.get(ccUserAvatar)}
      <div
        class="avatar"
        style="background-image:url({board.avatarMap.get(ccUserAvatar)?.src});"
      ></div>
    {:else}
      <div class="empty-avatar"></div>
    {/if}
    <!-- 右側のコンテンツ領域 -->
    <div class="content">
      {#if contentText !== ""}
        <div class="unj-font content-text">
          {#each parseContent(contentText) as part}
            {#if part.type === "text"}
              <span>{part.value}</span>
            {:else if part.type === "br"}
              <br />
            {:else if part.type === "anka"}
              <span
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="cursor-pointer hover:underline text-blue-500 text-base align-baseline"
                onclick={() =>
                  jumpToAnka(board.key, Number(part.value), threadId)}
                >>>{part.value}</span
              >
            {:else if part.type === "customEmoji"}
              <CustomEmojiPart size="22" emoji={part.value} alt={part.alt} />
            {:else if part.type === "customAnimeEmoji"}
              <CustomEmojiPart
                size="22"
                emoji={part.value}
                alt={part.alt}
                anime
              />
            {/if}
          {/each}
          <!-- {makeSeededSuffix(createdAt.toString())} -->
        </div>
      {/if}
      {#if commandResult !== ""}
        <div class="content-text text-red-400">
          {commandResult}
        </div>
      {/if}
      {#if ps !== ""}
        <div class="ps">
          <br />
          <div class="text-red-400">※追記</div>
          <div class="content-text">{ps}</div>
        </div>
      {/if}
      {#if contentUrl !== ""}
        <div class="content-url">
          <a
            href={siteInfo?.id === 1616 ? siteInfo.href : contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="cursor-pointer"
          >
            {contentUrl}
          </a>
        </div>
        {#key num}
          <div class="content-embed">
            <EmbedPart
              {ccUserId}
              {contentUrl}
              {contentType}
              resNum={num}
              bind:oekakiCollab
              bind:bindContentText
              bind:bindContentType
            />
          </div>
        {/key}
      {/if}
      {#if contentType === Enum.Dtm}
        <div class="text-red-400">※DTM機能</div>
        <DecryptPart bind:contentText bind:contentType />
      {/if}
      {#if contentType === Enum.Encrypt}
        <div class="text-red-400">※暗号レス</div>
        <DecryptPart bind:contentText bind:contentType />
      {/if}
    </div>
  </div>
  {@render children?.()}
</div>

<Toast.Group {toaster}>
  {#snippet children(toast)}
    <Toast {toast}>
      <Toast.Message>
        <Toast.Title>{toast.title}</Toast.Title>
        <Toast.Description>{toast.description}</Toast.Description>
      </Toast.Message>
      <Toast.CloseTrigger />
    </Toast>
  {/snippet}
</Toast.Group>

<style>
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
  .content-text {
    font-size: 0; /* inline-block 間の空白を消す */
    line-height: 1.2; /* 好みに合わせる */
    white-space: pre-wrap; /* 改行も反映 */
  }
  :global(.content-text img),
  :global(.content-text span) {
    display: inline-block;
    vertical-align: middle;
    font-size: 16px; /* 元の文字サイズに戻す */
    margin: 0;
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

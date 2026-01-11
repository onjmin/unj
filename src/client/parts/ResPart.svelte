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
  import {
    findIn,
    SiteInfo,
  } from "../../common/request/whitelist/site-info.js";
  import { seededRandArray } from "../../common/util.js";
  import { activeController } from "../mylib/background-embed.js";
  import { makePathname } from "../mylib/env.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import DecryptPart from "./DecryptPart.svelte";
  import EmbedPart from "./EmbedPart.svelte";
  import {
    customAnimeEmojiMap,
    customEmojiMap,
  } from "../mylib/emoji/custom.js";
  import CustomEmojiPart from "./emoji/CustomEmojiPart.svelte";
  import { makeHalloweenEmojiSuffix } from "../mylib/emoji/halloween.js";
  import { Anniversary, isAnniversary } from "../mylib/anniversary.js";
  import { makeValentineEmojiSuffix } from "../mylib/emoji/valentine.js";

  let {
    onRequestFloating = () => {},
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

  let siteInfo: SiteInfo | null = $state(null);

  $effect(() => {
    let url: URL | undefined;
    try {
      url = new URL(contentUrl);
    } catch {}
    const temp = contentTemplateMap.get(contentType) ?? [];
    siteInfo = url ? findIn(temp, url.hostname) : null;
  });

  const toaster = createToaster();
  const ignoreListCache = new ObjectStorage<string[]>("ignoreListCache");
  let showBlockButtons: boolean = $state(false);

  const ankaRegex2 = new RegExp(ankaRegex.source); // 分類チェック用に g なしで生成
  const discordEmojiRegex = /:[A-Za-z0-9_~]{1,32}:/;
  const combinedRegex = new RegExp(
    `\n|${ankaRegex.source}|${discordEmojiRegex.source}`,
    "g",
  );

  const parseContent = function* (text: string) {
    let lastIndex = 0;
    let match: RegExpExecArray | null = combinedRegex.exec(text);
    let emojiCount = 32;

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
        if (emojiCount <= 0) {
          yield {
            type: "text" as const,
            value: token,
          };
        } else {
          emojiCount--;
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

<div class="bg-transparent p-2 sm:p-4 rounded-lg shadow-inner">
  <!-- 上段: 名前欄 -->
  <div class="unj-font w-full text-gray-500 text-xs sm:text-sm">
    <button
      class="bg-transparent border-0 text-inherit cursor-pointer pr-0 hover:opacity-80 {sage
        ? 'underline sage'
        : ''}"
      onclick={() => {
        bindContentText = bindContentText
          .replace(ankaRegex, "")
          .replace(/^[^\S]*/, `>>${num}\n`);
        focus();
      }}
    >
      {num}:
      <span
        class={`font-bold ${
          ccUserName.includes("★") ? "text-red-500" : "text-teal-600"
        }`}
      >
        {ccUserName !== ""
          ? ccUserName
          : seededRandArray(
              [
                "花散れば名無し",
                "鳥啼けば名無し",
                "風吹けば名無し",
                "月沈めば名無し",
              ],
              threadId,
            )}
      </span>
    </button>
    <span>:</span>
    <span>{format(createdAt, "yy/MM/dd(EEE) HH:mm:ss", { locale: ja })}</span>

    <span class="inline-flex items-baseline whitespace-nowrap gap-1">
      {#if ccUserId === ""}
        <span>ID:???</span>
      {:else if ccUserId === "AI"}
        <span>ID:{ccUserId}</span>
      {:else}
        <Link
          class="hover:underline"
          to={makePathname(`/${board.key}/search?q=${ccUserId}`)}
        >
          ID:{ccUserId}
        </Link>
      {/if}
    </span>

    {#if isOwner}
      <span class="text-red-500">主</span>
    {/if}

    <div
      class="inline-flex shrink-0 items-baseline w-12 align-baseline relative top-1"
    >
      {#if showBlockButtons}
        <div class="inline-flex space-x-1">
          <button
            class="p-0.5 rounded text-red-500 hover:bg-gray-100"
            onclick={() => {
              if (ccUserId && ignoreList) {
                toaster.success({ title: `ID:${ccUserId}をバツポチしました` });
                ignoreList.add(ccUserId);
                ignoreList = new Set(ignoreList);
                ignoreListCache.set([...ignoreList]);
                showBlockButtons = false;
              }
            }}
          >
            <BanIcon class="h-3.5 w-3.5" />
          </button>

          <button
            class="p-0.5 rounded hover:bg-gray-100 text-gray-500"
            onclick={() => (showBlockButtons = false)}
          >
            <XIcon class="h-3.5 w-3.5" />
          </button>
        </div>
      {:else}
        <div class="inline-flex">
          <button
            class="p-0.5 rounded hover:bg-gray-100 text-gray-500"
            onclick={() => (showBlockButtons = true)}
          >
            <XIcon class="h-3.5 w-3.5" />
          </button>
        </div>
      {/if}
    </div>

    {#if backgroundEmbedControls}
      <IconButton
        class="material-icons"
        onclick={() => activeController?.play()}
      >
        play_arrow
      </IconButton>
      <IconButton
        class="material-icons"
        onclick={() => activeController?.pause()}
      >
        pause
      </IconButton>
    {/if}
  </div>

  <!-- 下段: アイコンと内容 -->
  <div class="flex items-start w-full">
    {#if ccUserAvatar && board.avatarMap.get(ccUserAvatar)}
      <div class="relative w-16 h-16">
        <div
          class="w-16 h-16 rounded-full mr-2 bg-cover bg-center"
          style="background-image:url({board.avatarMap.get(ccUserAvatar)
            ?.src});"
        ></div>
        {#if isAnniversary([Anniversary.CHRISTMAS])}
          <img
            src="https://cdn-icons-png.flaticon.com/32/17010/17010575.png"
            alt=""
            aria-hidden="true"
            class="absolute -top-4 -left-5 w-12 pointer-events-none select-none -rotate-36"
          />
        {/if}
      </div>
    {:else}
      <div class="w-8"></div>
    {/if}

    <!-- 右側のコンテンツ領域 -->
    <div class="flex flex-col flex-1 min-w-0 w-3xl max-w-full">
      {#if contentText !== ""}
        {@const parts = [...parseContent(contentText)]}
        {@const isAllEmoji = parts.every(
          (v) =>
            v.type === "br" ||
            v.type === "customEmoji" ||
            v.type === "customAnimeEmoji",
        )}
        <div class="unj-font text-base leading-[1.2]">
          {#each parts as part}
            {#if part.type === "text"}
              <span
                class="inline-block align-middle m-0 wrap-anywhere max-w-full"
              >
                {part.value}
              </span>
            {:else if part.type === "br"}
              <br />
            {:else if part.type === "anka"}
              <span
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="cursor-pointer text-blue-500 hover:underline"
                onmouseenter={(e) =>
                  onRequestFloating?.(Number(part.value), e, false)}
                onclick={(e) =>
                  onRequestFloating?.(Number(part.value), e, true)}
              >
                &gt;&gt;{part.value}
              </span>
            {:else if part.type === "customEmoji"}
              <CustomEmojiPart
                size={isAllEmoji ? "48" : "22"}
                emoji={part.value}
                alt={part.alt}
              />
            {:else if part.type === "customAnimeEmoji"}
              <CustomEmojiPart
                size={isAllEmoji ? "48" : "22"}
                emoji={part.value}
                alt={part.alt}
                anime
              />
            {/if}
          {/each}

          {#if isAnniversary([Anniversary.VALENTINE])}
            <span>{makeValentineEmojiSuffix(createdAt.toString())}</span>
          {/if}
          {#if isAnniversary([Anniversary.HALLOWEEN])}
            <span>{makeHalloweenEmojiSuffix(createdAt.toString())}</span>
          {/if}
          {#if isAnniversary([Anniversary.CHRISTMAS])}
            <span class="text-rainbow"
              >{seededRandArray(["★", "☆"], createdAt.toString())}</span
            >
          {/if}
        </div>
      {/if}

      {#if commandResult !== ""}
        <div class="text-red-500 text-base leading-[1.2]">
          {commandResult}
        </div>
      {/if}

      {#if ps !== ""}
        <div>
          <br />
          <div class="text-red-500">※追記</div>
          <div class="text-base leading-[1.2] wrap-anywhere max-w-full">
            <span
              class="inline-block align-middle text-base m-0 wrap-anywhere max-w-full"
            >
              {ps}
            </span>
          </div>
        </div>
      {/if}

      {#if contentUrl !== ""}
        <div class="mb-0.5 wrap-anywhere">
          <a
            href={siteInfo?.id === 1616 ? siteInfo.href : contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="cursor-pointer"
          >
            {contentUrl}
          </a>
        </div>

        {#key contentUrl}
          <div class="mb-0.5">
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
        <div class="text-red-500">※DTM機能</div>
        <DecryptPart bind:contentText bind:contentType />
      {/if}

      {#if contentType === Enum.Encrypt}
        <div class="text-red-500">※暗号レス</div>
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
  .sage:before {
    content: "↓";
  }
</style>

<script lang="ts">
  import { BanIcon, XIcon } from "@lucide/svelte";
  import IconButton from "@smui/icon-button";
  import List, {
    Item,
    Graphic,
    Text,
    PrimaryText,
    SecondaryText,
  } from "@smui/list";
  import { format } from "date-fns";
  import { ja } from "date-fns/locale";
  import { Link, navigate } from "svelte-routing";
  import {
    CHORD_MARKER,
    Enum,
    ankaRegex,
    contentTemplateMap,
    extractChordsFromContent,
    hashtagRegex,
    urlRegex,
  } from "../../common/request/content-schema.js";
  import {
    findIn,
    SiteInfo,
  } from "../../common/request/whitelist/site-info.js";
  import { seededRandArray } from "../../common/util.js";
  import { activeController } from "../mylib/background-embed.js";
  import { makePathname } from "../mylib/env.js";
  import { ObjectStorage } from "../mylib/object-storage.js";
  import { makeUnjResNumId, scrollToResNum, scrollToEnd } from "../mylib/scroll.js";
  import ChordPlayerPart from "./ChordPlayerPart.svelte";
  import DecryptPart from "./DecryptPart.svelte";
  import DtmPlayerPart from "./DtmPlayerPart.svelte";
  import EmbedPart from "./EmbedPart.svelte";
  import { activeHeavyId } from "../mylib/store.js";
  import {
    customAnimeEmojiMap,
    customEmojiMap,
  } from "../mylib/emoji/custom.js";
  import CustomEmojiPart from "./emoji/CustomEmojiPart.svelte";
  import { makeHalloweenEmojiSuffix } from "../mylib/emoji/halloween.js";
  import { Anniversary, isAnniversary } from "../mylib/anniversary.js";
  import { makeValentineEmojiSuffix } from "../mylib/emoji/valentine.js";
  import { sharedToaster } from "../mylib/toaster.js";

const ankaMatchAllRegex = new RegExp(ankaRegex.source, "g");

  type ResData = {
    num: number;
    ccUserId: string;
    ccUserName: string;
    ccUserAvatar: number;
    contentText: string;
    contentUrl: string;
    contentType: number;
    contentData: string;
    commandResult?: string;
    isOwner?: boolean;
    sage?: boolean;
    createdAt: Date;
  };

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
    bindContentData = $bindable(""),
    // 書き込み内容
    ccUserId = "",
    ccUserName = "",
    ccUserAvatar = 0,
    contentText = "",
    contentUrl = "",
    contentType = 0,
    contentData = "",
    commandResult = "",
    ps = "",
    // メタ情報
    num = 0,
    isOwner = false,
    sage = false,
    createdAt = new Date(),
    // メタ情報
    threadId = "",
    // 安価展開用
    resList = [],
    ageRes = null,
    // スレ内検索ハイライト（おんJの<HIT>相当）
    highlightQuery = "",
  } = $props();

  let siteInfo: SiteInfo | null = $state(null);
  let showDtm = $state(true);
  const myDtmHeavyId = {};

  $effect(() => {
    const unsub = activeHeavyId.subscribe((id) => {
      if (showDtm && id !== null && id !== myDtmHeavyId) {
        showDtm = false;
      }
    });
    return unsub;
  });

  // content_url が空でも、content_type が埋め込み対応種別（画像/動画/…）なら
  // content_text 中からその種別のホワイトリストに合致するURLを探して代用する。
  // 共有DB経由（unj-reze等）の投稿で content_url を持たないケースがあるため。
  const embedUrlRegexGlobal = new RegExp(urlRegex.source, "g");
  const findEmbedUrlInText = (text: string, type: number): string => {
    const whitelist = contentTemplateMap.get(type) ?? [];
    if (whitelist.length === 0) return "";
    const urls = text.match(embedUrlRegexGlobal) ?? [];
    for (const raw of urls) {
      try {
        if (findIn(whitelist, new URL(raw).hostname)) return raw;
      } catch {}
    }
    return "";
  };
  let effectiveContentUrl = $derived(
    contentUrl !== "" ? contentUrl : findEmbedUrlInText(contentText, contentType),
  );

  $effect(() => {
    let url: URL | undefined;
    try {
      url = new URL(effectiveContentUrl);
    } catch {}
    const temp = contentTemplateMap.get(contentType) ?? [];
    siteInfo = url ? findIn(temp, url.hostname) : null;
  });

  const ignoreListCache = new ObjectStorage<string[]>("ignoreListCache");
  let showBlockButtons: boolean = $state(false);

  const discordEmojiRegex = /:[A-Za-z0-9_~]{1,32}:/;
  // 本文にURLを書けるようになったので、素の文字列ではなくリンクとして描く。
  // ankaRegex より先に置くと `>>1` を含むURLが千切れるため、順序は末尾に固定する。
  const combinedRegex = new RegExp(
    `\n|${ankaRegex.source}|${discordEmojiRegex.source}|${urlRegex.source}|${hashtagRegex.source}`,
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

      // 判定は排他にする。URLは `http://x.com/a:bb:c` のように絵文字記法を
      // 内包しうるので、非排他の if を並べると1トークンが二重にyieldされる。
      if (token === "\n") {
        yield {
          type: "br" as const,
          value: null,
        };
      } else if (ankaRegex.test(token)) {
        yield {
          type: "anka" as const,
          value: token.slice(2), // >>1234 → "1234"
        };
      } else if (urlRegex.test(token)) {
        yield {
          type: "url" as const,
          value: token,
        };
      } else if (hashtagRegex.test(token)) {
        yield {
          type: "hashtag" as const,
          value: token,
        };
      } else if (discordEmojiRegex.test(token)) {
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

  // コード進行は「#コード進行」マーカーより前＝コメント／後＝コード進行データの1本管理。
  // 表示ではコメント部分だけを通常本文として扱い、コード進行部分はChordPlayerPartに渡す。
  let chordParsed = $derived(
    contentType === Enum.Chord ? extractChordsFromContent(contentText) : null,
  );
  let displayText = $derived(
    chordParsed ? chordParsed.comment : contentText,
  );
  let parts = $derived(
    displayText !== ""
      ? [...parseContent(displayText)]
      : [],
  );

  // スレ内検索ハイライト用: テキストをキーワードで分割する
  const splitByHighlight = (text: string, query: string) => {
    if (!query) return [{ value: text, hit: false }];
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "gi");
    return text
      .split(re)
      .filter((v) => v !== "")
      .map((value) => ({ value, hit: value.toLowerCase() === query.toLowerCase() }));
  };
  let isAllEmoji = $derived(
    parts.length > 0 &&
      parts.every(
        (v) =>
          v.type === "br" ||
          v.type === "customEmoji" ||
          v.type === "customAnimeEmoji",
      ),
  );
  let showValentine = $derived(isAnniversary([Anniversary.VALENTINE]));
  let showHalloween = $derived(isAnniversary([Anniversary.HALLOWEEN]));
  let showChristmas = $derived(isAnniversary([Anniversary.CHRISTMAS]));
</script>

<div class="unj-res-part bg-transparent px-2 py-1.5 border-b border-gray-200">
  <!-- 上段: 名前欄 -->
  <div class="unj-font w-full text-gray-500 text-[11px] sm:text-xs leading-normal">
    <button
      class="bg-transparent border-0 text-inherit cursor-pointer pr-0 hover:opacity-80 {sage
        ? 'underline sage'
        : ''}"
      onclick={() => {
        bindContentText = bindContentText
          .replace(ankaMatchAllRegex, "")
          .replace(/^[^\S]*/, `>>${num}\n`);
        focus();
      }}
    >
      <span class="unj-num-badge">{num}</span>：
      <span
        class="font-bold"
        style={ccUserName.includes("★") ? "" : "color:#228811"}
        class:text-red-500={ccUserName.includes("★")}
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
    <span>：</span>
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
                sharedToaster.success({
                  title: `ID:${ccUserId}をバツポチしました`,
                });
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
        {#if showChristmas}
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
    <div class="flex flex-col flex-1 min-w-0 w-3xl max-w-full pl-1">
      {#if parts.length > 0}
        <div class="unj-font text-sm leading-[1.35]">
          {#each parts as part}
            {#if part.type === "text"}
              <span
                class="inline-block align-middle m-0 wrap-anywhere max-w-full"
              >
                {#each splitByHighlight(part.value, highlightQuery) as chunk}
                  {#if chunk.hit}
                    <span class="unj-hit">{chunk.value}</span>
                  {:else}
                    {chunk.value}
                  {/if}
                {/each}
              </span>
            {:else if part.type === "br"}
              <br />
            {:else if part.type === "url"}
              <a
                href={part.value}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                class="text-blue-500 hover:underline wrap-anywhere inline-block align-middle max-w-full"
                onclick={(e) => e.stopPropagation()}
              >
                {part.value}
              </a>
            {:else if part.type === "hashtag"}
              <Link
                to={makePathname(
                  `/${board.key}/search?q=${encodeURIComponent(part.value)}`,
                )}
                class="text-blue-500 visited:text-blue-500 hover:underline wrap-anywhere inline-block align-middle max-w-full font-normal"
                onclick={(e: MouseEvent) => e.stopPropagation()}
              >
                {#each splitByHighlight(part.value, highlightQuery) as chunk}
                  {#if chunk.hit}
                    <span class="unj-hit">{chunk.value}</span>
                  {:else}
                    {chunk.value}
                  {/if}
                {/each}
              </Link>
            {:else if part.type === "anka"}
              {@const ankaNum = Number(part.value)}
              {@const ankaRes = (
                ageRes?.num === ankaNum
                  ? ageRes
                  : resList.find((r) => r.num === ankaNum)
              ) as ResData | undefined}
              <span
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="cursor-pointer text-blue-500 hover:underline truncate inline-block align-middle max-w-full"
                onmouseenter={(e) => onRequestFloating?.(ankaNum, e, false)}
                onclick={(e) => {
                  onRequestFloating?.(ankaNum, e, true);
                  if (ankaRes) {
                    scrollToResNum(ankaNum);
                  } else {
                    navigate(
                      makePathname(
                        `/${board.key}/thread/${threadId}/${ankaNum}`,
                      ),
                    );
                  }
                }}
              >
                {#if ankaRes?.contentText}
                  {@const ankaParsed =
                    ankaRes.contentType === Enum.Chord
                      ? extractChordsFromContent(ankaRes.contentText)
                      : null}
                  {`> ${ankaParsed ? ankaParsed.comment || ankaParsed.chords : ankaRes.contentText}`}
                {:else}
                  {`>>${part.value}`}
                {/if}
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

          {#if showValentine}
            <span>{makeValentineEmojiSuffix(createdAt.toString())}</span>
          {/if}
          {#if showHalloween}
            <span>{makeHalloweenEmojiSuffix(createdAt.toString())}</span>
          {/if}
          {#if showChristmas}
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

      {#if effectiveContentUrl !== ""}
        {#if contentType === Enum.Url}
          <div class="mb-0.5 wrap-anywhere">
            <a
              href={siteInfo?.id === 1616 ? siteInfo.href : effectiveContentUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="cursor-pointer"
            >
              {effectiveContentUrl}
            </a>
          </div>
        {/if}

        {#key effectiveContentUrl}
          <div class="mb-0.5">
            <EmbedPart
              {ccUserId}
              contentUrl={effectiveContentUrl}
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
        <div class="flex items-center gap-2 mb-1">
          <div class="text-red-500 font-bold">※DTM機能</div>
          <button
            class="text-blue-500 hover:text-blue-700 font-bold transition duration-300 text-sm"
            onclick={() => {
              if (
                !confirm(
                  "DTMコラボしますか？（編集中のDTMデータは消えます）",
                )
              )
                return;
              bindContentData = contentData;
              bindContentType = Enum.Dtm;
              scrollToEnd();
              focus();
            }}
          >
            DTMコラボ
          </button>
        </div>
        {#if !showDtm}
          <List twoLine>
            <Item
              onclick={() => {
                showDtm = true;
                activeHeavyId.set(myDtmHeavyId);
              }}
            >
              <Graphic class="material-icons">music_note</Graphic>
              <Text>
                <PrimaryText>DTMプレイヤー</PrimaryText>
                <SecondaryText>タップして展開</SecondaryText>
              </Text>
              <IconButton class="material-icons">touch_app</IconButton>
            </Item>
          </List>
        {:else}
          <div class="flex items-center">
            <IconButton class="material-icons" onclick={() => (showDtm = false)}
              >close</IconButton
            >
          </div>
          <DtmPlayerPart src={contentData} />
        {/if}
      {/if}

      {#if contentType === Enum.Encrypt}
        <div class="text-red-500">※暗号レス</div>
        <DecryptPart bind:contentData />
      {/if}

      {#if contentType === Enum.Chord && chordParsed}
        <div class="mb-1">
          <Link
            class="text-blue-500 visited:text-blue-500 hover:underline font-normal"
            to={makePathname(`/${board.key}/search?q=${encodeURIComponent(CHORD_MARKER)}`)}
          >
            {CHORD_MARKER}
          </Link>
        </div>
        <ChordPlayerPart chords={chordParsed.chords} />
      {/if}

      <!--
        8192(MV作成)・16384(ゲーム作成)はunj-reze側のみの機能で、unjでは再生・編集ができない。
        content_typeとしては共有DBに乗ってくるので、非対応である旨だけ出して黙って崩れないようにする。
      -->
      {#if contentType === 8192 || contentType === 16384}
        <div class="text-red-500">
          ※{contentType === 8192 ? "MV作成" : "ゲーム作成"}機能（unjでは非対応です）
        </div>
      {/if}
    </div>
  </div>

  {@render children?.()}
</div>

<style>
  .sage:before {
    content: "↓";
  }
  .unj-res-part {
    background-color: var(--unj-res-bg, transparent);
  }
  .unj-hit {
    background: #ff0;
    color: #000;
  }
  .unj-num-badge {
    display: inline-block;
    padding: 2px;
    border-radius: 3px;
    background: rgba(200, 200, 200, 0.2);
    border-left: 10px solid rgba(200, 200, 200, 0.5);
  }
</style>

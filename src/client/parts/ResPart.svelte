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
  import { findIn } from "../../common/request/whitelist/site-info.js";
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
    animFrames?: number | null;
    animFps?: number | null;
    walkPreset?: string | null;
    dotArt?: boolean;
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
    animFrames = null,
    animFps = null,
    walkPreset = null,
    dotArt = false,
    commandResult = "",
    ps = "",
    // メタ情報
    num = 0,
    // unj-reze由来の返信関係（DBの res.parent_num）。1（スレ1番=OP）またはnullなら安価を合成しない
    parentNum = null,
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
  // 返信関係にある投稿は、本文に >>レス番 の安価が入っているテイで表示する。
  // ただしスレ1番目（OP）への返信は例外（BBSの慣習上、地の文への返信に逐一安価を付けないため）。
  // 実データは書き換えず、表示用にのみ合成する。
  let rawDisplayText = $derived(
    chordParsed ? chordParsed.comment : contentText,
  );
  let displayText = $derived(
    parentNum &&
      parentNum !== 1 &&
      rawDisplayText.split("\n")[0].trim() !== `>>${parentNum}`
      ? `>>${parentNum}\n${rawDisplayText}`
      : rawDisplayText,
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
  // このレスへの返信の数（専ブラの「被レス数」）。本文の >>N と unj-reze の parentNum の両方を数える
  let replyCount = $derived.by(() => {
    if (num <= 0) return 0;
    const re = new RegExp(`>>${num}(?![0-9])`);
    let count = 0;
    for (const r of resList as (ResData & { parentNum?: number | null })[]) {
      if (r.num === num) continue;
      if (r.parentNum === num || re.test(r.contentText ?? "")) count++;
    }
    return count;
  });
  let showValentine = $derived(isAnniversary([Anniversary.VALENTINE]));
  let showHalloween = $derived(isAnniversary([Anniversary.HALLOWEEN]));
  let showChristmas = $derived(isAnniversary([Anniversary.CHRISTMAS]));
</script>

<div class="unj-res-part">
  <!-- 上段: 名前欄（2ch の「1 ：名無し：日付 ID:xxx」） -->
  <div class="unj-font unj-res-head">
    <button
      class="unj-res-numname {sage ? 'sage' : ''}"
      title="このレスに返信"
      onclick={() => {
        bindContentText = bindContentText
          .replace(ankaMatchAllRegex, "")
          .replace(/^[^\S]*/, `>>${num}\n`);
        focus();
      }}
    >
      <span class="unj-res-num" class:unj-res-num-hot={replyCount >= 3}
        >{num}</span
      >
      <span class="unj-res-sep">：</span>
      <span class="unj-res-name" class:unj-res-cap={ccUserName.includes("★")}>
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
    <span class="unj-res-sep">：</span>
    <span class="unj-res-date"
      >{format(createdAt, "yyyy/MM/dd(EEE) HH:mm:ss", { locale: ja })}</span
    >

    <span class="unj-res-id">
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
      <span class="unj-res-owner">主</span>
    {/if}
    {#if replyCount > 0}
      <span class="unj-res-replies" class:unj-res-num-hot={replyCount >= 3}
        >返信{replyCount}</span
      >
    {/if}

    <div class="unj-res-block">
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
  <div class="unj-res-body">
    {#if ccUserAvatar && board.avatarMap.get(ccUserAvatar)}
      <div class="relative w-12 h-12 shrink-0 mr-2">
        <div
          class="w-12 h-12 rounded-full bg-cover bg-center"
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
    {/if}

    <!-- 右側のコンテンツ領域 -->
    <div class="flex flex-col flex-1 min-w-0 max-w-full">
      {#if parts.length > 0}
        <div class="unj-font unj-res-text">
          {#each parts as part}
            {#if part.type === "text"}
              <span class="wrap-anywhere">
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
                class="hover:underline wrap-anywhere"
                onclick={(e) => e.stopPropagation()}
              >
                {part.value}
              </a>
            {:else if part.type === "hashtag"}
              <Link
                to={makePathname(
                  `/${board.key}/search?q=${encodeURIComponent(part.value)}`,
                )}
                class="unj-res-anka hover:underline wrap-anywhere"
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
                class="unj-res-anka cursor-pointer hover:underline truncate inline-block align-bottom max-w-full"
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
        <!-- URLの生テキストはEmbedPartのプレビューカードと二重表示になる
             （どのみち埋め込まれるし、埋め込まれない種別でも本文側に同じURLが
             既に書かれていることが多い）ため、生リンク行は出さずEmbedPartのみ表示する。 -->
        {#key effectiveContentUrl}
          <div class="mb-0.5">
            <EmbedPart
              {ccUserId}
              contentUrl={effectiveContentUrl}
              {contentType}
              {animFrames}
              {animFps}
              {walkPreset}
              {dotArt}
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
    </div>
  </div>

  {@render children?.()}
</div>

<style>
  /* 2ch の dt/dd に寄せたレス。名前は緑・番号と ID は灰色・本文は少し下げる */
  .unj-res-part {
    background-color: var(--unj-res-bg, transparent);
    padding: 8px 10px 10px;
    border-bottom: 1px solid var(--unj-border-soft);
    text-align: left;
  }
  .unj-res-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 4px;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--unj-text-sub);
  }
  .unj-res-numname {
    display: inline-flex;
    align-items: baseline;
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    cursor: pointer;
  }
  .unj-res-numname:hover .unj-res-num {
    text-decoration: underline;
  }
  .unj-res-num {
    color: var(--unj-text);
    font-weight: bold;
  }
  .unj-res-num-hot {
    color: var(--unj-new) !important;
  }
  .unj-res-sep {
    margin: 0 -2px;
  }
  .unj-res-name {
    color: var(--unj-name);
    font-weight: bold;
  }
  .unj-res-cap {
    color: var(--unj-cap);
  }
  .sage .unj-res-name {
    color: var(--unj-link);
    text-decoration: underline;
  }
  .sage .unj-res-name:after {
    content: "↓";
    display: inline-block;
    text-decoration: none;
    margin-left: 1px;
  }
  .unj-res-date {
    white-space: nowrap;
  }
  .unj-res-id {
    white-space: nowrap;
  }
  .unj-res-id :global(a) {
    color: inherit !important;
  }
  .unj-res-owner {
    color: var(--unj-cap);
    font-weight: bold;
  }
  .unj-res-replies {
    font-size: 11.5px;
    color: var(--unj-link);
  }
  .unj-res-block {
    display: inline-flex;
    align-items: center;
    margin-left: auto;
    color: var(--unj-text-faint);
  }
  .unj-res-body {
    display: flex;
    align-items: flex-start;
    margin-top: 4px;
    padding-left: 1.4em;
  }
  .unj-res-text {
    font-size: 15.5px;
    line-height: 1.65;
    color: var(--unj-text);
    word-break: break-word;
  }
  .unj-res-anka {
    color: var(--unj-anka) !important;
  }
  .unj-hit {
    background: var(--unj-hit);
    color: inherit;
  }
  @media (max-width: 480px) {
    .unj-res-body {
      padding-left: 0.6em;
    }
    .unj-res-text {
      font-size: 15px;
    }
  }
</style>

<script lang="ts">
  import IconButton from "@smui/icon-button";
  import List, {
    Item,
    Graphic,
    Text,
    PrimaryText,
    SecondaryText,
  } from "@smui/list";
  import Paper, { Title, Content, Subtitle } from "@smui/paper";
  import { contentTemplateMap } from "../../common/request/content-schema.js";
  import game from "../../common/request/whitelist/game.js";
  import oekaki from "../../common/request/whitelist/oekaki.js";
  import {
    SiteInfo,
    findIn,
  } from "../../common/request/whitelist/site-info.js";
  import {
    parseAudioEmbedSoundCloud,
    parseAudioEmbedSpotify,
    parseGameEmbedRPGEN,
    parseGifEmbedGIPHY,
    parseGifEmbedImgBB,
    parseGifEmbedImgur,
    parseGifEmbedImgx,
    parseGifEmbedYonet,
    parseImageEmbedImgBB,
    parseImageEmbedImgur,
    parseImageEmbedImgx,
    parseImageEmbedNicoseiga,
    parseImageEmbedPixiv,
    parseImageEmbedYonet,
    parseVideoEmbedNicovideo,
    parseVideoEmbedYouTube,
  } from "../mylib/embed.js";

  let { ccUserAvatar = 0, contentUrl = "", contentType = 0 } = $props();

  const url = (() => {
    try {
      return new URL(contentUrl);
    } catch (err) {}
  })();

  const temp = contentTemplateMap.get(contentType) ?? [];
  const siteInfo = url ? findIn(temp, url.hostname) : null;
  const embeddable =
    temp !== game || (siteInfo?.id === 6401 && url?.searchParams.has("map"));

  let embedding = $state(false);
  let embedError = $state(false);
  let embedUrl = $state("");
  let imageEmbed = $state(false);
  let videoEmbedYouTube = $state(false);
  let videoEmbedNicovideo = $state(false);
  let audioEmbedSoundCloud = $state(false);
  let audioEmbedSpotify = $state(false);
  let gameEmbedRPGEN = $state(false);
  const tryEmbed = (siteInfo: SiteInfo) => {
    if (!url) return;
    try {
      embedding = true;
      switch (siteInfo.id) {
        case 401:
          imageEmbed = true;
          embedUrl = parseImageEmbedImgur(url) ?? "";
          break;
        case 402:
          imageEmbed = true;
          embedUrl = parseImageEmbedNicoseiga(url) ?? "";
          break;
        case 403:
          imageEmbed = true;
          embedUrl = parseImageEmbedPixiv(url) ?? "";
          break;
        case 411:
          imageEmbed = true;
          embedUrl = parseImageEmbedYonet(url) ?? "";
          break;
        case 412:
          imageEmbed = true;
          embedUrl = parseImageEmbedImgx(url) ?? "";
          break;
        case 413:
          imageEmbed = true;
          embedUrl = parseImageEmbedImgBB(url) ?? "";
          break;
        case 801:
          imageEmbed = true;
          embedUrl = parseGifEmbedImgur(url) ?? "";
          break;
        case 802:
          imageEmbed = true;
          embedUrl = parseGifEmbedGIPHY(url) ?? "";
          break;
        case 811:
          imageEmbed = true;
          embedUrl = parseGifEmbedYonet(url) ?? "";
          break;
        case 812:
          imageEmbed = true;
          embedUrl = parseGifEmbedImgx(url) ?? "";
          break;
        case 813:
          imageEmbed = true;
          embedUrl = parseGifEmbedImgBB(url) ?? "";
          break;
        case 1601:
          videoEmbedYouTube = true;
          embedUrl = parseVideoEmbedYouTube(url) ?? "";
          break;
        case 1602:
          videoEmbedNicovideo = true;
          embedUrl = parseVideoEmbedNicovideo(url) ?? "";
          break;
        case 3201:
          audioEmbedSoundCloud = true;
          embedUrl = parseAudioEmbedSoundCloud(url) ?? "";
          break;
        case 3202:
          audioEmbedSpotify = true;
          embedUrl = parseAudioEmbedSpotify(url) ?? "";
          break;
        case 6401:
          gameEmbedRPGEN = true;
          embedUrl = parseGameEmbedRPGEN(url) ?? "";
          break;
        case 102401:
          imageEmbed = true;
          embedUrl = parseImageEmbedImgur(url) ?? "";
          break;
      }
      if (!embedUrl) throw 114514;
    } catch (err) {
      embedError = true;
      embedding = false;
    }
  };

  let width = $state(0);
  let height = $state(0);
  const onResize = () => {
    const w = window.innerWidth * 0.7 - (ccUserAvatar ? 32 : 0);
    const h = window.innerHeight * 0.7;
    let w2 = 0;
    let h2 = 0;
    if (w < h) {
      w2 = w;
      h2 = w2 * (9 / 16);
    } else {
      h2 = h * 0.6;
      w2 = h2 * (16 / 9);
    }
    width = w2 | 0;
    height = h2 | 0;
  };

  $effect(() => {
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
</script>

{#if siteInfo}
  {#if temp === oekaki}
    <div class="system-color">※お絵描き機能</div>
  {/if}
  {#if !embedding}
    <List twoLine
      ><Item
        onclick={() => {
          if (embeddable) {
            tryEmbed(siteInfo);
          } else {
            window.open(contentUrl, "_blank");
          }
        }}
      >
        <Graphic
          class="embed-favicon-item-graphic {siteInfo.id === 3202
            ? 'nicovideo'
            : ''}"
          style="background-image:url({siteInfo.favicon});"
        />
        <Text>
          <PrimaryText>{siteInfo.name}</PrimaryText>
          <SecondaryText
            >{embeddable ? "タップして展開" : "タップして移動"}</SecondaryText
          >
        </Text>
        <IconButton class="material-icons"
          >{embeddable ? "touch_app" : "open_in_new"}</IconButton
        >
      </Item>
    </List>
    {#if embedError}
      <Paper color="primary" variant="outlined">
        <Title>埋め込みコンテンツの展開に失敗しました。</Title>
        <Subtitle>不正なURL、またはバグです。。</Subtitle>
        <Content>ごめんよぉ…</Content>
      </Paper>
    {/if}
  {:else}
    <IconButton class="material-icons" onclick={() => (embedding = false)}
      >close</IconButton
    >
    <br />
    {#if imageEmbed}
      <img
        class="embed-image gimp-checkered-background"
        src={embedUrl}
        alt="embed"
      />
    {:else if videoEmbedYouTube}
      <iframe
        title="embed"
        src={embedUrl}
        {width}
        {height}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        frameborder="0"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    {:else if videoEmbedNicovideo}
      <iframe
        title="embed"
        src={embedUrl}
        {width}
        {height}
        allow="autoplay"
        allowfullscreen
      ></iframe>
    {:else if audioEmbedSoundCloud}
      <iframe
        title="embed"
        src={embedUrl}
        {width}
        {height}
        allow="autoplay"
        scrolling="no"
        frameborder="no"
      ></iframe>
    {:else if audioEmbedSpotify}
      <iframe
        title="embed"
        src={embedUrl}
        {width}
        {height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowfullscreen={null}
        loading="lazy"
      ></iframe>
    {:else if gameEmbedRPGEN}
      <iframe
        title="embed"
        src={embedUrl}
        {width}
        {height}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        scrolling="no"
      ></iframe>
    {/if}
  {/if}
{/if}

<style>
  .system-color {
    color: #e57373;
  }
  :global(.embed-favicon-item-graphic) {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
  :global(body.dark .embed-favicon-item-graphic.nicovideo) {
    background-color: black;
  }
  .embed-image {
    display: block; /* インライン要素ではなくブロックにする */
    max-width: 100%; /* 親要素の幅に収まる */
    height: auto; /* アスペクト比を保って高さを自動調整 */
    object-fit: contain; /* はみ出さないようにする（切り抜きたくないなら contain） */
    border-radius: 8px; /* 角丸にしたい場合。お好み！ */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 軽い影で浮かせる */
  }
  iframe {
    border-radius: 12px;
  }
</style>

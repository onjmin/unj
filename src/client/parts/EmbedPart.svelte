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
  import {
    SiteInfo,
    findIn,
  } from "../../common/request/whitelist/site-info.js";
  import unjGames from "../../common/request/whitelist/unj-games.js";
  import {
    parseAudioEmbedSoundCloud,
    parseAudioEmbedSpotify,
    parseGifEmbedImgur,
    parseImageEmbedImgur,
    parseImageEmbedNicoseiga,
    parseImageEmbedPixiv,
    parseVideoEmbedNicovideo,
    parseVideoEmbedYouTube,
  } from "../mylib/embed.js";

  let { ccUserAvatar = 0, contentUrl = "", contentType = 0 } = $props();

  const temp = contentTemplateMap.get(contentType) ?? [];
  const siteInfo = temp.length
    ? findIn(temp, new URL(contentUrl).hostname)
    : null;

  let embedding = $state(false);
  let embedError = $state(false);
  let embedUrl = $state("");
  let imageEmbed = $state(false);
  let videoEmbedYouTube = $state(false);
  let videoEmbedNicovideo = $state(false);
  let audioEmbedSoundCloud = $state(false);
  let audioEmbedSpotify = $state(false);
  const tryEmbed = (siteInfo: SiteInfo) => {
    try {
      embedding = true;
      const url = new URL(contentUrl);
      switch (siteInfo.id) {
        case 801:
          imageEmbed = true;
          embedUrl = parseImageEmbedImgur(url) ?? "";
          break;
        case 802:
          imageEmbed = true;
          embedUrl = parseImageEmbedNicoseiga(url) ?? "";
          break;
        case 803:
          imageEmbed = true;
          embedUrl = parseImageEmbedPixiv(url) ?? "";
          break;
        case 1601:
          imageEmbed = true;
          embedUrl = parseGifEmbedImgur(url) ?? "";
          break;
        case 3201:
          videoEmbedYouTube = true;
          embedUrl = parseVideoEmbedYouTube(url) ?? "";
          break;
        case 3202:
          videoEmbedNicovideo = true;
          embedUrl = parseVideoEmbedNicovideo(url) ?? "";
          break;
        case 6401:
          audioEmbedSoundCloud = true;
          embedUrl = parseAudioEmbedSoundCloud(url) ?? "";
          break;
        case 6402:
          audioEmbedSpotify = true;
          embedUrl = parseAudioEmbedSpotify(url) ?? "";
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
    width = w2;
    height = h2;
  };

  $effect(() => {
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
</script>

{#if siteInfo}
  {#if !embedding}
    <List twoLine
      ><Item>
        <Graphic
          class="embed-favicon-item-graphic {siteInfo.id === 3202
            ? 'nicovideo'
            : ''}"
          style="background-image:url({siteInfo.favicon});"
        />
        <Text>
          <PrimaryText>{siteInfo.name}</PrimaryText>
          <SecondaryText>{siteInfo.description}</SecondaryText>
        </Text>
        {#if temp === unjGames}
          <IconButton
            class="material-icons"
            onclick={() => window.open(contentUrl, "_blank")}
            >open_in_new</IconButton
          >
        {:else}
          <IconButton class="material-icons" onclick={() => tryEmbed(siteInfo)}
            >touch_app</IconButton
          >
        {/if}
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
      <img class="embed-image" src={embedUrl} alt="embed" />
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
    {/if}
  {/if}
{/if}

<style>
  :global(.embed-favicon-item-graphic) {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
  :global(.embed-favicon-item-graphic.nicovideo) {
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

<script lang="ts">
  import { contentTemplateMap } from "../../common/request/content-schema.js";
  import {
    SiteInfo,
    findIn,
  } from "../../common/request/whitelist/site-info.js";
  import {
    clearActiveController,
    embedNicovideo,
    embedSoundCloud,
    embedYouTube,
  } from "../mylib/background-embed.js";
  import {
    parseAudioEmbedSoundCloud,
    parseVideoEmbedNicovideo,
    parseVideoEmbedYouTube,
  } from "../mylib/embed.js";
  import { backgroundEmbedding } from "../mylib/store.js";

  let { contentUrl = "", contentType = 0 } = $props();

  let siteInfo: SiteInfo | null = $state(null);

  $effect.root(() => {
    let url: URL | undefined;
    try {
      url = new URL(contentUrl);
    } catch (err) {}
    const temp = contentTemplateMap.get(contentType) ?? [];
    siteInfo = url ? findIn(temp, url.hostname) : null;
  });

  let embedError = $state(false);
  let embedding = $state(false);
  let embedUrl = $state("");
  let videoEmbedYouTube = $state(false);
  let videoEmbedNicovideo = $state(false);
  let audioEmbedSoundCloud = $state(false);
  const tryEmbed = (siteInfo: SiteInfo) => {
    try {
      embedding = true;
      const url = new URL(contentUrl);
      switch (siteInfo.id) {
        case 1601:
          videoEmbedYouTube = true;
          embedUrl = parseVideoEmbedYouTube(url) ?? "";
          if (embedUrl)
            embedYouTube({
              iframeParentDOM: document.querySelector(".middle-wrapper"),
              embedUrl,
              width,
              height,
            });
          break;
        case 1602:
          videoEmbedNicovideo = true;
          embedUrl = parseVideoEmbedNicovideo(url) ?? "";
          if (embedUrl)
            embedNicovideo({
              iframeDOM: document.querySelector("#unj-background-embed iframe"),
            });
          break;
        case 3201:
          audioEmbedSoundCloud = true;
          embedUrl = parseAudioEmbedSoundCloud(url) ?? "";
          if (embedUrl)
            embedSoundCloud({
              iframeDOM: document.querySelector("#unj-background-embed iframe"),
            });
          break;
      }
      if (!embedUrl) throw 114514;
    } catch (err) {
      embedError = true;
    }
  };

  $effect(() => {
    if (siteInfo) {
      tryEmbed(siteInfo);
      if (!embedding) return;
      $backgroundEmbedding = true;
    }
    return () => {
      $backgroundEmbedding = false;
      clearActiveController();
    };
  });

  let width = $state(0);
  let height = $state(0);
  const aspectRatio = 16 / 9; // 動画のアスペクト比（縦長なら9 / 16）
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const windowAspect = w / h;
    let w2 = 0;
    let h2 = 0;
    if (windowAspect > aspectRatio) {
      // ウィンドウが「動画より横長」の場合
      // 高さを基準にする → 横は見切れる
      h2 = h;
      w2 = h * aspectRatio;
    } else {
      // ウィンドウが「動画より縦長」の場合
      // 幅を基準にする → 縦は見切れる
      w2 = w;
      h2 = w / aspectRatio;
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

{#if !embedError && embedding}
  <div id="unj-background-embed">
    <div class="middle-wrapper">
      {#if videoEmbedYouTube}
        <script src="https://www.youtube.com/iframe_api"></script>
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
        <script src="https://w.soundcloud.com/player/api.js"></script>
        <iframe
          title="embed"
          src={embedUrl}
          {width}
          {height}
          allow="autoplay"
          scrolling="no"
          frameborder="no"
        ></iframe>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* YT.PlayerによってSvelte用のセレクタから外れてしまうため */
  :global(#unj-background-embed iframe) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100svw;
    height: 100dvh;
    object-fit: cover;
    aspect-ratio: 16 / 9;
    pointer-events: none;
    z-index: 0;
    opacity: 0.3;
  }
</style>

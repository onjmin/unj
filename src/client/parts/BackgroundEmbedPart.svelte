<script lang="ts">
  import { contentTemplateMap } from "../../common/request/content-schema.js";
  import {
    SiteInfo,
    findIn,
  } from "../../common/request/whitelist/site-info.js";
  import {
    parseAudioEmbedSoundCloud,
    parseVideoEmbedNicovideo,
    parseVideoEmbedYouTube,
  } from "../mylib/embed.js";

  let { contentUrl = "", contentType = 0 } = $props();

  const temp = contentTemplateMap.get(contentType) ?? [];
  const siteInfo = temp.length
    ? findIn(temp, new URL(contentUrl).hostname)
    : null;

  /**
   * 初回遷移時、ユーザーの初回タップがなければ自動再生不可
   */
  const handleUserInteraction = (callback: () => void) => {
    const play = () => {
      callback();
      window.removeEventListener("click", play);
      window.removeEventListener("touchstart", play);
    };
    window.addEventListener("click", play);
    window.addEventListener("touchstart", play);
  };

  let embedding = $state(false);
  let embedError = $state(false);
  let embedUrl = $state("");
  let videoEmbedYouTube = $state(false);
  let videoEmbedNicovideo = $state(false);
  let audioEmbedSoundCloud = $state(false);
  const tryEmbed = (siteInfo: SiteInfo) => {
    try {
      embedding = true;
      const url = new URL(contentUrl);
      switch (siteInfo.id) {
        case 3201:
          videoEmbedYouTube = true;
          embedUrl = parseVideoEmbedYouTube(url) ?? "";
          if (embedUrl) {
            const videoId = embedUrl.split("/").slice(-1)[0];
            let target: object | null = null;
            const play = () => {
              target?.setVolume(64);
              target?.playVideo();
              target?.setLoop(true);
            };
            const onYouTubeIframeAPIReady = () => {
              new window.YT.Player(document.querySelector(".middle-wrapper"), {
                width,
                height,
                videoId,
                playerVars: {
                  loop: 1,
                  playlist: videoId,
                },
                events: {
                  onReady: (event: YT.PlayerEvent) => {
                    target = event.target;
                    play();
                  },
                  onError: console.error,
                },
              });
            };
            if (window.YT) setTimeout(onYouTubeIframeAPIReady);
            else {
              window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
              handleUserInteraction(play);
            }
          }
          break;
        case 3202:
          videoEmbedNicovideo = true;
          embedUrl = parseVideoEmbedNicovideo(url) ?? "";
          {
            const NicoOrigin = "https://embed.nicovideo.jp";
            const postNico = (data: object) =>
              document
                .querySelector("#unj-background-embed iframe")
                ?.contentWindow.postMessage(
                  Object.assign(
                    {
                      sourceConnectorType: 1,
                    },
                    data,
                  ),
                  NicoOrigin,
                );
            const play = () => {
              postNico({
                eventName: "volumeChange",
                data: { volume: 64 / 100 },
              });
              postNico({ eventName: "play" });
            };
            window.addEventListener("message", (e) => {
              if (e.origin !== NicoOrigin) return;
              const { data } = e.data;
              switch (e.data.eventName) {
                // case "playerMetadataChange": {
                //   const now = data.currentTime;
                //   if (!now) return;
                //   if (g_cmd.end && g_cmd.end * 1000 < now) play();
                //   break;
                // }
                case "playerStatusChange": {
                  switch (data.playerStatus) {
                    // case 2:
                    //   setVolume();
                    //   endedFlag = false;
                    //   break;
                    case 4:
                      play();
                      break;
                  }
                  break;
                }
                case "loadComplete": {
                  play();
                  break;
                }
                default:
                  break;
              }
            });
          }
          break;
        case 6401:
          audioEmbedSoundCloud = true;
          embedUrl = parseAudioEmbedSoundCloud(url) ?? "";
          {
            let widget: object | null = null;
            const play = () => {
              widget?.setVolume(64);
              widget?.play();
            };
            const ready = () => {
              widget = window.SC.Widget(
                document.querySelector("#unj-background-embed iframe"),
              );
              widget?.bind(window.SC.Widget.Events.READY, play);
              widget?.bind(window.SC.Widget.Events.FINISH, play);
              widget?.bind(window.SC.Widget.Events.ERROR, console.error);
            };
            if (window.SC) setTimeout(ready);
            else {
              setTimeout(ready, 512); // TODO
              handleUserInteraction(play);
            }
          }
          break;
      }
      if (!embedUrl) throw 114514;
    } catch (err) {
      embedError = true;
      embedding = false;
    }
  };

  $effect(() => {
    if (siteInfo) {
      tryEmbed(siteInfo);
      if (!embedding) return;
    }
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

{#if embedding}
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
    height: 100svh;
    object-fit: cover;
    aspect-ratio: 16 / 9;
    pointer-events: none;
    z-index: 0;
    opacity: 0.2;
  }
</style>

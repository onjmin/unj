<script lang="ts">
  // 投稿画像の表示用。unj-reze由来のアニメ/歩行グラ投稿(スプライトシート)を再生する。
  // animFrames が無い/1以下なら素の<img>と同じ見た目・挙動になる。
  //
  // 歩行グラ(rows>1=複数行のシート)はまだ自動再生に対応しておらず、先頭コマ(左上のセル)
  // だけを静止画として切り出して見せる（全コマを引き伸ばして表示する崩れた見た目は避ける）。
  //
  // コマ単体のサイズはDBに持っていない（シート全体のURLしか無い）ため、
  // 一度画像を読み込んで naturalWidth/Height から逆算する。測定が終わるまでは
  // 1:1のプレースホルダー比率で待つ（一瞬だけ縦横比がズレる場合がある）。
  //
  // <img>と同じ「自然サイズを超えて拡大表示しない」挙動に合わせるため、コマ単体の
  // 実ピクセル幅を明示的な width として与える。これをやらないと、div+background-image
  // には<img>のような内在サイズが無いため width:auto がブロック要素として親幅いっぱいに
  // 広がり、小さいドット絵アニメが投稿カードの横幅まで間延びして表示されてしまう。

  let {
    src = "",
    alt = "",
    class: className = "",
    animFrames = null,
    animFps = null,
    rows = 1,
    onclick = undefined,
    onerror = undefined,
  }: {
    src?: string;
    alt?: string;
    class?: string;
    animFrames?: number | null;
    animFps?: number | null;
    rows?: number;
    onclick?: (() => void) | undefined;
    onerror?: (() => void) | undefined;
  } = $props();

  let frames = $derived(animFrames && animFrames > 1 ? animFrames : 1);
  let fps = $derived(animFps && animFps > 0 ? animFps : 8);
  let cell = $state<{ ratio: number; widthPx: number } | null>(null);

  $effect(() => {
    if (frames <= 1 || !src) {
      cell = null;
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled && img.naturalWidth && img.naturalHeight) {
        const cellW = img.naturalWidth / frames;
        const cellH = img.naturalHeight / rows;
        cell = { ratio: cellW / cellH, widthPx: cellW };
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  });

  // ドット絵は1ドット=1pxのネイティブ解像度でDBに置く方針（本体データはドット数が正で、
  // 表示用に水増ししたビットマップをR2に置くと転送量/ストレージの無駄になる）ため、
  // 実サイズが小さいコマはこの幅までCSSで拡大する（image-rendering:pixelatedで
  // にじませずドット単位で拡大。豆粒のまま埋め込まれるのを防ぐ）。
  const MIN_DISPLAY_PX = 200;
  let widthStyle = $derived(
    cell
      ? `width:${Math.max(cell.widthPx, MIN_DISPLAY_PX)}px; max-width:100%;`
      : "",
  );
</script>

{#if frames <= 1 || !src}
  <img {src} {alt} class={className} {onclick} {onerror} />
{:else}
  <div
    role="img"
    aria-label={alt}
    class="{className} sprite-sheet"
    class:sprite-anim={rows <= 1}
    style="background-image:url({src}); aspect-ratio:{cell?.ratio ?? 1}; {widthStyle} --frames:{frames}; --rows:{rows}; --duration:{frames / fps}s;"
    {onclick}
  ></div>
{/if}

<style>
  .sprite-sheet {
    background-repeat: no-repeat;
    background-position: 0% 0%;
    background-size: calc(var(--frames) * 100%) calc(var(--rows) * 100%);
    image-rendering: pixelated;
  }
  .sprite-anim {
    animation-name: sprite-anim-steps;
    animation-duration: var(--duration);
    animation-timing-function: steps(var(--frames));
    animation-iteration-count: infinite;
  }
  /*
   * background-position の百分率は (コンテナ幅-画像幅)×(P/100) で解決される（CSS仕様）ため、
   * N分割ステップの最後のコマにちょうど揃う目標値は 100% でも N×100% でもなく
   * 100×N/(N-1)%。ここを frames×-100% にすると2コマ目以降が隣接コマ境界からズレて
   * 半端な位置で止まる＝コマが割れて見えるバグになる。
   */
  @keyframes sprite-anim-steps {
    from {
      background-position: 0% 0;
    }
    to {
      background-position: calc(100% * var(--frames) / (var(--frames) - 1)) 0;
    }
  }
</style>

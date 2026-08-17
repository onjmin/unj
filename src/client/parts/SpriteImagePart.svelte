<script lang="ts">
  // 投稿画像の表示用。unj-reze由来のアニメ/歩行グラ投稿(スプライトシート)を再生する。
  // animFrames が無い/1以下なら素の<img>と同じ見た目・挙動になる。
  //
  // 歩行グラ(rows>1=複数行のシート)はまだ自動再生に対応しておらず、先頭コマ(左上のセル)
  // だけを静止画として切り出して見せる（全コマを引き伸ばして表示する崩れた見た目は避ける）。
  //
  // コマ単体の縦横比はDBに持っていない（シート全体のURLしか無い）ため、
  // 一度画像を読み込んで naturalWidth/Height から逆算する。測定が終わるまでは
  // 1:1のプレースホルダー比率で待つ（一瞬だけ縦横比がズレる場合がある）。

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
  let cellRatio = $state<number | null>(null);

  $effect(() => {
    if (frames <= 1 || !src) {
      cellRatio = null;
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled && img.naturalWidth && img.naturalHeight) {
        cellRatio = img.naturalWidth / frames / (img.naturalHeight / rows);
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  });
</script>

{#if frames <= 1 || !src}
  <img {src} {alt} class={className} {onclick} {onerror} />
{:else}
  <div
    role="img"
    aria-label={alt}
    class="{className} sprite-sheet"
    class:sprite-anim={rows <= 1}
    style="background-image:url({src}); aspect-ratio:{cellRatio ?? 1}; --frames:{frames}; --rows:{rows}; --duration:{frames / fps}s;"
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
  @keyframes sprite-anim-steps {
    from {
      background-position: 0% 0;
    }
    to {
      background-position: calc(var(--frames) * -100%) 0;
    }
  }
</style>

<script lang="ts">
  let {
    url,
    theme = "light",
    align = "left",
    lang = "ja",
    width = 550,
  } = $props();

  // x.com URL を twitter.com に正規化
  const normalizedUrl = url.replace(
    /^https:\/\/x\.com\//,
    "https://twitter.com/",
  );

  let containerEl: HTMLDivElement | undefined = $state();
  let widgetsLoaded = $state(!!window.twttr);

  $effect(() => {
    if (!containerEl || !widgetsLoaded) return;
    window.twttr?.widgets?.load(containerEl);
  });
</script>

{#key normalizedUrl}
  <div
    bind:this={containerEl}
    class="[&_.twitter-tweet]:!my-0 [&_.twitter-tweet]:!mt-0 [&_.twitter-tweet]:!mb-0"
  >
    <blockquote
      class="twitter-tweet"
      data-theme={theme}
      data-align={align}
      data-lang={lang}
      data-width={width}
    >
      <a href={normalizedUrl} target="_blank" rel="noreferrer noopener">{""}</a>
    </blockquote>
  </div>
{/key}

<svelte:head>
  <script
    async
    src="https://platform.twitter.com/widgets.js"
    charset="utf-8"
    onload={() => (widgetsLoaded = true)}
  ></script>
</svelte:head>

<script lang="ts">
  let { size = "16", emoji = "" } = $props();

  const codePoints = $derived(
    Array.from(emoji).map((char) => char.codePointAt(0)?.toString(16)),
  );
  const url = $derived(
    `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codePoints}.svg`,
  );
</script>

{#if emoji}
  <img src={url} alt={emoji} width={size} height={size} loading="lazy" />
{/if}

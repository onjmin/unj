<script lang="ts">
  let { size = "16", hostname = "" } = $props();

  const src = $derived(`https://www.google.com/s2/favicons?domain=${hostname}`);
  const alt = $derived(`Favicon for ${hostname}`);
</script>

<img class="img" {src} {alt} width={size} height={size} loading="lazy" />

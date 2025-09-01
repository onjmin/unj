<script lang="ts">
  let { hostname = "" } = $props();

  const height = "16";

  const src = `https://www.google.com/s2/favicons?domain=${hostname}`;
  const alt = `Favicon for ${hostname}`;
</script>

<img class="img" {src} {alt} {height} width={height} loading="lazy" />

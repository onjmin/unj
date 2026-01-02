<script lang="ts">
  let { hostname = "" } = $props();

  const src = $derived(`https://www.google.com/s2/favicons?domain=${hostname}`);
  const alt = $derived(`Favicon for ${hostname}`);
</script>

<img {src} {alt} loading="lazy" class="w-full h-full object-contain" />

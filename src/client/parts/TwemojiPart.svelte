<script lang="ts">
  import { getTwemoji } from "../mylib/twemoji.js";

  let { seed, height } = $props();

  const { src, alt } = getTwemoji(seed);
</script>

<img class="img" {src} {alt} {height} width={height} loading="lazy" />

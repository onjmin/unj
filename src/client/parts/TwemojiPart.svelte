<script lang="ts">
  import { seededRandArray } from "../../common/util.js";
  import list from "../mylib/emoji.js";

  let { seed = "" } = $props();

  const height = "16";

  const emoji = seededRandArray(list, seed) ?? "🪬";
  const codePoints = Array.from(emoji).map((char) =>
    char.codePointAt(0)?.toString(16),
  );
  const src = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codePoints}.svg`;
</script>

<img class="img" {src} alt={emoji} {height} width={height} loading="lazy" />

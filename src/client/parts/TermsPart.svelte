<script lang="ts">
  import { makePathname } from "../mylib/env.js";

  let terms = $state("");

  $effect(() => {
    (async () => {
      terms = await fetch(makePathname("/static/terms.txt"))
        .then((v) => v.text())
        .then((v) => v.trim());
    })();
  });
</script>

<pre>{terms}</pre>

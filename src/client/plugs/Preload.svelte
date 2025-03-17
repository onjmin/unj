<script lang="ts">
    import { Preload } from "../mylib/idb/preload.js";

    let { children } = $props();
    let ready = $state(false);

    $effect(() => {
        Promise.all(Preload.promises).then(() => {
            ready = true;
        });
    });
</script>

{#if ready}
    {@render children?.()}
{/if}

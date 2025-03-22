<script lang="ts">
    import { navigate } from "svelte-routing";
    import { makePathname } from "../mylib/env.js";
    import { banStatus } from "../mylib/idb/preload.js";

    let { children } = $props();
    let ready = $state(false);

    $effect(() => {
        if ("ban" !== banStatus.value) {
            navigate(makePathname("/"), { replace: true });
        } else {
            ready = true;
        }
    });
</script>

{#if ready}
    {@render children?.()}
{/if}

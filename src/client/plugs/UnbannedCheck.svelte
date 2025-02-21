<script lang="ts">
    import { navigate } from "svelte-routing";
    import { base } from "../mylib/env.js";
    import { load } from "../mylib/storage.js";

    let { children } = $props();
    let ready = $state(false);

    const main = async () => {
        if ("ban" !== (await load("banStatus"))) {
            navigate(base("/"), { replace: true });
        } else {
            ready = true;
        }
    };

    $effect(() => {
        main();
    });
</script>

{#if ready}
    {@render children?.()}
{:else}
    <div>Loading...</div>
{/if}

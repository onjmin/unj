<script lang="ts">
    import { navigate } from "svelte-routing";
    import { load } from "../mylib/storage.js";

    let { children } = $props();
    let ready = $state(false);

    const main = async () => {
        if ("ban" === (await load("banStatus"))) {
            navigate("/akukin", { replace: true });
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

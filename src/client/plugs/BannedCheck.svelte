<script lang="ts">
    import { navigate } from "svelte-routing";
    import { base, pathname } from "../mylib/env.js";
    import {
        banStatus,
        destinationPathname,
        termsAgreement,
    } from "../mylib/idb/preload.js";

    let { children } = $props();
    let ready = $state(false);

    $effect(() => {
        if ("ban" === banStatus.value) {
            navigate(base("/akukin"), { replace: true });
        } else if ("yes" !== termsAgreement.value && "/" !== pathname()) {
            destinationPathname.save(pathname());
            navigate(base("/"), { replace: true });
        }
        ready = true;
    });
</script>

{#if ready}
    {@render children?.()}
{/if}

<script lang="ts">
    import { navigate } from "svelte-routing";
    import { savePathname } from "../mylib/enter.js";
    import { base, pathname } from "../mylib/env.js";
    import { load } from "../mylib/idb/keyval.js";
    import { authTokenPromise } from "../mylib/socket.js";

    let { children } = $props();
    let ready = $state(false);

    const main = async () => {
        const [banStatus, termsAgreement] = await Promise.all([
            load("banStatus"),
            load("termsAgreement"),
            authTokenPromise,
        ]);
        if ("ban" === banStatus) {
            navigate(base("/akukin"), { replace: true });
        } else if ("yes" !== termsAgreement && pathname() !== "/") {
            savePathname(pathname());
            navigate(base("/"), { replace: true });
        }
        ready = true;
    };

    $effect(() => {
        main();
    });
</script>

{#if ready}
    {@render children?.()}
{/if}

<script lang="ts">
    import { onMount } from "svelte";
    import { navigate } from "svelte-routing";
    import { savePathname } from "../mylib/enter.js";
    import { base, pathname } from "../mylib/env.js";
    import { load } from "../mylib/idb/keyval.js";
    import { setAuthToken } from "../mylib/socket.js";

    let { children } = $props();
    let ready = $state(false);

    const main = async () => {
        const [banStatus, termsAgreement, authToken] = await Promise.all([
            load("banStatus"),
            load("termsAgreement"),
            load("authToken"),
        ]);
        if ("ban" === banStatus) {
            navigate(base("/akukin"), { replace: true });
        } else if ("yes" !== termsAgreement && pathname() !== "/") {
            savePathname(pathname());
            navigate(base("/"), { replace: true });
        } else if (authToken) {
            setAuthToken(authToken);
        }
        ready = true;
    };

    onMount(() => {
        main();
    });
</script>

{#if ready}
    {@render children?.()}
{/if}

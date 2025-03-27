<script lang="ts">
    import { navigate } from "svelte-routing";
    import { flaky } from "../mylib/anti-debug.js";
    import { makePathname, pathname } from "../mylib/env.js";
    import {
        banReason,
        banStatus,
        traversalTarget,
    } from "../mylib/idb/preload.js";

    let { children } = $props();
    let ready = $state(false);

    const honeypot = new Set([
        "/admin",
        "/admin-ajax.php",
        "/administrator",
        "/auth",
        "/cms",
        "/controlpanel",
        "/cpanel",
        "/dashboard",
        "/drupal/node",
        "/joomla/administrator",
        "/login",
        "/public",
        "/typo3",
        "/user/login",
        "/vendor",
        "/wp-admin",
        "/wp-admin/admin.php",
        "/wp-comments-post.php",
        "/wp-config.php",
        "/wp-json/wp/v2/users",
        "/wp-login",
        "/wp-login.php",
        "/xmlrpc.php",
    ]);

    $effect(() => {
        if (honeypot.has(pathname())) {
            if (
                !flaky(() => {
                    banStatus.value = "ban";
                    banReason.value = "traversal";
                    traversalTarget.value = window.location.href;
                    setTimeout(() =>
                        navigate(makePathname("/akukin"), { replace: true }),
                    );
                })
            ) {
                ready = true;
            }
        } else {
            ready = true;
        }
    });
</script>

{#if ready}
    {@render children?.()}
{/if}

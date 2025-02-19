<script lang="ts">
    import { navigate } from "svelte-routing";
    import { save } from "../mylib/storage.js";

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

    const main = async () => {
        if (honeypot.has(window.location.pathname)) {
            await Promise.all([
                save("banStatus", "ban"),
                save("banReason", "traversal"),
                save("traversalTarget", window.location.pathname),
            ]);
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

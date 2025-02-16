<script lang="ts">
    import { navigate } from "svelte-routing";
    import { load, save } from "../mylib/storage.js";

    let banned = $state(false);
    let ready = $state(false);
    let { children } = $props();

    const honeypot = new Set([
        "/admin",
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
        "/wp-json/wp/v2/users",
        "/wp-login",
    ]);

    const checkBanStatus = async () => {
        const banValue = await load("banStatus");
        banned = banValue === "ban";
        ready = true;
        // もし BAN状態 なら、どのページにいても BAN状態 ページにリダイレクト
        if (banned && window.location.pathname !== "/akukin") {
            navigate("/akukin", { replace: true });
        }
        // BAN状態 でないのに /akukin にアクセスした場合はホーム（"/"）へ戻す
        else if (!banned && window.location.pathname === "/akukin") {
            navigate("/", { replace: true });
        }
        // 直リン攻撃を検出してBANする
        else if (honeypot.has(window.location.pathname)) {
            await Promise.all([
                save("banStatus", "ban"),
                save("banReason", "pathnameScan"),
                save("tryScanPathname", window.location.pathname),
            ]);
            navigate("/akukin", { replace: true });
        }
    };

    // 初回ロード時にBAN状態をチェック
    $effect(() => {
        checkBanStatus();
    });
    // ページ遷移のたびにBAN状態をチェック
    // $ {
    //     checkBanStatus()
    // }
</script>

{#if ready}
    {@render children?.()}
{:else}
    <div>Loading...</div>
{/if}

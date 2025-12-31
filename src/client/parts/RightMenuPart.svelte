<script lang="ts">
    import Card from "@smui/card";
    import { Header, Subtitle, Title } from "@smui/drawer";
    import TopAppBar, { Row } from "@smui/top-app-bar";

    let { children, open = false } = $props();
</script>

{#snippet margin()}
    <div style="visibility:hidden;">
        <TopAppBar variant="static"><Row /></TopAppBar>
    </div>
{/snippet}

<Card class="drawer-container-right {open ? '' : 'hidden'}">
    {@render margin()}
    <div class="content">
        {@render children?.()}
    </div>
    {@render margin()}
</Card>

<style>
    :global(.drawer-container-right) {
        right: 0;
        opacity: 0.92;
        position: fixed;
        z-index: 16;
        top: 0;
        height: 100dvh;
        overflow-y: auto;
        transition: transform 0.3s ease;
        max-width: 100svw;
        width: 256px;
        transform: translateX(0);
        border: 1px solid
            var(--mdc-theme-text-hint-on-background, rgba(255, 255, 255, 0.1));
        box-shadow:
            -0px 8px 10px -5px rgba(0, 0, 0, 0.2),
            -0px 16px 24px 2px rgba(0, 0, 0, 0.14),
            -0px 6px 30px 5px rgba(0, 0, 0, 0.12);
    }
    :global(.drawer-container-right.hidden) {
        transform: translateX(calc(100% + 32px));
    }
    .content {
        padding: 0 8px;
    }
</style>

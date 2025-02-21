<script lang="ts">
    import Card, { Content } from "@smui/card";

    let { children, menu = true } = $props();
</script>

<main class="unj-main-part {menu ? 'menu' : ''}">
    <Card>
        <Content>
            {@render children?.()}
        </Content>
    </Card>
</main>

<style>
    :global(.unj-main-part > *) {
        text-align: center;
        background-color: transparent;
        box-shadow: none;
    }
    .unj-main-part.menu {
        margin: 0 auto;
        display: flex;
        justify-content: center;
    }
    :global(.unj-main-part.menu > *) {
        max-width: 100vw;
        min-width: 60vw;
        height: calc(
            100vh - var(--top-margin) - var(--bottom-margin) - var(--any-margin)
        );
        overflow-y: auto;
    }
</style>

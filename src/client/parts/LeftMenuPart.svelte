<script lang="ts">
    import Card from "@smui/card";
    import { Header, Subtitle, Title } from "@smui/drawer";
    import List, {
        Item,
        Text,
        Graphic,
        Separator,
        Subheader,
    } from "@smui/list";
    import TopAppBar, { Row } from "@smui/top-app-bar";
    import { navigate } from "svelte-routing";
    import { makePathname, pathname } from "../mylib/env.js";
    import BoardListPart from "./BoardListPart.svelte";

    let { board, open = false } = $props();

    const pathname2 = pathname().split("/")[2] ?? "";
</script>

{#snippet margin()}
    <div style="visibility:hidden;">
        <TopAppBar variant="static"><Row /></TopAppBar>
    </div>
{/snippet}

<Card class="drawer-container-left {open ? '' : 'hidden'}">
    {@render margin()}
    <div class="content">
        <List>
            <Subheader tag="h6">おまけのページ</Subheader>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}/terms`))}
                activated={pathname2 === "terms"}
            >
                <Graphic class="material-icons" aria-hidden="true"
                    >gavel</Graphic
                >
                <Text>利用規約</Text>
            </Item>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}/contact`))}
                activated={pathname2 === "contact"}
            >
                <Graphic class="material-icons" aria-hidden="true">help</Graphic
                >
                <Text>お問い合わせ</Text>
            </Item>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}/art`))}
                activated={pathname2 === "art"}
            >
                <Graphic class="material-icons" aria-hidden="true"
                    >view_carousel</Graphic
                >
                <Text>TOP絵集</Text>
            </Item>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}/links`))}
                activated={pathname2 === "links"}
            >
                <Graphic class="material-icons" aria-hidden="true">link</Graphic
                >
                <Text>リンク集</Text>
            </Item>
            <Separator />
        </List>
    </div>

    <BoardListPart />

    {@render margin()}
</Card>

<style>
    :global(.drawer-container-left) {
        left: 0;
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
    :global(.drawer-container-left.hidden) {
        transform: translateX(calc(-100% - 32px));
    }
    .content {
        padding: 0 8px;
    }
</style>

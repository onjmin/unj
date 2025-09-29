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
    import { Link, navigate } from "svelte-routing";
    import { publicBoards } from "../../common/request/board.js";
    import { makePathname, pathname } from "../mylib/env.js";

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
    <Header>
        <Title class="left-menu-title">メインメニュー</Title>
        <Subtitle class="left-menu-subtitle"
            >うんｊのサイトマップです。</Subtitle
        >
    </Header>
    <div class="content">
        <List>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}/new`))}
                activated={pathname2 === "new"}
            >
                <Graphic class="material-icons" aria-hidden="true"
                    >edit_note</Graphic
                >
                <Text>スレ立て</Text>
            </Item>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}`))}
                activated={pathname2 === ""}
            >
                <Graphic class="material-icons" aria-hidden="true"
                    >article</Graphic
                >
                <Text>ヘッドライン</Text>
            </Item>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}/search`))}
                activated={pathname2 === "search"}
            >
                <Graphic class="material-icons" aria-hidden="true"
                    >search</Graphic
                >
                <Text>検索</Text>
            </Item>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}/history`))}
                activated={pathname2 === "history"}
            >
                <Graphic class="material-icons" aria-hidden="true"
                    >history</Graphic
                >
                <Text>履歴</Text>
            </Item>
            <Item
                onclick={() => navigate(makePathname(`/${board.key}/config`))}
                activated={pathname2 === "config"}
            >
                <Graphic class="material-icons" aria-hidden="true"
                    >settings</Graphic
                >
                <Text>個人設定</Text>
            </Item>

            <Separator />
            <Subheader tag="h6">サイト情報</Subheader>
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
                onclick={() => navigate(makePathname(`/${board.key}/news`))}
                activated={pathname2 === "news"}
            >
                <Graphic class="material-icons" aria-hidden="true"
                    >newspaper</Graphic
                >
                <Text>ニュース</Text>
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
        </List>
    </div>
    <div class="text-left">
        <ul class="p-2 space-y-1">
            <li>板一覧</li>
            {#each publicBoards as b}
                <li>
                    <Link
                        to={makePathname(`/${b.key}`)}
                        class="block px-3 py-1 rounded-md transition-colors"
                    >
                        {b.name}
                    </Link>
                </li>
            {/each}
        </ul>
    </div>
    {@render margin()}
</Card>

<style>
    :global(.drawer-container-left) {
        left: 0;
        opacity: 0.92;
        position: fixed;
        z-index: 16;
        top: 0;
        bottom: 0;
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
    :global(.left-menu-title) {
        opacity: 0.87;
        font-size: var(--mdc-typography-headline6-font-size, 1.25rem);
    }
    :global(.left-menu-subtitle) {
        opacity: 0.6;
        font-size: var(--mdc-typography-body2-font-size, 0.875rem);
    }
    .content {
        padding: 0 8px;
    }
</style>

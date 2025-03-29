<script lang="ts">
    import Drawer, { Content, Header, Title, Subtitle } from "@smui/drawer";
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

    let { open = false } = $props();
</script>

<div class="drawer-container-left">
    <Drawer variant="modal" fixed bind:open>
        <TopAppBar variant="static"><Row /></TopAppBar>
        <Header>
            <Title>メインメニュー</Title>
            <Subtitle>うんｊのサイトマップです。</Subtitle>
        </Header>
        <Content>
            <List>
                <Item
                    onclick={() => navigate(makePathname("/new"))}
                    activated={pathname().startsWith("/new")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >edit_note</Graphic
                    >
                    <Text>スレ立て</Text>
                </Item>
                <Item
                    onclick={() => navigate(makePathname("/headline"))}
                    activated={pathname().startsWith("/headline")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >article</Graphic
                    >
                    <Text>ヘッドライン</Text>
                </Item>
                <Item
                    onclick={() => navigate(makePathname("/history"))}
                    activated={pathname().startsWith("/history")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >history</Graphic
                    >
                    <Text>閲覧履歴</Text>
                </Item>
                <Item
                    onclick={() => navigate(makePathname("/bookmark"))}
                    activated={pathname().startsWith("/bookmark")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >star</Graphic
                    >
                    <Text>#後で見る</Text>
                </Item>
                <Item
                    onclick={() => navigate(makePathname("/config"))}
                    activated={pathname().startsWith("/config")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >settings</Graphic
                    >
                    <Text>個人設定</Text>
                </Item>

                <Separator />
                <Subheader tag="h6">サイト情報</Subheader>
                <Item
                    onclick={() => navigate(makePathname("/terms"))}
                    activated={pathname().startsWith("/terms")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >gavel</Graphic
                    >
                    <Text>利用規約</Text>
                </Item>
                <Item
                    onclick={() => navigate(makePathname("/contact"))}
                    activated={pathname().startsWith("/contact")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >help</Graphic
                    >
                    <Text>お問い合わせ</Text>
                </Item>
                <Item
                    onclick={() => navigate(makePathname("/update"))}
                    activated={pathname().startsWith("/update")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >new_releases</Graphic
                    >
                    <Text>新機能のお知らせ</Text>
                </Item>
                <Item
                    onclick={() => navigate(makePathname("/art"))}
                    activated={pathname().startsWith("/art")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >view_carousel</Graphic
                    >
                    <Text>TOP絵集</Text>
                </Item>
                <Item
                    onclick={() => navigate(makePathname("/links"))}
                    activated={pathname().startsWith("/links")}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >link</Graphic
                    >
                    <Text>リンク集</Text>
                </Item>
            </List>
        </Content>
    </Drawer>
</div>

<style>
    .drawer-container-left {
        opacity: 0.92;
        position: fixed;
        z-index: 16;
        top: 0;
        bottom: 0;
        overflow-y: auto;
        border: 1px solid
            var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.1));
    }
</style>

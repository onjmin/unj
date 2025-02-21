<script lang="ts">
    import Drawer, { Content, Header, Title, Subtitle } from "@smui/drawer";
    import List, {
        Item,
        Text,
        Graphic,
        Separator,
        Subheader,
    } from "@smui/list";
    import { navigate } from "svelte-routing";
    import { base, pathname } from "../mylib/env.js";

    let { open = false } = $props();
</script>

<div class="drawer-container-left">
    <Drawer variant="modal" fixed bind:open>
        <Header>
            <Title>メインメニュー</Title>
            <Subtitle>うんｊのサイトマップです。</Subtitle>
        </Header>
        <Content>
            <List>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/new"))}
                    activated={pathname() === "/new"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >edit_note</Graphic
                    >
                    <Text>スレ立て</Text>
                </Item>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/headline"))}
                    activated={pathname() === "/headline"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >article</Graphic
                    >
                    <Text>ヘッドライン</Text>
                </Item>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/history"))}
                    activated={pathname() === "/history"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >history</Graphic
                    >
                    <Text>閲覧履歴</Text>
                </Item>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/bookmark"))}
                    activated={pathname() === "/bookmark"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >bookmark</Graphic
                    >
                    <Text>#後で見る</Text>
                </Item>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/config"))}
                    activated={pathname() === "/config"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >settings</Graphic
                    >
                    <Text>個人設定</Text>
                </Item>

                <Separator />
                <Subheader tag="h6">サイト情報</Subheader>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/terms"))}
                    activated={pathname() === "/terms"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >gavel</Graphic
                    >
                    <Text>利用規約</Text>
                </Item>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/contact"))}
                    activated={pathname() === "/contact"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >help</Graphic
                    >
                    <Text>お問い合わせ</Text>
                </Item>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/update"))}
                    activated={pathname() === "/update"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >new_releases</Graphic
                    >
                    <Text>新機能のお知らせ</Text>
                </Item>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/banner"))}
                    activated={pathname() === "/banner"}
                >
                    <Graphic class="material-icons" aria-hidden="true"
                        >view_carousel</Graphic
                    >
                    <Text>バナー展示場</Text>
                </Item>
                <Item
                    href="javascript:void(0)"
                    onclick={() => navigate(base("/links"))}
                    activated={pathname() === "/links"}
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
        position: fixed;
        top: calc(var(--top-margin) + var(--any-margin) / 3);
        bottom: 0;
        overflow-y: auto;
        z-index: 16;
        border: 1px solid
            var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.1));
    }
</style>

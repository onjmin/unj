<script lang="ts">
    import BottomAppBar, { Section } from "@smui-extra/bottom-app-bar";
    import Card, { Content } from "@smui/card";
    import IconButton from "@smui/icon-button";
    import { navigate } from "svelte-routing";
    import { makePathname } from "../mylib/env.js";
    import {
        isEnabledRightMenu,
        isMobile,
        openLeft,
        openRight,
    } from "../mylib/store.js";

    let { children, menu = true } = $props();
</script>

<main class="unj-main-part {menu ? 'menu' : ''}">
    <Card>
        <Content>
            {@render children?.()}
        </Content>
    </Card>
</main>

{#if menu}
    <footer class="unj-footer-part">
        <BottomAppBar variant="static">
            <Section align="start" toolbar>
                <IconButton
                    class="material-icons"
                    onclick={() => {
                        if ($isMobile) {
                            openRight.set(false);
                        }
                        openLeft.update((v) => !v);
                    }}>menu</IconButton
                >
            </Section>
            <Section>
                <div class="icon-container">
                    <IconButton
                        class="material-icons"
                        aria-label="edit_note"
                        onclick={() => navigate(makePathname("/new"))}
                        >edit_note</IconButton
                    >
                    <div class="label-overlay">新規</div>
                </div>
                <div class="icon-container">
                    <IconButton
                        class="material-icons"
                        aria-label="article"
                        onclick={() => navigate(makePathname("/headline"))}
                        >article</IconButton
                    >
                    <div class="label-overlay">一覧</div>
                </div>
                <div class="icon-container">
                    <IconButton
                        class="material-icons"
                        aria-label="settings"
                        onclick={() => navigate(makePathname("/config"))}
                        >settings</IconButton
                    >
                    <div class="label-overlay">設定</div>
                </div>
                <div class="icon-container">
                    <IconButton
                        class="material-icons"
                        aria-label="help"
                        onclick={() => navigate(makePathname("/contact"))}
                        >help</IconButton
                    >
                    <div class="label-overlay">FAQ</div>
                </div>
            </Section>
            <Section align="end" toolbar>
                <IconButton
                    class="material-icons"
                    style="visibility:{$isEnabledRightMenu
                        ? 'visible'
                        : 'hidden'};"
                    onclick={() => {
                        if ($isMobile) {
                            openLeft.set(false);
                        }
                        openRight.update((v) => !v);
                    }}>menu</IconButton
                >
            </Section>
        </BottomAppBar>
    </footer>
{/if}

<style>
    .unj-footer-part {
        z-index: 64;
        overflow: hidden;
    }
    .icon-container {
        position: relative;
        display: inline-block;
    }
    .label-overlay {
        position: absolute;
        bottom: 0;
        transform: translateX(-50%) translateY(100%);
        left: 50%;
        font-size: 10px;
        padding: 2px 4px;
        border-radius: 4px;
        pointer-events: none;
        white-space: nowrap;
    }
</style>

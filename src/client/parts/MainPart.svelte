<script lang="ts">
    import BottomAppBar, { Section } from "@smui-extra/bottom-app-bar";
    import Card, { Content } from "@smui/card";
    import IconButton from "@smui/icon-button";
    import { navigate } from "svelte-routing";
    import { randArray } from "../../common/util.js";
    import { makePathname } from "../mylib/env.js";
    import {
        isEnabledRightMenu,
        isMobile,
        openLeft,
        openRight,
    } from "../mylib/store.js";

    let { children, menu = true } = $props();

    let showAd = $state(true);

    const closeAd = (event: MouseEvent) => {
        event.stopPropagation(); // ✖ ボタンでクリックを伝播させない
        showAd = false;
    };

    const openAd = () => {
        window.open(ad.href, "_blank");
    };

    const ads = [
        {
            title: "🎵 MusicFM",
            description: "君だけのプレイリストを友達と共有しよう",
            image: "https://musicfm.pages.dev/zero.png",
            href: "https://musicfm.pages.dev/",
        },
        {
            title: "HGペイント",
            description: "歩行グラを作れるフリーソフトです。",
            image: "https://rpgja.github.io/rpgen-walk/midori.png",
            href: "https://rpgja.github.io/rpgen-walk/",
        },
        {
            title: "三蔵新山株式会社",
            description: "都市と自然を、やさしくむすぶ",
            image: "https://i.imgur.com/AQV3TtI.png",
            href: "https://onjmin.github.io/sanshin/",
        },
        {
            title: "¥5,220 予約受付中",
            description:
                "（再販）ねんどろいど おんJシリーズ 束音ロゼ 【送料無料】",
            image: "https://i.imgur.com/VSyr9Ni.png",
            href: "https://onjmin.github.io/shop/",
        },
        {
            title: "おんｊ技術部",
            description: "おんJ民専用Discord",
            image: "https://unj.netlify.app/static/favicons/loze.png",
            href: "https://disboard.org/ja/server/1340540775401787494",
        },
    ];

    const ad = randArray(ads);
</script>

<main class="unj-main-part {menu ? 'menu' : ''}">
    <Card>
        <Content>
            {@render children?.()}
        </Content>
    </Card>
</main>

{#if menu}
    {#if showAd}
        <div
            class="w-full relative cursor-pointer overflow-hidden rounded shadow-md mb-2"
            onclick={openAd}
            tabindex="0"
            role="button"
            onkeydown={() => {}}
        >
            <!-- 背景画像 -->
            <img
                src={ad.image}
                alt={ad.title}
                class="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />

            <!-- 内容 -->
            <div
                class="relative flex items-center gap-3 px-4 py-2 text-gray-900 dark:text-gray-100 h-16"
            >
                <!-- ✖ ボタン -->
                <button
                    class="absolute top-1 right-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 z-10"
                    onclick={closeAd}
                    aria-label="閉じる"
                >
                    ✖
                </button>

                <!-- favicon アイコン: 高さ制限だけする -->
                <img
                    src={ad.image}
                    alt="Logo"
                    class="max-h-full w-auto z-10 object-contain"
                />

                <!-- タイトル + PR文 -->
                <div class="flex flex-col justify-center z-10">
                    <span class="font-bold text-sm">{ad.title}</span>
                    <span class="text-xs opacity-80">{ad.description}</span>
                </div>
            </div>
        </div>
    {/if}

    <footer class="unj-footer-part">
        <BottomAppBar variant="static">
            <Section align="start" toolbar>
                <IconButton
                    class="material-icons"
                    onclick={() => {
                        if ($isMobile) {
                            $openRight = false;
                        }
                        $openLeft = !$openLeft;
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
                        onclick={() => navigate(makePathname("/news"))}
                        >newspaper</IconButton
                    >
                    <div class="label-overlay">NEWS</div>
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
                            $openLeft = false;
                        }
                        $openRight = !$openRight;
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

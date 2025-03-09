<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Banner, { Icon, Label } from "@smui/banner";
    import Button from "@smui/button";
    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import { format } from "date-fns";
    import { ja } from "date-fns/locale";
    import { Howl, Howler } from "howler";
    import type { Res, Thread } from "../../common/response/schema.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { visible } from "../mylib/dom.js";
    import {
        coolTimeOfModify,
        getNonceKey,
        init,
        nonceKey,
        ok,
        socket,
    } from "../mylib/socket.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import ContentFormPart from "../parts/ContentFormPart.svelte";

    let { threadId = "", resNum = "" } = $props();

    let content = $state("");
    let contentUrl = $state("");
    let contentType = $state(1);

    let bookmark = $state(false); // idbから取得する

    let online = $state(0);
    let pv = $state(0);
    const handleJoinThread = (data: {
        ok: boolean;
        size: number;
        pv: number | null;
    }) => {
        if (data.ok) {
            online = data.size;
            pv = data.pv ?? pv;
        }
    };

    let thread: Thread | null = $state(null);
    let title = $state("スレ読み込み中");
    let lolCount = $state(0);
    let goodVotes = $state(0);
    let badVotes = $state(0);
    let total = $state(0);
    let denominator = $state(0);
    let goodRatio = $state(0);
    let badRatio = $state(0);
    let chips: string[] = $state([]);
    const handleReadThread = (data: { ok: boolean; thread: Thread }) => {
        if (data.ok) {
            ok();
            thread = data.thread;
            title = thread.title;
            lolCount = thread.lolCount;
            goodVotes = thread.goodCount;
            badVotes = thread.badCount;
            chips = [];
            if (thread.ccBitmask & 2) {
                chips.push("自演防止＠jien");
            }
            if (thread.varsan) {
                chips.push("バルサン中");
            }
            if (thread.sage) {
                chips.push("強制sage");
            }
        }
    };

    const sound = new Howl({
        src: ["https://rpgen.org/dq/sound/res/29.mp3"],
    });

    let openNewResNotice = $state(false);
    let newResCount = $state(0);
    let isAlreadyScrollEnd = $state(false);
    const handleRes = (data: { ok: boolean; new: Res; yours: boolean }) => {
        if (data.ok) {
            if (!thread) {
                return;
            }
            if (thread.resList.length > 128) {
                thread.resList.shift();
            }
            thread.resList.push(data.new);
            sound.play();
            if (data.yours) {
                getNonceKey();
                content = "";
                contentUrl = "";
                setTimeout(() => scrollToEnd(), 512);
            } else {
                openNewResNotice = true;
                newResCount++;
                isAlreadyScrollEnd = false;
            }
        }
    };

    const scrollToEnd = () => {
        const main = document.querySelector(".unj-main-part") ?? document.body;
        main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
        openNewResNotice = false;
        newResCount = 0;
        isAlreadyScrollEnd = true;
    };

    const handleLoL = (data: {
        ok: boolean;
        lolCount: number;
        yours: boolean;
    }) => {
        if (data.ok) {
            lolCount = data.lolCount;
            if (data.yours) getNonceKey();
        }
    };

    const handleLike = (data: {
        ok: boolean;
        goodCount: number;
        badCount: number;
        yours: boolean;
    }) => {
        if (data.ok) {
            goodVotes = data.goodCount;
            badVotes = data.badCount;
            if (data.yours) getNonceKey();
        }
    };

    $effect(() => {
        total = goodVotes + badVotes;
        denominator = total < 16 ? 16 : total;
        goodRatio = (goodVotes / denominator) * 100;
        badRatio = (badVotes / denominator) * 100;
    });

    let id: NodeJS.Timeout | undefined;
    $effect(() => {
        id = init(() => {
            socket.emit("joinThread", {
                threadId,
            });
            socket.emit("readThread", {
                nonce: genNonce(nonceKey),
                cursor: null,
                size: 16,
                desc: true,
                threadId,
            });
        });
        socket.on("joinThread", handleJoinThread);
        socket.on("readThread", handleReadThread);
        socket.on("res", handleRes);
        socket.on("lol", handleLoL);
        socket.on("like", handleLike);
        return () => {
            clearTimeout(id);
            socket.off("joinThread", handleJoinThread);
            socket.off("readThread", handleReadThread);
            socket.off("res", handleRes);
            socket.off("lol", handleLoL);
            socket.off("like", handleLike);
        };
    });

    let emitting = $state(false);
    const tryRes = () => {
        emitting = true;
        // フロントエンドのバリデーション
        // バックエンドに送信
        socket.emit("res", {
            nonce: genNonce(nonceKey),
            threadId,
            userName: null,
            userAvatar: null,
            content,
            contentUrl,
            contentType,
        });
        id = setTimeout(() => {
            emitting = false;
            getNonceKey();
        }, coolTimeOfModify);
    };

    const tryLoL = () => {
        socket.emit("lol", {
            nonce: genNonce(nonceKey),
            threadId,
        });
    };

    const tryLike = (good: boolean) => {
        socket.emit("like", {
            nonce: genNonce(nonceKey),
            threadId,
            good,
        });
    };
</script>

<HeaderPart {title} bind:bookmark>
    <AccessCounterPart {online} {pv} />
    <p>レス書き込み欄</p>
    <ContentFormPart
        disabled={emitting}
        bind:content
        bind:contentUrl
        bind:contentType
    />
    <Button disabled={emitting} onclick={tryRes} variant="raised"
        >投稿する</Button
    >
</HeaderPart>

<Banner bind:open={openNewResNotice} centered mobileStacked>
    {#snippet icon()}
        <Icon class="material-icons">fiber_new</Icon>
    {/snippet}
    {#snippet label()}
        <Label>{newResCount}件の新着レス</Label>
    {/snippet}
    {#snippet actions()}
        <Button onclick={scrollToEnd}>見に行く</Button>
        <Button>却下</Button>
    {/snippet}
</Banner>

<MainPart>
    {#if thread}
        <div class="thread-header">
            <p class="thread-title">{thread.title}</p>
            <ChipSet {chips}>
                {#snippet chip(chip: string)}
                    <Chip {chip}>
                        <LeadingIcon class="material-icons"
                            >priority_high</LeadingIcon
                        >
                        <Text tabindex={0}>{chip}</Text>
                    </Chip>
                {/snippet}
            </ChipSet>
            <div class="lol-button-container">
                <Button class="lol" onclick={tryLoL}>草</Button>
                <span>×{lolCount}草</span>
                <span>{"ｗ".repeat(lolCount)}</span>
            </div>
        </div>
    {:else}
        <p>スレ読み込み中…</p>
    {/if}
    <div class="res-list">
        {#each thread?.resList ?? [] as res, i}
            <div class="res">
                <!-- 上段: 名前欄 -->
                <div class="name-row">
                    {res.num}：<span class="user-name">{res.ccUserName}</span>：
                    {format(res.createdAt, "yy/MM/dd(EEE) HH:mm:ss", {
                        locale: ja,
                    })}
                    ID:{res.ccUserId}
                    {#if res.isOwner}
                        <span class="thread-owner">主</span>
                    {/if}
                </div>
                <!-- 下段: アイコンと内容 -->
                <div class="content-row">
                    <!-- 固定幅・高さのアイコン -->
                    <span class="avatar">
                        <img
                            src="https://avatars.githubusercontent.com/u/88383494"
                            alt="User Avatar"
                        />
                    </span>
                    <!-- 右側のコンテンツ領域 -->
                    <div class="content">
                        <div class="content-text">
                            {res.content}
                        </div>
                        <div class="content-url">
                            <a
                                href={res.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {res.contentUrl}
                            </a>
                        </div>
                        <div class="content-embed">youtube embed</div>
                    </div>
                </div>
                {#if i === 0}
                    <div class="unj-like-vote-container">
                        <div class="vote-buttons">
                            <Button
                                class="good-vote"
                                onclick={() => tryLike(true)}>ｲｲ!</Button
                            >
                            <span class="good-count">+{goodVotes}</span>
                            <div class="bar">
                                <div
                                    class="good"
                                    style="width:{goodRatio}%;"
                                ></div>
                                <div
                                    class="bad"
                                    style="width:{badRatio}%;"
                                ></div>
                            </div>
                            <span class="bad-count">-{badVotes}</span>
                            <Button
                                class="bad-vote"
                                onclick={() => tryLike(false)}>ｲｸﾅｲ!</Button
                            >
                        </div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
    <div
        use:visible={(visible) => {
            if (visible && !isAlreadyScrollEnd) {
                openNewResNotice = false;
                newResCount = 0;
                isAlreadyScrollEnd = true;
            }
        }}
    ></div>
</MainPart>

<FooterPart />

<style>
    .thread-header {
        text-align: left;
        inline-size: 768px;
        max-inline-size: 92%;
        padding-bottom: 16px;
        padding-left: 16px;
        padding-right: 16px;
    }
    .thread-title {
        color: #66c0b5;
        font-weight: bold;
    }
    .res-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        text-align: left;
    }
    .res {
        border: 2mm ridge rgba(255, 255, 255, 0.1);
        padding: 8px;
    }
    /* 名前欄は全幅で上段に表示 */
    .name-row {
        width: 100%;
        margin-bottom: 8px;
    }
    .user-name {
        color: #66c0b5;
        font-weight: bold;
    }
    .thread-owner {
        color: #aa0000;
        font-size: small;
    }
    /* content-row はアイコンと内容を横並びに */
    .content-row {
        display: flex;
        align-items: flex-start;
        width: 100%;
    }
    /* avatar は固定サイズ、左側に配置 */
    .avatar {
        flex: 0 0 auto;
        width: 64px;
        height: 64px;
        margin-right: 8px;
    }
    .avatar img {
        border-radius: 50%;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .avatar img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    /* content は縦並びに、右側の残りスペースを使用 */
    .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        inline-size: 768px;
        max-inline-size: 100%;
    }
    /* content-text は改行を含むテキストを自動折り返し */
    .content-text {
        display: block;
        white-space: pre-wrap; /* 改行も反映、必要に応じて折り返す */
        overflow-wrap: break-word; /* 長い単語も折り返し */
        margin-bottom: 4px;
    }
    .content-url,
    .content-embed {
        margin-bottom: 4px;
    }
    .content-url a {
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }

    /* ｲｲ!(・∀・) (・Ａ・)ｲｸﾅｲ!  */
    .unj-like-vote-container {
        display: flex;
        align-items: right;
        justify-content: right;
        gap: 8px;
        padding: 8px;
    }
    .vote-buttons {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    :global(.unj-like-vote-container .good-vote) {
        color: #66f;
    }

    :global(.unj-like-vote-container .bad-vote) {
        color: #f66;
    }
    @media screen and (min-width: 768px) {
        :global(.unj-like-vote-container .good-vote)::after {
            content: "(・∀・)";
        }
        :global(.unj-like-vote-container .bad-vote)::before {
            content: "(・Ａ・)";
        }
    }
    .bar {
        position: relative;
        width: 64px; /* 固定幅 */
        height: 20px;
        background-color: #eee;
        border-radius: 10px; /* 角丸 */
        margin: 0 8px; /* 左右に少し余白 */
        overflow: hidden; /* はみ出すバーが隠れるように */
    }
    .good {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background-color: skyblue;
    }
    .bad {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background-color: #f99;
    }
    .good-count {
        min-width: 3rem;
        text-align: right;
    }
    .bad-count {
        min-width: 3rem;
    }
</style>

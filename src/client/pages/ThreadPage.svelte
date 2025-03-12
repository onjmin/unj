<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Banner, { Icon, Label } from "@smui/banner";
    import Button from "@smui/button";
    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import { Howl } from "howler";
    import type { Res, Thread } from "../../common/response/schema.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { visible } from "../mylib/dom.js";
    import { goodbye, hello, nonceKey, ok, socket } from "../mylib/socket.js";
    import {
        loadNewResSound,
        loadReplyResSound,
        loadSoundVolume,
    } from "../mylib/sound.js";
    import { sleep } from "../mylib/util.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import ResFormPart from "../parts/ResFormPart.svelte";
    import ResPart from "../parts/ResPart.svelte";

    let { threadId = "", resNum = "" } = $props();

    let userName = $state("");
    let userAvatar = $state(0);
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
            if ((thread.ccBitmask & 3) === 0) {
                chips.push("ID非表示");
            }
            if (thread.ccBitmask & 2) {
                chips.push("自演防止＠jien");
            }
            if ((thread.ccBitmask & 4) === 0) {
                chips.push("コテ禁");
            }
            if ((thread.ccBitmask & 8) === 0) {
                chips.push("アイコン禁止");
            }
            if (thread.varsan) {
                chips.push("バルサン中");
            }
            if (thread.sage) {
                chips.push("強制sage");
            }
        }
    };

    let newResSound: Howl;
    let replyResSound: Howl;
    $effect(() => {
        loadSoundVolume();
        loadNewResSound().then((sound) => {
            if (sound && sound.src !== null) {
                newResSound = new Howl({
                    src: [sound.src],
                    html5: true,
                });
            }
        });
        loadReplyResSound().then((sound) => {
            if (sound && sound.src !== null) {
                replyResSound = new Howl({
                    src: [sound.src],
                    html5: true,
                });
            }
        });
    });

    let openNewResNotice = $state(false);
    let newResCount = $state(0);
    let isAlreadyScrollEnd = $state(false);
    const handleRes = async (data: {
        ok: boolean;
        new: Res;
        yours: boolean;
    }) => {
        if (data.ok) {
            if (!thread) {
                return;
            }
            if (thread.resList.length > 128) {
                thread.resList.shift();
            }
            thread.resList.push(data.new);
            newResSound.play();
            if (data.yours) {
                ok();
                content = "";
                contentUrl = "";
                await sleep(512);
                scrollToEnd();
            } else {
                openNewResNotice = true;
                newResCount++;
                isAlreadyScrollEnd = false;
            }
            const m = data.new.content.match(/>>([0-9]+)/);
            if (m) {
                const num = Number(m[1]);
                const replyTo = thread.resList.find(
                    (v) => v.yours && v.num === num,
                );
                if (replyTo) {
                    await sleep(512);
                    replyResSound.play();
                }
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
            if (data.yours) ok();
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
            if (data.yours) ok();
        }
    };

    $effect(() => {
        total = goodVotes + badVotes;
        denominator = total < 16 ? 16 : total;
        goodRatio = (goodVotes / denominator) * 100;
        badRatio = (badVotes / denominator) * 100;
    });

    $effect(() => {
        hello(() => {
            socket.emit("joinThread", {
                threadId,
            });
            socket.emit("readThread", {
                nonce: genNonce(nonceKey),
                cursor: null,
                size: 64,
                desc: false,
                threadId,
            });
        });
        socket.on("joinThread", handleJoinThread);
        socket.on("readThread", handleReadThread);
        socket.on("res", handleRes);
        socket.on("lol", handleLoL);
        socket.on("like", handleLike);
        return () => {
            goodbye();
            socket.off("joinThread", handleJoinThread);
            socket.off("readThread", handleReadThread);
            socket.off("res", handleRes);
            socket.off("lol", handleLoL);
            socket.off("like", handleLike);
        };
    });

    let laaaaaaaag = $state(false);
    $effect(() => {
        const id = setTimeout(() => {
            laaaaaaaag = true;
        }, 4096);
        return () => clearTimeout(id);
    });

    let emitting = $state(false);
    const tryRes = async () => {
        emitting = true;
        // フロントエンドのバリデーション
        // バックエンドに送信
        socket.emit("res", {
            nonce: genNonce(nonceKey),
            threadId,
            userName,
            userAvatar,
            content,
            contentUrl,
            contentType,
        });
        await sleep(4096);
        ok();
        emitting = false;
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
    <ResFormPart
        disabled={emitting}
        bind:userName
        bind:userAvatar
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
    {#if thread === null}
        <p>スレ読み込み中…</p>
        <Paper
            color="primary"
            variant="outlined"
            style="visibility:{laaaaaaaag ? 'visible' : 'hidden'};"
        >
            <Title>まだ終わらない？</Title>
            <Subtitle>うんｊは同じIPからの多窓を禁止しています。</Subtitle>
            <Content>ページ更新してみてね。</Content>
        </Paper>
    {/if}
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
        <div class="res-list">
            <ResPart
                bind:input={content}
                num={1}
                isOwner={true}
                createdAt={thread.createdAt}
                ccUserId={thread.ccUserId}
                ccUserName={thread.ccUserName}
                ccUserAvatar={thread.ccUserAvatar}
                content={thread.content}
                contentUrl={thread.contentUrl}
            >
                <div class="unj-like-vote-container">
                    <div class="vote-buttons">
                        <Button class="good-vote" onclick={() => tryLike(true)}
                            >ｲｲ!</Button
                        >
                        <span class="good-count">+{goodVotes}</span>
                        <div class="bar">
                            <div class="good" style="width:{goodRatio}%;"></div>
                            <div class="bad" style="width:{badRatio}%;"></div>
                        </div>
                        <span class="bad-count">-{badVotes}</span>
                        <Button class="bad-vote" onclick={() => tryLike(false)}
                            >ｲｸﾅｲ!</Button
                        >
                    </div>
                </div>
            </ResPart>
            {#each thread.resList as res}
                <ResPart
                    bind:input={content}
                    num={res.num}
                    isOwner={res.isOwner}
                    createdAt={res.createdAt}
                    ccUserId={res.ccUserId}
                    ccUserName={res.ccUserName}
                    ccUserAvatar={res.ccUserAvatar}
                    content={res.content}
                    contentUrl={res.contentUrl}
                />
            {/each}
        </div>
    {/if}
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

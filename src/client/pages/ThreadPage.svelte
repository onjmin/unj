<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Banner, { Icon, Label } from "@smui/banner";
    import Button from "@smui/button";
    import Checkbox from "@smui/checkbox";
    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import FormField from "@smui/form-field";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import {
        differenceInDays,
        differenceInSeconds,
        intervalToDuration,
    } from "date-fns";
    import { navigate } from "svelte-routing";
    import type { Res, Thread } from "../../common/response/schema.js";
    import { sleep } from "../../common/util.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { visible } from "../mylib/dom.js";
    import { base } from "../mylib/env.js";
    import { Postload } from "../mylib/idb/postload.js";
    import { nonceKey } from "../mylib/idb/preload.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import {
        changeNewResSound,
        changeReplyResSound,
        changeVolume,
        newResSoundHowl,
        replyResSoundHowl,
    } from "../mylib/sound.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import BalsPart from "../parts/BalsPart.svelte";
    import ResFormPart from "../parts/ResFormPart.svelte";
    import ResPart from "../parts/ResPart.svelte";
    import TwemojiPart from "../parts/TwemojiPart.svelte";

    changeVolume();
    changeNewResSound();
    changeReplyResSound();

    let { threadId = "", resNum = "" } = $props();

    let userName = $state("");
    let userAvatar = $state(0);
    let content = $state("");
    let contentUrl = $state("");
    let contentType = $state(1);
    let sage = $state(false);

    // postload
    const contentPostload = new Postload(`content###${threadId}`);
    contentPostload.promise.then(() => {
        content = contentPostload.value ?? "";
    });
    $effect(() => {
        contentPostload.value = content === "" ? null : content;
    });

    // postload
    const sagePostload = new Postload(`sage###${threadId}`);
    sagePostload.promise.then(() => {
        sage = sagePostload.value === "sage";
    });
    $effect(() => {
        sagePostload.value = sage ? "sage" : null;
    });

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
            if (thread.resLimit < 1000) {
                chips.push(`上限${thread.resLimit}スレ`);
            }
            if (thread.deletedAt) {
                chips.push("時間制限スレ");
            }
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
            newResSoundHowl?.play();
            if (data.yours) {
                ok();
                contentPostload.value = null;
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
                    replyResSoundHowl?.play();
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

    let remaining = $state("");
    const countdown = (date: Date): string => {
        const now = new Date();
        const diffSeconds = differenceInSeconds(date, now);
        if (diffSeconds < 0) {
            navigate(base("/headline"), { replace: true });
            return "期限切れ";
        }
        if (diffSeconds <= 359999) {
            const duration = intervalToDuration({ start: now, end: date });
            const hours = String(
                (duration.hours ?? 0) + (duration.days ?? 0) * 24,
            ).padStart(2, "0");
            const minutes = String(duration.minutes ?? 0).padStart(2, "0");
            const seconds = String(duration.seconds ?? 0).padStart(2, "0");
            return `${hours}:${minutes}:${seconds}`;
        }
        const days = differenceInDays(date, now);
        return `あと${days}日`;
    };

    let id: NodeJS.Timeout;
    $effect(() => {
        id = setInterval(() => {
            if (!thread) return;
            if (!thread.deletedAt) return;
            remaining = countdown(thread.deletedAt);
        }, 512);
        hello(() => {
            socket.emit("joinThread", {
                threadId,
            });
            socket.emit("readThread", {
                nonce: genNonce(nonceKey.value ?? ""),
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
            clearInterval(id);
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
            nonce: genNonce(nonceKey.value ?? ""),
            threadId,
            userName,
            userAvatar,
            content,
            contentUrl,
            contentType,
            sage,
        });
        await sleep(4096);
        ok();
        emitting = false;
    };

    const tryLoL = () => {
        socket.emit("lol", {
            nonce: genNonce(nonceKey.value ?? ""),
            threadId,
        });
    };

    const tryLike = (good: boolean) => {
        socket.emit("like", {
            nonce: genNonce(nonceKey.value ?? ""),
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
    <FormField align="end">
        <Checkbox bind:checked={sage} />
        {#snippet label()}🠋{/snippet}
    </FormField>
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
            <Subtitle>サーバーが落ちてるかも。。</Subtitle>
            <Content>ページ更新してみてね。</Content>
        </Paper>
    {/if}
    {#if thread}
        <div class="thread-header">
            <p class="thread-title">
                <TwemojiPart seed={thread.id} height="16" /><span
                    style="padding-left: 5px;">{thread.title}</span
                >
            </p>
            <ChipSet {chips}>
                {#snippet chip(chip: string)}
                    <Chip {chip}>
                        <LeadingIcon class="material-icons"
                            >new_releases</LeadingIcon
                        >
                        <Text tabindex={0}>{chip}</Text>
                    </Chip>
                {/snippet}
            </ChipSet>
            {#if remaining !== ""}
                <div style="text-align:center">
                    <Chip>
                        <LeadingIcon class="material-icons"
                            >schedule</LeadingIcon
                        >
                        <Text tabindex={0}>{remaining}</Text>
                    </Chip>
                </div>
            {/if}
            <div class="lol-button-container">
                <Button class="lol" onclick={tryLoL}>草</Button>
                <span>×{lolCount}草</span>
                <span>{"ｗ".repeat(lolCount)}</span>
            </div>
        </div>
        <div class="res-list">
            <ResPart
                bind:input={content}
                ccUserId={thread.ccUserId}
                ccUserName={thread.ccUserName}
                ccUserAvatar={thread.ccUserAvatar}
                content={thread.content}
                contentUrl={thread.contentUrl}
                contentType={thread.contentType}
                commandResult=""
                id=""
                num={1}
                isOwner={true}
                sage={false}
                createdAt={thread.createdAt}
                threadId={thread.id}
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
                    ccUserId={res.ccUserId}
                    ccUserName={res.ccUserName}
                    ccUserAvatar={res.ccUserAvatar}
                    content={res.content}
                    contentUrl={res.contentUrl}
                    contentType={res.contentType}
                    commandResult={res.commandResult}
                    id={res.id}
                    num={res.num}
                    isOwner={res.isOwner}
                    sage={res.sage}
                    createdAt={res.createdAt}
                    threadId={thread.id}
                >
                    {#if res.num === thread.balsResNum}
                        <BalsPart />
                    {/if}
                </ResPart>
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

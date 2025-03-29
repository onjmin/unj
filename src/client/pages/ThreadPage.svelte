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
    import IconButton from "@smui/icon-button";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import {
        differenceInDays,
        differenceInSeconds,
        intervalToDuration,
    } from "date-fns";
    import { navigate } from "svelte-routing";
    import * as v from "valibot";
    import {
        contentSchemaMap,
        contentTemplateMap,
    } from "../../common/request/content-schema.js";
    import { ResSchema, myConfig } from "../../common/request/schema.js";
    import {
        SiteInfo,
        findIn,
    } from "../../common/request/whitelist/site-info.js";
    import type { Meta, Res, Thread } from "../../common/response/schema.js";
    import { sleep } from "../../common/util.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { visible } from "../mylib/dom.js";
    import { makePathname } from "../mylib/env.js";
    import { Postload } from "../mylib/idb/postload.js";
    import { nonceKey, termsAgreement } from "../mylib/idb/preload.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import {
        changeNewResSound,
        changeReplyResSound,
        changeVolume,
        newResSoundHowl,
        replyResSoundHowl,
    } from "../mylib/sound.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import BackgroundEmbedPart from "../parts/BackgroundEmbedPart.svelte";
    import BalsPart from "../parts/BalsPart.svelte";
    import ResFormPart from "../parts/ResFormPart.svelte";
    import ResPart from "../parts/ResPart.svelte";
    import TermsConfirmPart from "../parts/TermsConfirmPart.svelte";
    import TwemojiPart from "../parts/TwemojiPart.svelte";

    changeVolume();
    changeNewResSound();
    changeReplyResSound();

    let { threadId = "", cursor = "", desc = false } = $props();

    let openConfirm = $state(false);
    let openRight = $state(false);
    let textarea: HTMLTextAreaElement | null = $state(null);
    const focus = () => {
        textarea?.focus();
        openRight = true;
    };

    let userName = $state("");
    let userAvatar = $state(0);
    let contentText = $state("");
    let contentUrl = $state("");
    let contentType = $state(0);
    let sage = $state(false);
    let ninja = $state(false);

    // postload
    const contentTextPostload = new Postload(`contentText###${threadId}`);
    contentTextPostload.promise.then(() => {
        contentText = contentTextPostload.value ?? "";
    });
    $effect(() => {
        contentTextPostload.value = contentText === "" ? null : contentText;
    });

    // postload
    const sagePostload = new Postload(`sage###${threadId}`);
    sagePostload.promise.then(() => {
        sage = sagePostload.value === "sage";
    });
    $effect(() => {
        sagePostload.value = sage ? "sage" : null;
    });

    // postload
    const ninjaPostload = new Postload(`ninja###${threadId}`);
    ninjaPostload.promise.then(() => {
        ninja = ninjaPostload.value === "ninja";
    });
    $effect(() => {
        ninjaPostload.value = ninja ? "ninja" : null;
    });

    let bookmark = $state(false); // idbから取得する

    let online = $state(0);
    let pv = $state(0);
    const handleJoinThread = (data: {
        ok: boolean;
        size: number;
        pv: number | null;
    }) => {
        if (!data.ok) return;
        online = data.size;
        pv = data.pv ?? pv;
    };

    let chips: string[] = $state([]);
    const updateChips = () => {
        if (!thread) return;
        chips = [];
        if (thread.balsResNum) chips.push("※禁断呪文バルス（スレ強制終了）");
        if (thread.resLimit < 1000) chips.push(`上限${thread.resLimit}スレ`);
        if (thread.deletedAt) chips.push("時間制限スレ");
        if ((thread.ccBitmask & 3) === 0) chips.push("ID非表示");
        if (thread.ccBitmask & 2) chips.push("自演防止＠jien");
        if ((thread.ccBitmask & 4) === 0) chips.push("コテ禁");
        if ((thread.ccBitmask & 8) === 0) chips.push("アイコン禁止");
        if (thread.varsan) chips.push("バルサン中");
        if (thread.sage) chips.push("強制sage");
    };

    const updateContentType = () => {
        if (!thread) return;
        const { contentTypesBitmask } = thread;
        if ((contentTypesBitmask & contentType) !== 0) return;
        contentType = contentTypesBitmask & -contentTypesBitmask;
    };

    let thread: Thread | null = $state(null);
    let topCursor = $state("");
    let bottomCursor = $state("");
    let title = $state("スレ読み込み中");
    let lolCount = $state(0);
    let goodVotes = $state(0);
    let badVotes = $state(0);
    let total = $state(0);
    let denominator = $state(0);
    let goodRatio = $state(0);
    let badRatio = $state(0);
    let shouldScrollTo2 = $state(cursor !== "" && !desc);
    const handleReadThread = async (data: { ok: boolean; thread: Thread }) => {
        if (!data.ok) return;
        ok();
        thread = data.thread;
        if (thread.resList.length) {
            if (thread.desc) thread.resList.reverse();
            topCursor = thread.resList[0].cursor;
            bottomCursor = thread.resList[thread.resList.length - 1].cursor;
        }
        title = thread.title;
        lolCount = thread.lolCount;
        goodVotes = thread.goodCount;
        badVotes = thread.badCount;
        updateChips();
        updateContentType();
        if (shouldScrollTo2) {
            shouldScrollTo2 = false;
            await sleep(512);
            scrollTo2();
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
        if (!data.ok || !thread) return;
        if (thread.resList.length > 128) {
            thread.resList.shift();
        }
        thread.resList.push(data.new);
        thread.latestCursor = data.new.cursor;
        if (thread.ageResNum === data.new.num) thread.ageRes = data.new;
        newResSoundHowl?.play();
        if (data.yours) {
            ok();
            contentTextPostload.value = null;
            contentText = "";
            contentUrl = "";
            await sleep(512);
            scrollToEnd();
        } else {
            openNewResNotice = true;
            newResCount++;
            isAlreadyScrollEnd = false;
        }
        const m = data.new.contentText.match(/>>([0-9]+)/);
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
    };

    const handleUpdateMeta = async (data: { ok: boolean; new: Meta }) => {
        if (!data.ok || !thread) return;
        thread.varsan = data.new.varsan;
        thread.sage = data.new.sage;
        thread.ccBitmask = data.new.ccBitmask;
        thread.contentTypesBitmask = data.new.contentTypesBitmask;
        thread.ps = data.new.ps;
        thread.ageResNum = data.new.ageResNum;
        thread.ageRes = data.new.ageRes;
        thread.balsResNum = data.new.balsResNum;
        updateChips();
        updateContentType();
    };

    const scrollTo2 = () => {
        const main = document.querySelector(".unj-main-part") ?? document.body;
        const res = document.querySelectorAll(".res");
        const cursor = res[1];
        if (cursor) {
            main.scrollTo({
                top: (cursor as HTMLElement).offsetTop,
                behavior: "smooth",
            });
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
        if (!data.ok) return;
        lolCount = data.lolCount;
        if (data.yours) ok();
    };

    const handleLike = (data: {
        ok: boolean;
        goodCount: number;
        badCount: number;
        yours: boolean;
    }) => {
        if (!data.ok) return;
        goodVotes = data.goodCount;
        badVotes = data.badCount;
        if (data.yours) ok();
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
            navigate(makePathname("/headline"), { replace: true });
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
                cursor: cursor || null,
                size: 16,
                desc,
                threadId,
            });
        });
        socket.on("joinThread", handleJoinThread);
        socket.on("readThread", handleReadThread);
        socket.on("updateMeta", handleUpdateMeta);
        socket.on("res", handleRes);
        socket.on("lol", handleLoL);
        socket.on("like", handleLike);
        return () => {
            clearInterval(id);
            goodbye();
            socket.off("joinThread", handleJoinThread);
            socket.off("readThread", handleReadThread);
            socket.off("updateMeta", handleUpdateMeta);
            socket.off("res", handleRes);
            socket.off("lol", handleLoL);
            socket.off("like", handleLike);
        };
    });

    const cursorBasedPagination = async ({
        cursor,
        desc,
    }: {
        cursor?: string;
        desc: boolean;
    }) => {
        if (emitting) return;
        emitting = true;
        socket.emit("readThread", {
            nonce: genNonce(nonceKey.value ?? ""),
            cursor: cursor || null,
            size: 32,
            desc,
            threadId,
        });
        await sleep(2048);
        emitting = false;
        ok();
    };

    let laaaaaaaag = $state(false);
    $effect(() => {
        const id = setTimeout(() => {
            laaaaaaaag = true;
        }, 4096);
        return () => clearTimeout(id);
    });

    let emitting = $state(false);
    const tryRes = async () => {
        if (termsAgreement.value !== "yes") {
            openConfirm = true;
            return;
        }
        if (emitting) return;
        emitting = true;
        const data = {
            nonce: genNonce(nonceKey.value ?? ""),
            threadId,
            userName,
            userAvatar,
            contentText,
            contentUrl,
            contentType,
            sage,
            ninja,
        };
        const result = (() => {
            // 共通のバリデーション
            const res = v.safeParse(ResSchema, data, myConfig);
            if (!res.success) return;
            const contentTypesBitmask = thread?.contentTypesBitmask ?? 0;
            if ((contentTypesBitmask & res.output.contentType) === 0) return;
            const schema = contentSchemaMap.get(res.output.contentType);
            if (!schema) return;
            const content = v.safeParse(schema, data, myConfig);
            if (!content.success) return;
            return res.output;
        })();
        if (!result) {
            await sleep(4096);
            emitting = false;
            return;
        }
        socket.emit("res", result);
        await sleep(4096);
        emitting = false;
        ok();
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

    let siteInfo: SiteInfo | null = $state(null);
    $effect(() => {
        const temp =
            contentTemplateMap.get(thread?.ageRes?.contentType ?? 0) ?? [];
        try {
            siteInfo = findIn(
                temp,
                new URL(thread?.ageRes?.contentUrl ?? "").hostname,
            );
        } catch (err) {}
    });
</script>

<HeaderPart {title} bind:bookmark bind:openRight>
    <AccessCounterPart {online} {pv} />
    <p>レス書き込み欄</p>
    <ResFormPart
        disabled={emitting}
        bind:textarea
        bind:userName
        bind:userAvatar
        bind:contentText
        bind:contentUrl
        bind:contentType
        contentTypesBitmask={thread?.contentTypesBitmask ?? 0}
    />
    <Button disabled={emitting} onclick={tryRes} variant="raised"
        >投稿する</Button
    >
    <FormField align="end">
        <Checkbox bind:checked={sage} />
        {#snippet label()}🠋{/snippet}
    </FormField>
    <FormField align="end">
        <Checkbox bind:checked={ninja} />
        {#snippet label()}忍{/snippet}
    </FormField>
    {#if thread?.yours}
        <FormField align="end">
            <Checkbox disabled checked={true} />
            {#snippet label()}主{/snippet}
        </FormField>
    {/if}
</HeaderPart>

<TermsConfirmPart {openConfirm} />

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

{#if thread?.ageRes}
    <div class="ageRes">
        <ResPart
            bind:input={contentText}
            backgroundEmbedControls={siteInfo?.id === 3201 ||
                siteInfo?.id === 3202 ||
                siteInfo?.id === 6401}
            {focus}
            ccUserId={thread?.ageRes.ccUserId}
            ccUserName={thread?.ageRes.ccUserName}
            ccUserAvatar={thread?.ageRes.ccUserAvatar}
            contentText={thread?.ageRes.contentText}
            contentUrl={thread?.ageRes.contentUrl}
            contentType={1}
            cursor={thread?.ageRes.cursor}
            num={thread?.ageRes.num}
            isOwner={thread?.ageRes.isOwner}
            sage={thread?.ageRes.sage}
            createdAt={thread?.ageRes.createdAt}
            threadId={thread.id}
            threadTitle={thread.title}
        />
    </div>
    {#key thread?.ageRes.num}
        <BackgroundEmbedPart
            contentUrl={thread.ageRes.contentUrl}
            contentType={thread.ageRes.contentType}
        />
    {/key}
{/if}

{#snippet paginationControls()}
    <IconButton
        class="material-icons"
        disabled={emitting || thread?.firstCursor === topCursor}
        onclick={() => {
            cursorBasedPagination({
                cursor: thread?.firstCursor,
                desc: false,
            });
        }}>first_page</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={emitting || thread?.firstCursor === topCursor}
        onclick={() =>
            cursorBasedPagination({
                cursor: topCursor,
                desc: true,
            })}>chevron_left</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={emitting}
        onclick={() => navigate(makePathname("/headline"))}>home</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={emitting || thread?.latestCursor === bottomCursor}
        onclick={() => {
            shouldScrollTo2 = true;
            cursorBasedPagination({
                cursor: bottomCursor,
                desc: false,
            });
        }}>chevron_right</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={emitting || thread?.latestCursor === bottomCursor}
        onclick={() => {
            shouldScrollTo2 = true;
            cursorBasedPagination({
                cursor: thread?.latestCursor,
                desc: true,
            });
        }}>last_page</IconButton
    >
{/snippet}

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
            {#if thread.balsResNum}
                <span class="bals-warning">
                    【閲覧注意！】このスレはスレ主によってバルスされました。
                </span>
                <br />
                <span class="bals-warning">
                    最後のコメまでスクロールするとスレが崩壊しますよっと。。
                </span>
            {/if}
            {#if remaining !== ""}
                <div style="text-align:center">
                    <Chip chip>
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
        <div>{@render paginationControls()}</div>
        <div class="res-list">
            <ResPart
                {focus}
                bind:input={contentText}
                ccUserId={thread.ccUserId}
                ccUserName={thread.ccUserName}
                ccUserAvatar={thread.ccUserAvatar}
                contentText={thread.contentText}
                contentUrl={thread.contentUrl}
                contentType={thread.contentType}
                ps={thread.ps}
                num={1}
                isOwner={true}
                createdAt={thread.createdAt}
                threadId={thread.id}
                threadTitle={thread.title}
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
                    {focus}
                    bind:input={contentText}
                    ccUserId={res.ccUserId}
                    ccUserName={res.ccUserName}
                    ccUserAvatar={res.ccUserAvatar}
                    contentText={res.contentText}
                    contentUrl={res.contentUrl}
                    contentType={res.contentType}
                    commandResult={res.commandResult}
                    cursor={res.cursor}
                    num={res.num}
                    isOwner={res.isOwner}
                    sage={res.sage}
                    createdAt={res.createdAt}
                    threadId={thread.id}
                    threadTitle={thread.title}
                >
                    {#if res.num === thread.balsResNum}
                        <BalsPart />
                    {/if}
                </ResPart>
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
        <div>{@render paginationControls()}</div>
    {/if}
</MainPart>

<FooterPart />

<style>
    .ageRes {
        margin: 0 auto;
        max-width: 100svw;
        min-width: 60svw;
    }
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
    .bals-warning {
        background-color: #e57373;
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

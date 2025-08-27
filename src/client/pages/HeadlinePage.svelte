<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { SearchIcon } from "@lucide/svelte";
    import Button from "@smui/button";
    import List, { Item, Graphic, Separator } from "@smui/list";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import {
        differenceInDays,
        differenceInHours,
        differenceInMinutes,
        differenceInMonths,
        differenceInSeconds,
        differenceInWeeks,
        differenceInYears,
        isAfter,
    } from "date-fns";
    import { Link } from "svelte-routing";
    import { queryResultLimit } from "../../common/request/schema.js";
    import type { HeadlineThread } from "../../common/response/schema.js";
    import { sleep } from "../../common/util.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import { nonceKey } from "../mylib/unj-storage.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import TwemojiPart from "../parts/TwemojiPart.svelte";

    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        if (date > now) return "0秒";
        if (differenceInYears(now, date) > 0)
            return `${differenceInYears(now, date)}年`;
        if (differenceInMonths(now, date) > 0)
            return `${differenceInMonths(now, date)}か月`;
        if (differenceInWeeks(now, date) > 0)
            return `${differenceInWeeks(now, date)}週間`;
        if (differenceInDays(now, date) > 0)
            return `${differenceInDays(now, date)}日`;
        if (differenceInHours(now, date) > 0)
            return `${differenceInHours(now, date)}時間`;
        if (differenceInMinutes(now, date) > 0)
            return `${differenceInMinutes(now, date)}分`;
        return `${differenceInSeconds(now, date)}秒`;
    };

    let online = $state(0);
    let pv = $state(0);
    const handleJoinHeadline = (data: {
        ok: boolean;
        size: number;
        accessCount: number;
    }) => {
        if (!data.ok) return;
        online = data.size;
        pv = data.accessCount;
    };

    let threadList: HeadlineThread[] | null = $state(null);
    const cache = new ObjectStorage<HeadlineThread[]>("headlineCache");
    $effect(() => {
        cache.get().then((v) => {
            if (v && !threadList) threadList = v;
        });
    });

    const handleHeadline = (data: { ok: boolean; list: HeadlineThread[] }) => {
        if (!data.ok) return;
        ok();
        if (!data.list.length) return;
        if (!pagination) {
            threadList = data.list;
            cache.set(threadList);
        } else {
            if (threadList) threadList = threadList.concat(data.list);
        }
    };

    const handleNewHeadline = (data: { ok: boolean; new: HeadlineThread }) => {
        if (!data.ok || !threadList) return;
        if (threadList.length > 128) {
            threadList.pop();
        }
        threadList.unshift(data.new);
    };

    $effect(() => {
        hello(() => {
            socket.emit("joinHeadline", {});
            socket.emit("headline", {
                nonce: genNonce(nonceKey.value ?? ""),
                cursor: null,
                size: queryResultLimit,
                desc: true,
            });
        });
        socket.on("joinHeadline", handleJoinHeadline);
        socket.on("headline", handleHeadline);
        socket.on("newHeadline", handleNewHeadline);
        return () => {
            goodbye();
            socket.off("joinHeadline", handleJoinHeadline);
            socket.off("headline", handleHeadline);
            socket.off("newHeadline", handleNewHeadline);
        };
    });

    let pagination = $state(false);
    let emitting = $state(false);
    const cursorBasedPagination = async () => {
        if (emitting) return;
        emitting = true;
        pagination = true;
        socket.emit("headline", {
            nonce: genNonce(nonceKey.value ?? ""),
            cursor: threadList?.at(-1)?.latestResAt ?? null,
            size: queryResultLimit,
            desc: true,
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

    let searchQuery = $state("");
</script>

<HeaderPart title="ヘッドライン {online}人閲覧中">
    <AccessCounterPart {online} {pv} />
    <p>検索UI</p>
</HeaderPart>

<MainPart>
    {#if threadList === null}
        <p>ヘッドライン取得中…</p>
        <Paper
            color="primary"
            variant="outlined"
            style="visibility:{laaaaaaaag ? 'visible' : 'hidden'};"
        >
            <Title>まだ終わらない？</Title>
            <Subtitle>サーバーが落ちてるかも。。</Subtitle>
            <Content>ページ更新してみてね。</Content>
        </Paper>
    {:else}
        <div class="mb-3 flex items-center gap-2">
            <!-- 入力欄 + アイコン -->
            <div class="relative w-full">
                <input
                    type="text"
                    placeholder="スレタイ検索"
                    bind:value={searchQuery}
                    class="w-full rounded-md border border-gray-300 pl-8 pr-3 py-1 text-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:outline-none"
                />
                <SearchIcon
                    class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
            </div>

            <!-- 検索ボタン -->
            <button
                class="min-w-[64px] rounded-md bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"
                onclick={() => alert("めんてちゅ")}
            >
                検索
            </button>
        </div>
        <div class="unj-headline-container">
            <List class="demo-list" dense nonInteractive>
                {#each threadList as thread, i}
                    <div class="thread-block">
                        <Item disabled class="unj-headline-thread-item">
                            <div class="time-and-count-container">
                                <span class="res-time"
                                    >{formatTimeAgo(thread.latestResAt)}</span
                                >
                                <span class="res-count"
                                    >{thread.resCount}レス</span
                                >
                            </div>
                            <div class="pc-only">
                                <Graphic
                                    ><TwemojiPart
                                        seed={thread.id}
                                        height="16"
                                    /></Graphic
                                >
                            </div>
                            <div class="thread-title">
                                <Link
                                    to={makePathname(
                                        `/thread/${thread.id}${thread.resCount > queryResultLimit && thread.latestCursor ? `/${thread.latestCursor}/1` : ""}`,
                                    )}>{thread.title}</Link
                                >
                            </div>
                            <div
                                class={`pc-only thread-info online-${Math.min(3, thread.online)}`}
                            >
                                {thread.online}人閲覧中
                            </div>
                        </Item>
                        <!-- ここで子要素として1行下に latestRes を表示 -->
                        <div class="thread-latest-res">
                            {thread.latestRes}
                        </div>
                        {#if i % 4 === 3 && i !== (threadList ?? []).length - 1}
                            <Separator />
                        {/if}
                    </div>
                {/each}
            </List>
            <center>
                <Button
                    onclick={cursorBasedPagination}
                    variant="raised"
                    disabled={emitting}>続きを読む</Button
                >
            </center>
        </div>
    {/if}
</MainPart>

<FooterPart />

<style>
    .unj-headline-container {
        text-align: left;
    }
    .time-and-count-container {
        display: flex;
        justify-content: space-between;
    }
    .res-time {
        opacity: 0.6;
        font-size: 0.7rem;
        width: 3rem;
    }
    .res-count {
        font-size: 0.8rem;
        width: 3rem;
    }
    :global(.unj-headline-thread-item) {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 100%;
        overflow: hidden;
    }
    .thread-title {
        font-size: 1rem;
        margin-right: 0.5rem;
        flex: 1 1 auto;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .thread-info {
        flex: 0 1 16rem;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 0.6rem;
        transition: all 0.2s ease;
    }

    /* 0人：最も控えめ */
    .thread-info.online-0 {
        opacity: 0.4;
        color: #999; /* グレーで控えめ */
        font-weight: normal;
        font-style: normal;
        text-decoration: none;
    }

    /* 1人：少し強調 */
    .thread-info.online-1 {
        opacity: 0.7;
        color: #2a7fff; /* 青系でやや目立たせる */
        font-weight: 500;
        font-style: normal;
        text-decoration: none;
    }

    /* 2人：さらに強調 */
    .thread-info.online-2 {
        opacity: 0.85;
        color: #ff7f2a; /* オレンジ系で暖かく目立たせる */
        font-weight: 600;
        font-style: italic; /* 軽く斜体でアクセント */
        text-decoration: none;
    }

    /* 3人以上：最大強調 */
    .thread-info.online-3 {
        opacity: 1;
        color: #d32f2f; /* 赤系で最も強調 */
        font-weight: 700;
        font-style: italic;
        text-decoration: underline; /* さらに注目させる */
    }

    @media screen and (max-width: 768px) {
        .pc-only {
            display: none;
        }
    }
    .thread-block {
        margin-bottom: 0.5rem; /* 適度に間隔 */
    }
    .thread-latest-res {
        position: relative;
        margin: 0.2rem 0 0.4rem 2rem; /* スレタイ直下に余白＋字下げ */
        padding: 0.4rem 0.7rem;
        background: #f8f9fa; /* 薄グレー背景でカード感 */
        border-left: 3px solid #ccc; /* 親子関係を示す縦線 */
        border-radius: 0.4rem;
        color: #444;
        font-size: 0.9em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 90%;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* 軽く浮かせる */
    }
    /* ダークモード用 */
    :global(body.dark .thread-latest-res) {
        background: #2a2a2a; /* 暗めの背景 */
        border-left: 3px solid #555; /* 親子関係を示す縦線も暗めに */
        color: #ddd; /* 文字を明るくして読みやすく */
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); /* 影も強め */
    }
</style>

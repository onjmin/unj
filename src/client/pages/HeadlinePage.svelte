<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

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

    const sortByDesc = (list: HeadlineThread[]) =>
        list.sort(
            (a, b) => +new Date(b.latestResAt) - +new Date(a.latestResAt),
        );

    let allGone = $state(false);
    const handleHeadline = (data: { ok: boolean; list: HeadlineThread[] }) => {
        if (!data.ok) return;
        ok();
        if (data.list.length <= 1) {
            allGone = true;
            return;
        }
        if (threadList?.length) {
            const map = new Map(threadList.map((v, i) => [v.id, i]));
            const exist = data.list.filter((v) => map.has(v.id));
            const newList = data.list.filter((v) => !map.has(v.id));
            for (const v of exist) {
                const i = map.get(v.id);
                if (i) threadList[i] = v;
            }
            threadList = sortByDesc(threadList);
            if (newList.length) {
                const sorted = sortByDesc(newList);
                if (isAfter(threadList[0].latestResAt, sorted[0].latestResAt)) {
                    threadList = threadList.concat(sorted);
                } else {
                    threadList = sorted.concat(threadList);
                }
            }
        } else {
            threadList = sortByDesc(data.list);
        }
        cache.set(threadList);
    };

    const handleMakeThread = (data: { ok: boolean; new: HeadlineThread }) => {
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
        socket.on("makeThread", handleMakeThread);
        return () => {
            goodbye();
            socket.off("joinHeadline", handleJoinHeadline);
            socket.off("headline", handleHeadline);
            socket.off("makeThread", handleMakeThread);
        };
    });

    let emitting = $state(false);
    const cursorBasedPagination = async () => {
        if (emitting) return;
        emitting = true;
        socket.emit("headline", {
            nonce: genNonce(nonceKey.value ?? ""),
            cursor: threadList?.at(-1)?.id ?? null,
            size: queryResultLimit,
            desc: false,
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
    {/if}
    <div class="unj-headline-container">
        <List class="demo-list" dense nonInteractive>
            {#each threadList ?? [] as thread, i}
                <Item disabled class="unj-headline-thread-item">
                    <Graphic
                        ><TwemojiPart seed={thread.id} height="16" /></Graphic
                    >
                    <div class="time-and-count-container">
                        <span class="res-time"
                            >{formatTimeAgo(thread.latestResAt)}</span
                        >
                        <span class="res-count">{thread.resCount}レス</span>
                    </div>
                    <div class="thread-title">
                        <Link
                            to={makePathname(
                                `/thread/${thread.id}${thread.resCount > queryResultLimit && thread.latestCursor ? `/${thread.latestCursor}/1` : ""}`,
                            )}>{thread.title}</Link
                        >
                    </div>
                    <div class="latest-res">{thread.latestRes}</div>
                </Item>
                {#if i % 4 === 3 && i !== (threadList ?? []).length - 1}
                    <Separator />
                {/if}
            {/each}
        </List>
        <center>
            {#if !allGone}
                <Button
                    onclick={cursorBasedPagination}
                    variant="raised"
                    disabled={emitting}>続きを読む</Button
                >
            {/if}
        </center>
    </div>
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
    .latest-res {
        flex: 0 1 16rem;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        opacity: 0.6;
        font-size: 0.6rem;
    }
    @media screen and (max-width: 768px) {
        .latest-res {
            display: none;
        }
    }
</style>

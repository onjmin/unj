<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import List, { Item, Graphic } from "@smui/list";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import {
        differenceInDays,
        differenceInHours,
        differenceInMinutes,
        differenceInMonths,
        differenceInSeconds,
        differenceInWeeks,
        differenceInYears,
    } from "date-fns";
    import { Link } from "svelte-routing";
    import type { HeadlineThread } from "../../common/response/schema.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { makePathname } from "../mylib/env.js";
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
    const handleHeadline = (data: { ok: boolean; list: HeadlineThread[] }) => {
        if (!data.ok) return;
        ok();
        threadList = data.list;
        localStorage.headlineCache = JSON.stringify(data.list);
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
                size: 32,
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

    let laaaaaaaag = $state(false);
    $effect(() => {
        const id = setTimeout(() => {
            laaaaaaaag = true;
        }, 4096);
        return () => clearTimeout(id);
    });

    $effect(() => {
        const c = localStorage.headlineCache;
        if (!c) return;
        try {
            threadList = JSON.parse(c);
        } catch (err) {}
    });
</script>

<HeaderPart title="ヘッドライン {online}人閲覧中">
    <AccessCounterPart {online} {pv} />
    <p>検索UI</p>
</HeaderPart>

<MainPart>
    {#if threadList === null}
        <p>ヘッドライン読み込み中…</p>
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
            {#each threadList ?? [] as thread}
                <Item>
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
                                `/thread/${thread.id}${thread.latestCursor ? `/${thread.latestCursor}/1` : ""}`,
                            )}>{thread.title}</Link
                        >
                    </div>
                </Item>
            {/each}
        </List>
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
    .thread-title {
        font-size: 1rem;
    }
</style>

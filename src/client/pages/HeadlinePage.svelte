<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Accordion, { Panel, Header } from "@smui-extra/accordion";
    import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
    import IconButton, { Icon } from "@smui/icon-button";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import Snackbar, { Label } from "@smui/snackbar";
    import {
        differenceInDays,
        differenceInHours,
        differenceInMinutes,
        differenceInMonths,
        differenceInSeconds,
        differenceInWeeks,
        differenceInYears,
    } from "date-fns";
    import { navigate } from "svelte-routing";
    import type { HeadlineThread } from "../../common/response/schema.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { base } from "../mylib/env.js";
    import { nonceKey } from "../mylib/idb/preload.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import TwemojiPart from "../parts/TwemojiPart.svelte";

    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        if (date > now) return "0秒前";
        if (differenceInYears(now, date) > 0)
            return `${differenceInYears(now, date)}年前`;
        if (differenceInMonths(now, date) > 0)
            return `${differenceInMonths(now, date)}か月前`;
        if (differenceInWeeks(now, date) > 0)
            return `${differenceInWeeks(now, date)}週間前`;
        if (differenceInDays(now, date) > 0)
            return `${differenceInDays(now, date)}日前`;
        if (differenceInHours(now, date) > 0)
            return `${differenceInHours(now, date)}時間前`;
        if (differenceInMinutes(now, date) > 0)
            return `${differenceInMinutes(now, date)}分前`;
        return `${differenceInSeconds(now, date)}秒前`;
    };

    let isAlreadyBookmark = $state(false); // TODO

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
                size: 16,
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

    // TODO: 無視設定
    // TODO: ブックマーク設定

    let snackbar: Snackbar;
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
    <div class="unj-headline-accordion-container">
        <Accordion>
            {#each threadList ?? [] as thread}
                <Panel>
                    <Header>
                        <div class="time-and-count-container">
                            <span class="res-time"
                                >{formatTimeAgo(thread.latestResAt)}</span
                            >
                            <span class="res-count">{thread.resCount}レス</span>
                        </div>
                        {#snippet description()}
                            <TwemojiPart seed={thread.id} height="16" />
                            <span class="thread-title">{thread.title}</span>
                        {/snippet}
                        {#snippet icon()}
                            <Icon
                                class="material-icons"
                                style="visibility:{Math.random() > 0.2
                                    ? 'hidden'
                                    : 'visible'}">remove_red_eye</Icon
                            >
                        {/snippet}
                    </Header>
                    <Content style="text-align: center;">
                        <div>
                            <TwemojiPart seed={thread.id} height="16" /><span
                                style="padding-left: 5px;">{thread.title}</span
                            >
                        </div>
                        <DataTable
                            table$aria-label="People list"
                            style="max-width: 100%;"
                        >
                            <Head>
                                <Row>
                                    <Cell>スレ主ID</Cell>
                                    <Cell>接続</Cell>
                                    <Cell>勢い</Cell>
                                    <Cell numeric>草</Cell>
                                    <Cell numeric>ｲｲ!(・∀・)</Cell>
                                    <Cell numeric>(・Ａ・)ｲｸﾅｲ!</Cell>
                                </Row>
                            </Head>
                            <Body>
                                <Row>
                                    <Cell>{thread.ccUserId}</Cell>
                                    <Cell numeric>{thread.online}</Cell>
                                    <Cell numeric>{thread.ikioi}</Cell>
                                    <Cell numeric>{thread.lolCount}</Cell>
                                    <Cell numeric>{thread.goodCount}</Cell>
                                    <Cell numeric>{thread.badCount}</Cell>
                                </Row>
                            </Body>
                        </DataTable>
                        <span class="thread-detail-ui">
                            <IconButton
                                class="material-icons"
                                onclick={() => {
                                    isAlreadyBookmark = !isAlreadyBookmark;
                                    if (isAlreadyBookmark) {
                                        snackbar.open();
                                    } else {
                                        snackbar.close();
                                    }
                                }}
                                >{isAlreadyBookmark
                                    ? "star"
                                    : "star_outline"}</IconButton
                            >
                            <IconButton
                                class="material-icons"
                                onclick={() =>
                                    navigate(base(`/thread/${thread.id}`))}
                                >arrow_forward</IconButton
                            >
                        </span>
                    </Content>
                </Panel>
            {/each}
        </Accordion>
    </div>
</MainPart>

<FooterPart />

<!-- ここから固有のUI -->

<Snackbar bind:this={snackbar}>
    <Label>#後で見る</Label>
</Snackbar>

<style>
    .unj-headline-accordion-container {
        text-align: left;
    }

    /* @smui-extra/accordionのデフォルトのスタイルを改変 */
    :global(
            .unj-headline-accordion-container
                .smui-accordion
                .smui-accordion__panel
                > .smui-accordion__header
                .smui-accordion__header__title.smui-accordion__header__title--with-description
        ) {
        max-width: 96px;
    }

    .time-and-count-container {
        display: flex;
        justify-content: space-between;
    }

    .res-time {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.6rem;
    }

    .res-count {
        font-size: 0.7rem;
    }

    .thread-title {
        font-size: 0.7rem;
        vertical-align: bottom;
    }

    .thread-detail-ui {
        display: inline-block;
    }
</style>

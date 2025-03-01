<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
    import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
    import IconButton, { Icon } from "@smui/icon-button";
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
    import { base } from "../mylib/env.js";

    import type { Socket } from "socket.io-client";
    import { start } from "../mylib/socket.js";

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

    type ThreadInfo = {
        id: string;
        latest_res_at: Date;
        res_count: number;
        title: string;
        user_id: string;
        online: number;
        ikioi: number;
    };

    let threadList: Array<ThreadInfo> = $state([]);

    const main = async () => {
        const cursor = null;
        const size = 16;
        const desc = true;
        socket.emit("headline", { cursor, size, desc });
    };

    const handleHeadline = ({
        success,
        list,
    }: {
        success: boolean;
        list: Array<ThreadInfo>;
    }) => {
        if (success) {
            threadList = list;
        }
    };

    let socket: Socket;

    $effect(() => {
        socket = start();
        main();
        socket.on("headline", handleHeadline);
        return () => socket.off("headline", handleHeadline);
    });

    // TODO: 無視設定
    // TODO: ブックマーク設定
</script>

<HeaderPart title="ヘッドライン" />

<MainPart>
    <div class="unj-headline-accordion-container">
        <Accordion>
            {#each threadList as thread}
                <Panel>
                    <Header>
                        <div class="time-and-count-container">
                            <span class="res-time"
                                >{formatTimeAgo(thread.latest_res_at)}</span
                            >
                            <span class="res-count">{thread.res_count}レス</span
                            >
                        </div>
                        {#snippet description()}
                            <span class="thread-title">{thread.title}</span>
                        {/snippet}
                        {#snippet icon()}
                            <Icon
                                class="material-icons"
                                style={Math.random() > 0.8 ||
                                    "visibility:hidden"}>remove_red_eye</Icon
                            >
                        {/snippet}
                    </Header>
                    <Content style="text-align: center;">
                        <div>{thread.title}</div>
                        <DataTable
                            table$aria-label="People list"
                            style="max-width: 100%;"
                        >
                            <Head>
                                <Row>
                                    <Cell>スレ主ID</Cell>
                                    <Cell>接続</Cell>
                                    <Cell>勢い</Cell>
                                </Row>
                            </Head>
                            <Body>
                                <Row>
                                    <Cell>{thread.user_id}</Cell>
                                    <Cell numeric>{thread.online}</Cell>
                                    <Cell numeric>{thread.ikioi}</Cell>
                                </Row>
                            </Body>
                        </DataTable>
                        <span class="thread-detail-ui">
                            <IconButton class="material-icons"
                                >person_off</IconButton
                            >
                            <IconButton
                                class="material-icons"
                                onclick={() => {
                                    isAlreadyBookmark = !isAlreadyBookmark;
                                }}
                                >{isAlreadyBookmark
                                    ? "bookmark"
                                    : "bookmark_border"}</IconButton
                            >
                            <IconButton
                                class="material-icons"
                                onclick={() =>
                                    navigate(base(`/thread/${thread.id}`))}
                                >open_in_new</IconButton
                            >
                        </span>
                    </Content>
                </Panel>
            {/each}
        </Accordion>
    </div>
</MainPart>

<FooterPart />

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

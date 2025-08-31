<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { SearchIcon } from "@lucide/svelte";
    import Button from "@smui/button";
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
                limit: queryResultLimit,
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
            limit: queryResultLimit,
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
        <div class="text-left">
            <ul class="list-none p-0 m-0">
                {#each threadList as thread, i}
                    <li class="mb-4">
                        <div
                            class="rounded-lg border border-gray-300 shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out overflow-hidden"
                        >
                            {#if thread.title}
                                <div
                                    class="grid grid-cols-[theme(spacing.12)_1fr] sm:grid-cols-[theme(spacing.12)_1fr_theme(spacing.20)] gap-2 items-center p-3 text-gray-600"
                                >
                                    <div
                                        class="text-xs opacity-90 text-center w-12"
                                    >
                                        {formatTimeAgo(thread.latestResAt)}
                                    </div>

                                    <div
                                        class="flex items-start overflow-hidden break-words pr-2"
                                    >
                                        <div class="mr-2 flex-shrink-0">
                                            <TwemojiPart
                                                seed={thread.id}
                                                height="16"
                                            />
                                        </div>
                                        <div
                                            class="text-base font-semibold text-gray-800"
                                        >
                                            <Link
                                                to={makePathname(
                                                    `/thread/${thread.id}${thread.resCount > queryResultLimit && thread.latestCursor ? `/${thread.latestCursor}/1` : ""}`,
                                                )}
                                                class="hover:underline"
                                                >{thread.title}({thread.resCount})</Link
                                            >
                                        </div>
                                    </div>

                                    <div
                                        class="text-xs transition-all duration-200 ease-in text-center w-20 hidden sm:block
                                        {thread.online === 0
                                            ? 'opacity-60 font-normal'
                                            : ''}
                 {thread.online === 1
                                            ? 'opacity-90 text-blue-600 font-medium'
                                            : ''}
                 {thread.online === 2
                                            ? 'text-orange-600 font-semibold italic'
                                            : ''}
                 {thread.online >= 3
                                            ? 'text-red-600 font-bold italic underline'
                                            : ''}"
                                    >
                                        {thread.online}人閲覧中
                                    </div>
                                </div>
                            {/if}

                            {#if thread.latestRes}
                                <div
                                    class="relative px-4 py-2 bg-gray-400 border-t border-gray-400 text-gray-500 text-sm break-words overflow-hidden"
                                >
                                    {thread.latestRes}
                                </div>
                            {/if}
                        </div>

                        {#if i % 4 === 3 && i !== (threadList ?? []).length - 1}
                            <div class="border-t border-gray-300 mt-6"></div>
                        {/if}
                    </li>
                {/each}
            </ul>
            <center class="mt-8">
                <Button
                    onclick={cursorBasedPagination}
                    variant="raised"
                    disabled={emitting}
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
                    >続きを読む</Button
                >
            </center>
        </div>
    {/if}
</MainPart>

<FooterPart />

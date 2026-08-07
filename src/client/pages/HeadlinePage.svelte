<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Button from "@smui/button";
    import {
        differenceInDays,
        differenceInHours,
        differenceInMinutes,
        differenceInMonths,
        differenceInSeconds,
        differenceInWeeks,
        differenceInYears,
        isBefore,
    } from "date-fns";
    import { navigate } from "svelte-routing";
    import type { Board } from "../../common/request/board.js";
    import { queryResultLimit } from "../../common/request/schema.js";
    import type { HeadlineThread } from "../../common/response/schema.js";
    import { sleep } from "../../common/util.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { makeEmojiByThreadId } from "../mylib/emoji/thread-id.js";
    import { makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import type { ResHistory } from "../mylib/res-history.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import { nonceKey } from "../mylib/unj-storage.js";
    import TwemojiPart from "../parts/emoji/TwemojiPart.svelte";
    import FaviconPart from "../parts/emoji/FaviconPart.svelte";
    import KomePart from "../parts/KomePart.svelte";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";
    import NewsPart from "../parts/NewsPart.svelte";
    import HeadlinePart from "../parts/HeadlinePart.svelte";
    import CopyleftPart from "../parts/CopyleftPart.svelte";
    import {
        ChevronDownIcon,
        ChevronUpIcon,
        MessageCircleIcon,
    } from "@lucide/svelte";
    import { cubicOut } from "svelte/easing";
    import { scale } from "svelte/transition";
    import { scrollToEnd, scrollToTop } from "../mylib/scroll.js";

    let { board }: { board: Board } = $props();

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

    let threadList: HeadlineThread[] | undefined = $state();
    let cache: ObjectStorage<HeadlineThread[]>;
    $effect(() => {
        cache = new ObjectStorage<HeadlineThread[]>(
            `headlineCache###${board.id}`,
        );
        cache.get().then((v) => {
            if (v && !threadList) threadList = v;
        });
    });

    let resHistories: ResHistory[] | null = $state(null);
    const resHistoryCache = new ObjectStorage<ResHistory[]>("resHistoryCache");
    $effect(() => {
        resHistoryCache.get().then((v) => {
            if (v && !resHistories) {
                resHistories = v;
            } else {
                resHistories = [];
            }
        });
    });

    let ignoreList: Set<string> | null = $state(null);
    const ignoreListCache = new ObjectStorage<string[]>("ignoreListCache");
    $effect(() => {
        ignoreListCache.get().then((v) => {
            if (v && !ignoreList) {
                ignoreList = new Set(v);
            } else {
                ignoreList = new Set();
            }
        });
    });

    /**
     * 初回ロード or ページネーション
     */
    const handleHeadline = (data: { ok: boolean; list: HeadlineThread[] }) => {
        if (!data.ok) return;
        ok();
        if (!pagination && !isFromVisibilityChange) {
            threadList = data.list;
            for (const f of reactiveTasks) f();
            cache.set(threadList);
            // レス履歴の更新
            // 計算量は O(n + m)
            // n=32, m=32 の固定サイズなので、実際には最大 64 ステップしかかからない
            const map = new Map(
                data.list.slice(0, queryResultLimit).map((v) => [v.id, v]),
            );
            for (const resHistory of resHistories?.slice(0, queryResultLimit) ??
                []) {
                const next = map.get(resHistory.threadId);
                if (next && next.resCount > resHistory.resCount) {
                    resHistory.resCount = next.resCount;
                }
            }
            resHistoryCache.set(resHistories);
            isFromVisibilityChange = false;
        } else {
            if (threadList) {
                const existingIds = new Set(threadList.map((t) => t.id));
                const newThreads = data.list.filter(
                    (t) => !existingIds.has(t.id),
                );
                if (newThreads.length > 0) {
                    threadList = threadList.concat(newThreads);
                }
            }
            isFromVisibilityChange = false;
        }
    };

    /**
     * 新規スレッド or 新着レス
     */
    const handleNewHeadline = (data: { ok: boolean; new: HeadlineThread }) => {
        if (!data.ok || !threadList) return;
        if (threadList.length > 128) {
            threadList.pop();
        }
        threadList.unshift(data.new);
        const set = new Set();
        const sorted = threadList.filter((v) => {
            if (set.has(v.id)) return false;
            set.add(v.id);
            return true;
        });
        threadList = sorted;
        // TODO: レス履歴の更新
    };

    const reactiveTasks: (() => void)[] = [];

    const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
            isFromVisibilityChange = true;
            socket?.emit("joinHeadline", {
                boardId: board.id,
            });
            socket?.emit("headline", {
                boardId: board.id,
                nonce: genNonce(nonceKey.value ?? ""),
                limit: queryResultLimit,
                sinceDate: null,
                untilDate: null,
            });
        }
    };

    $effect(() => {
        hello(() => {
            socket?.emit("joinHeadline", {
                boardId: board.id,
            });
            socket?.emit("headline", {
                boardId: board.id,
                nonce: genNonce(nonceKey.value ?? ""),
                limit: queryResultLimit,
                sinceDate: null,
                untilDate: null,
            });
        });
        document.addEventListener("visibilitychange", handleVisibilityChange);
        socket?.on("joinHeadline", handleJoinHeadline);
        socket?.on("headline", handleHeadline);
        socket?.on("newHeadline", handleNewHeadline);
        return () => {
            goodbye();
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            socket?.off("joinHeadline", handleJoinHeadline);
            socket?.off("headline", handleHeadline);
            socket?.off("newHeadline", handleNewHeadline);
        };
    });

    $effect(() => {
        if (!board) return;
        pagination = false;
    });

    let pagination = $state(false);
    let isFromVisibilityChange = $state(false);
    let emitting = $state(false);
    const cursorBasedPagination = async () => {
        if (emitting) return;
        emitting = true;
        pagination = true;
        socket?.emit("headline", {
            boardId: board.id,
            nonce: genNonce(nonceKey.value ?? ""),
            limit: queryResultLimit,
            sinceDate: null,
            untilDate: threadList?.at(-1)?.latestResAt ?? null,
        });
        await sleep(1024);
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
    // おんJ同様デフォルトOFF（設定でON、ここではボタンタップでON）
    let showKome = $state(false);
</script>

<HeaderPart {board} title={board.name} {online} {pv} />

{#if showKome}
    <div
        class="unj-kome-float"
        transition:scale={{ duration: 200, easing: cubicOut, start: 0.85 }}
    >
        <KomePart {online} onClose={() => (showKome = false)} />
    </div>
{:else}
    <button
        class="unj-kome-fab"
        onclick={() => (showKome = true)}
        transition:scale={{ duration: 200, easing: cubicOut, start: 0.85 }}
    >
        <MessageCircleIcon size={20} />
    </button>
{/if}

<MainPart {board}>
    <div
        class={`${board.banner ? "" : "aspect-49/12"} w-[490px] max-w-full mx-auto border border-gray-500/40 flex items-center justify-center`}
    >
        {#if board.banner}
            <img
                src={board.banner}
                alt={`${board.name} バナー`}
                class="w-full h-full object-cover"
            />
        {:else}
            <span class="opacity-50 text-lg font-semibold"
                >バナーはまだぬい</span
            >
        {/if}
    </div>

    <div class="p-1 sm:p-2">
        <div class="text-left sm:mb-2">
            <h1
                class="opacity-40 text-base sm:text-2xl font-semibold leading-tight"
            >
                {board.name}
            </h1>
            <p class="text-xs leading-snug">
                {board.description}
            </p>
        </div>
        <!-- おんJの#headline(リアルタイム更新のヘッドラインティッカー)相当。ニュースより上に来る -->
        <HeadlinePart {board} />
        <div class="mt-2">
            <NewsPart {board} />
        </div>
    </div>

    {#if !threadList}
        <p>ヘッドライン取得中…</p>
        {#if laaaaaaaag}
            <MessageBoxPart
                title="まだ終わらない？"
                description={[
                    "サーバーが落ちてるかも。。",
                    "ページ更新してみてね。",
                ]}
            />
        {/if}
    {:else if threadList.length === 0}
        <p class="opacity-50 text-center py-10 text-lg">
            この板にまだスレッドが建てられてないみたい。。。
        </p>
    {:else}
        {@const isHeadlineLong = threadList.length > 8}
        {#if isHeadlineLong}
            <!-- 画面右端に上下スクロールボタンを固定配置 -->
            <div class="sticky top-1/2 -translate-y-1/2 ml-auto mr-2 w-fit z-8">
                <div class="h-0 w-0 relative" style="pointer-events: none;">
                    <div
                        class="absolute right-0 top-0 flex flex-col items-center gap-8"
                        style="transform: translateY(-50%); pointer-events: auto;"
                    >
                        <button
                            class="bg-gray-500/80 hover:bg-gray-500/40 text-white p-2 rounded-full shadow-lg transition"
                            onclick={() => scrollToTop()}
                        >
                            <ChevronUpIcon class="w-5 h-5" />
                        </button>
                        <button
                            class="bg-gray-500/80 hover:bg-gray-500/40 text-white p-2 rounded-full shadow-lg transition"
                            onclick={() => scrollToEnd()}
                        >
                            <ChevronDownIcon class="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        {/if}
        <div class="text-left w-full mx-auto unj-thread-ul-wrap">
            <ul class="list-none p-0 m-0">
                {#each threadList as thread}
                    {#if !ignoreList?.has(thread.ccUserId)}
                        {@const href = makePathname(
                            `/${board.key}/thread/${thread.id}/${thread.resCount > queryResultLimit ? thread.resCount - 8 : "2"}?top`,
                        )}
                        <li class="unj-thread-li">
                            <a
                                {href}
                                class="unj-thread-row block w-full text-left"
                                onclick={(e) => {
                                    if (e.button === 0) e.preventDefault();
                                    navigate(href);
                                }}
                            >
                                <div class="unj-thread-sub">
                                    <span class="mr-1 relative top-0.5 unj-thread-emoji">
                                        {#key thread.id}
                                            <span class="w-4 h-4 inline-block">
                                                <TwemojiPart
                                                    emoji={makeEmojiByThreadId(
                                                        thread.id,
                                                    )}
                                                />
                                            </span>
                                        {/key}
                                    </span>
                                    <span class="unj-thread-title-text"
                                        >{thread.title}</span
                                    >
                                    <span class="unj-res-bubble"
                                        >{thread.resCount}</span
                                    >
                                    <span class="unj-ninzu-wrap">
                                        <span class="unj-ninzu unj-ninzu-sec"
                                            >{formatTimeAgo(
                                                thread.latestResAt,
                                            )}</span
                                        >
                                        <span
                                            class="unj-ninzu unj-ninzu-nin"
                                            class:unj-iki-zero={thread.online ===
                                                0}
                                            class:unj-iki-normal={thread.online ===
                                                1}
                                            class:unj-iki-middle={thread.online ===
                                                2}
                                            class:unj-iki-high={thread.online >=
                                                3}
                                            >{thread.online}<span
                                                class="unj-nin-suffix">人</span
                                            ></span
                                        >
                                    </span>
                                </div>
                                {#if thread.latestRes}
                                    <div
                                        class="unj-thread-preview opacity-60 whitespace-nowrap overflow-hidden text-ellipsis"
                                    >
                                        {thread.latestRes}
                                    </div>
                                {/if}
                            </a>
                        </li>
                    {/if}
                {/each}
            </ul>
            {#if isHeadlineLong}
                <center class="mt-8">
                    <Button
                        onclick={cursorBasedPagination}
                        variant="raised"
                        disabled={emitting}
                        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md shadow-sm"
                        >続きを読む</Button
                    >
                </center>
            {/if}
        </div>

        {#if isHeadlineLong}
            <CopyleftPart />
        {/if}
    {/if}
</MainPart>

<FooterPart {board} />

<style>
    /* おんJの.threadsパネル相当。レンガ壁紙(body)の上に敷く不透明パネル */
    .unj-thread-ul-wrap {
        background: #efefef;
    }
    .unj-thread-li {
        border-bottom: 1px solid #ddd;
        background: #fff;
    }
    .unj-thread-row {
        display: block;
        padding: 8px;
        color: inherit;
        text-decoration: none;
    }
    .unj-thread-sub {
        font-size: 13px;
    }
    .unj-thread-emoji {
        display: inline-block;
    }
    .unj-thread-title-text {
        word-break: break-all;
    }
    /* レス数の吹き出し（おんJの.res-bubble） */
    .unj-res-bubble {
        display: inline-block;
        margin-left: 2px;
        font-size: 9px;
        padding: 2px 6px;
        border: 1px solid rgba(0, 0, 0, 0.3);
        background: #fff;
        color: rgba(0, 0, 50, 0.8);
        border-radius: 6px;
        white-space: nowrap;
    }
    .unj-ninzu-wrap {
        float: right;
        white-space: nowrap;
    }
    /* 経過時間・閲覧人数の丸角ピル（おんJの.ninzu） */
    .unj-ninzu {
        display: inline-block;
        font-size: 8px;
        color: #555;
        text-align: right;
        border: 1px solid #eee;
        border-radius: 2px;
        padding: 1px;
    }
    .unj-ninzu-nin {
        color: #444;
    }
    .unj-ninzu-nin.unj-iki-zero {
        background: #bababa;
    }
    .unj-ninzu-nin.unj-iki-normal {
        background: transparent;
    }
    .unj-ninzu-nin.unj-iki-middle {
        background: #ffffcc;
    }
    .unj-ninzu-nin.unj-iki-high {
        background: #ffbbbb;
    }
    .unj-nin-suffix {
        font-size: 5px;
    }
    .unj-thread-preview {
        font-size: 11px;
        margin-top: 2px;
        clear: both;
    }
</style>

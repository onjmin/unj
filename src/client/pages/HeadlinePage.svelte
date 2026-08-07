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

<MainPart {board} transparent={true}>
    <div class="px-2 pt-2 pb-1">
        <!-- バナー表示 (設定があれば画像、なければデフォルト表示) -->
        {#if board.banner}
            <div class="mb-2 max-w-full text-center bg-white border border-gray-300 p-1 rounded-md shadow-sm">
                <img src={board.banner} alt="板バナー" class="max-w-full h-auto inline-block rounded" />
            </div>
        {:else}
            <div class="relative bg-white border border-gray-300 rounded-md p-3 text-center shadow-sm max-w-full">
                <button class="absolute top-1 right-2 text-gray-400 hover:text-gray-600 font-bold text-sm">✖</button>
                <div class="flex items-center justify-center space-x-2">
                    <span class="text-3xl font-bold text-gray-700">o'ω'n</span>
                    <div>
                        <h1 class="text-xl font-bold tracking-tight text-orange-600">なんでも実況J</h1>
                        <p class="text-xs text-gray-500 font-medium">おーぷん2ch</p>
                    </div>
                </div>
            </div>
        {/if}

        <!-- 4連スクウェアツールバー -->
        <div class="flex items-center justify-between gap-1.5 my-2">
            <button
                onclick={() => scrollToTop()}
                class="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-bold py-1.5 px-2 border border-gray-300 rounded shadow-xs text-xs flex items-center justify-center"
                title="トップへ"
            >
                ▲
            </button>
            <button
                onclick={() => (showKome = !showKome)}
                class="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-bold py-1.5 px-2 border border-gray-300 rounded shadow-xs text-xs flex items-center justify-center"
                title="コメント表示"
            >
                💬
            </button>
            <button
                class="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-bold py-1.5 px-2 border border-gray-300 rounded shadow-xs text-xs flex items-center justify-center"
                title="一時停止"
            >
                ❚❚
            </button>
            <button
                onclick={() => navigate(makePathname(`/${board.key}/search`))}
                class="flex-1 bg-white hover:bg-gray-100 text-gray-700 font-bold py-1.5 px-2 border border-gray-300 rounded shadow-xs text-xs flex items-center justify-center"
                title="検索"
            >
                🔍
            </button>
        </div>

        <!-- ヘッドライン検索入力欄 -->
        <div class="mb-2">
            <input
                type="text"
                placeholder="ヘッドライン検索"
                bind:value={searchQuery}
                class="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-inner"
            />
        </div>

        <!-- ヘッドラインティッカー -->
        <HeadlinePart {board} />

        <!-- ニュースカード -->
        <NewsPart {board} />
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
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
    }
    .unj-thread-li {
        border-bottom: 1px solid #e5e7eb;
        background: #ffffff;
        transition: background-color 0.15s ease;
    }
    .unj-thread-li:hover, .unj-thread-li:active {
        background: #f8fafc;
    }
    .unj-thread-row {
        display: block;
        padding: 8px 10px;
        color: inherit;
        text-decoration: none;
    }
    .unj-thread-sub {
        font-size: 13.5px;
        line-height: 1.4;
    }
    .unj-thread-emoji {
        display: inline-block;
        vertical-align: middle;
    }
    .unj-thread-title-text {
        word-break: break-all;
        color: #0000ee;
        font-weight: 600;
    }
    /* レス数の吹き出し（おんJの.res-bubble） */
    .unj-res-bubble {
        display: inline-block;
        margin-left: 3px;
        font-size: 10px;
        font-weight: bold;
        padding: 1px 5px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        color: #0f172a;
        border-radius: 4px;
        white-space: nowrap;
        vertical-align: middle;
    }
    .unj-ninzu-wrap {
        float: right;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        line-height: 1;
    }
    /* 経過時間・閲覧人数の丸角ピル（おんJの.ninzu） */
    .unj-ninzu {
        display: inline-block;
        font-size: 9px;
        text-align: center;
        border-radius: 3px;
        padding: 1px 4px;
        line-height: 1.2;
    }
    .unj-ninzu-sec {
        color: #64748b;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
    }
    .unj-ninzu-nin {
        font-weight: bold;
        border: 1px solid #e2e8f0;
    }
    .unj-ninzu-nin.unj-iki-zero {
        background: #cbd5e1;
        color: #475569;
    }
    .unj-ninzu-nin.unj-iki-normal {
        background: #ffffff;
        color: #334155;
    }
    .unj-ninzu-nin.unj-iki-middle {
        background: #fef08a;
        color: #854d0e;
    }
    .unj-ninzu-nin.unj-iki-high {
        background: #fca5a5;
        color: #991b1b;
    }
    .unj-nin-suffix {
        font-size: 7px;
        margin-left: 1px;
    }
    .unj-thread-preview {
        font-size: 11.5px;
        color: #4b5563;
        margin-top: 3px;
        clear: both;
        padding-left: 2px;
    }
</style>

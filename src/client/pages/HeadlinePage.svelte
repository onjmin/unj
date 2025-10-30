<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { SearchIcon, XIcon } from "@lucide/svelte";
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
    import { Link } from "svelte-routing";
    import type { Board } from "../../common/request/board.js";
    import { queryResultLimit } from "../../common/request/schema.js";
    import type { HeadlineThread } from "../../common/response/schema.js";
    import { sleep } from "../../common/util.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { makePathname } from "../mylib/env.js";
    import {
        type Misskey,
        fetchMisskeyTimeline,
        findMisskey,
        misskeyList,
    } from "../mylib/misskey.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import { type ResHistory } from "../mylib/res-history.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import { nonceKey } from "../mylib/unj-storage.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import FaviconPart from "../parts/FaviconPart.svelte";
    import KomePart from "../parts/KomePart.svelte";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";
    import TwemojiPart from "../parts/TwemojiPart.svelte";

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

    let filteredThreadList: HeadlineThread[] | undefined = $state();
    const filterThreadList = () => {
        filteredThreadList = threadList?.filter((v) =>
            v.title.includes(searchQuery),
        );
    };

    /**
     * 初回ロード or ページネーション
     */
    const handleHeadline = (data: { ok: boolean; list: HeadlineThread[] }) => {
        if (!data.ok) return;
        ok();
        if (!pagination) {
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
        } else {
            if (threadList) threadList = threadList.concat(data.list);
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

    const fetchMisskey = (misskey: Misskey, misskeyBoard: Board) => {
        const { controller, promise } = fetchMisskeyTimeline(misskey.api);
        promise.then((timeline) => {
            if (!timeline.length) return;
            const [note] = timeline;
            registerReactiveHeadline({
                id: misskey.misskeyId,
                title: misskey.title,
                latestRes: note.text ?? "",
                latestResAt: new Date(note.createdAt),
                misskeyBoard,
            });
        });
        return () => controller.abort();
    };

    const reactiveTasks: (() => void)[] = [];

    /**
     * 任意のデータソースからヘッドライン形式のオブジェクトを生成し、
     * リストに即時挿入するとともに、リアクティブタスクとして登録します。
     */
    const registerReactiveHeadline = ({
        id,
        title,
        latestRes,
        latestResAt,
        misskeyBoard,
    }: {
        id: string;
        title: string;
        latestRes: string;
        latestResAt: Date;
        misskeyBoard: Board;
    }) => {
        const new1: HeadlineThread = {
            ccUserId: "",
            id,
            latestRes,
            latestResAt,
            resCount: 0,
            title,
            boardId: board.id,
            online: 0,
            ikioi: 0,
            lolCount: 0,
            goodCount: 0,
            badCount: 0,
        };
        const f = () => {
            if (!threadList) return;
            if (board !== misskeyBoard) return;
            if (threadList.find((v) => v.id === id)) return;
            const idx = threadList.findIndex((v) =>
                isBefore(v.latestResAt, new1.latestResAt),
            );
            if (idx === -1) {
                threadList.push(new1);
            } else {
                threadList.splice(idx, 0, new1);
            }
            threadList = [...threadList];
        };
        f();
        reactiveTasks.push(f);
    };

    $effect(() => {
        hello(() => {
            socket.emit("joinHeadline", {
                boardId: board.id,
            });
            socket.emit("headline", {
                boardId: board.id,
                nonce: genNonce(nonceKey.value ?? ""),
                limit: queryResultLimit,
                sinceDate: null,
                untilDate: null,
            });
        });
        socket.on("joinHeadline", handleJoinHeadline);
        socket.on("headline", handleHeadline);
        socket.on("newHeadline", handleNewHeadline);
        const aborts = misskeyList
            .get(board.key)
            ?.map((v) => fetchMisskey(v, board));
        return () => {
            goodbye();
            socket.off("joinHeadline", handleJoinHeadline);
            socket.off("headline", handleHeadline);
            socket.off("newHeadline", handleNewHeadline);
            aborts?.map((func) => func());
        };
    });

    let pagination = $state(false);
    let emitting = $state(false);
    const cursorBasedPagination = async () => {
        if (emitting) return;
        emitting = true;
        pagination = true;
        socket.emit("headline", {
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
</script>

<HeaderPart {board} title={board.name}>
    <AccessCounterPart {online} {pv} />
    <br />
    <KomePart {online} />
</HeaderPart>

<MainPart {board}>
    <div class="p-4 sm:p-6">
        <div
            class={`${board.banner ? "" : "aspect-[49/12]"} w-[490px] max-w-full mx-auto mb-4 border border-gray-100/10 flex items-center justify-center`}
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

        <div class="text-left mb-4">
            <h1 class="opacity-50 text-2xl sm:text-3xl font-bold mb-1">
                {board.name}
            </h1>
            <p class="text-sm">
                {board.description}
            </p>
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
        <div class="mb-3 flex items-center gap-2">
            <div class="relative w-full">
                <input
                    type="text"
                    placeholder="スレタイ検索"
                    bind:value={searchQuery}
                    onkeydown={(e) => e.key === "Enter" && filterThreadList()}
                    class="bg-gray-100/0 w-full rounded-md border border-gray-300 pl-8 pr-8 py-1 text-sm focus:border-blue-400 focus:ring focus:ring-blue-200 focus:outline-none"
                />
                <div
                    class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                >
                    <SearchIcon class="w-4 h-4" />
                </div>
                <button
                    onclick={() => {
                        searchQuery = "";
                        filteredThreadList = undefined;
                    }}
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 focus:outline-none transition-opacity duration-200"
                    class:opacity-0={!searchQuery}
                    class:pointer-events-none={!searchQuery}
                >
                    <XIcon class="w-4 h-4" />
                </button>
            </div>
            <button
                onclick={filterThreadList}
                class="min-w-[64px] rounded-md bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
            >
                検索
            </button>
        </div>

        {#if (filteredThreadList ?? threadList).length === 0}
            <div class="text-gray-500 p-4 text-center">
                <p>該当はありませんでした。</p>
                <p>キーワードを変えてみてね。</p>
                <p>
                    <Link to={makePathname(`/${board.key}/search`)}
                        >全文検索</Link
                    >でも試してちょ
                </p>
            </div>
        {:else}
            <div class="text-left w-full mx-auto">
                <ul class="list-none p-0 m-0">
                    {#each filteredThreadList ?? threadList as thread, i}
                        {#if !ignoreList?.has(thread.ccUserId)}
                            <li class="mb-2 last:mb-0">
                                <div
                                    tabindex="0"
                                    role="button"
                                    onkeydown={() => {}}
                                    class="border border-gray-100/10 hover:bg-gray-100/10 block w-full text-left p-3 transition-colors duration-150 ease-in-out cursor-pointer"
                                    onclick={() =>
                                        navigate(
                                            makePathname(
                                                findMisskey(
                                                    board.key,
                                                    thread.id,
                                                )
                                                    ? `/${board.key}/misskey/${findMisskey(board.key, thread.id)?.misskeyId}`
                                                    : `/${board.key}/thread/${thread.id}/${thread.resCount > queryResultLimit ? thread.resCount - 8 : ""}?top`,
                                            ),
                                        )}
                                >
                                    <div class="flex items-start">
                                        <div class="mr-2 flex-shrink-0">
                                            {#key thread.id}
                                                {#if findMisskey(board.key, thread.id)}
                                                    <FaviconPart
                                                        hostname={findMisskey(
                                                            board.key,
                                                            thread.id,
                                                        )?.hostname}
                                                    />
                                                {:else}
                                                    <TwemojiPart
                                                        seed={thread.id}
                                                    />
                                                {/if}
                                            {/key}
                                        </div>
                                        <div class="flex-grow min-w-0">
                                            <div
                                                class="flex items-start justify-between"
                                            >
                                                <div
                                                    class="flex-grow text-base font-medium leading-tight pr-2 break-words"
                                                >
                                                    <div
                                                        class="inline-flex items-baseline"
                                                    >
                                                        <span class="max-w-full"
                                                            >{thread.title}</span
                                                        >

                                                        <span
                                                            class="inline-block flex-shrink-0 ml-1"
                                                            >({thread.resCount})</span
                                                        >
                                                    </div>
                                                </div>
                                                <div
                                                    class="opacity-50 text-xs flex-shrink-0 ml-2 mt-0"
                                                >
                                                    {formatTimeAgo(
                                                        thread.latestResAt,
                                                    )}
                                                </div>
                                            </div>

                                            <div
                                                class="flex items-center text-xs mt-1"
                                            >
                                                {#if thread.latestRes}
                                                    <div
                                                        class="opacity-50 flex-grow text-sm whitespace-nowrap overflow-hidden pr-2"
                                                    >
                                                        <span class="truncate"
                                                            >{thread.latestRes}</span
                                                        >
                                                    </div>
                                                {/if}

                                                <div
                                                    class="transition-all duration-200 ease-in font-medium flex-shrink-0"
                                                    class:text-gray-500={thread.online ===
                                                        0}
                                                    class:text-blue-600={thread.online ===
                                                        1}
                                                    class:text-orange-600={thread.online ===
                                                        2}
                                                    class:text-red-600={thread.online >=
                                                        3}
                                                >
                                                    {thread.online}人閲覧中
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {#if i % 4 === 3 && i !== (filteredThreadList ?? threadList).length - 1}
                                    <hr class="opacity-10" />
                                {/if}
                            </li>
                        {/if}
                    {/each}
                </ul>
                <center class="mt-8">
                    <Button
                        onclick={cursorBasedPagination}
                        variant="raised"
                        disabled={emitting}
                        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md shadow-sm"
                        >続きを読む</Button
                    >
                </center>
            </div>
        {/if}
    {/if}
</MainPart>

<FooterPart />

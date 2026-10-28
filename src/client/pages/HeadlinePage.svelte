<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

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
    import KomePart from "../parts/KomePart.svelte";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";
    import NewsPart from "../parts/NewsPart.svelte";
    import CopyleftPart from "../parts/CopyleftPart.svelte";
    import { CopyIcon, MessageCircleIcon } from "@lucide/svelte";
    import { cubicOut } from "svelte/easing";
    import { scale } from "svelte/transition";
    import { threadTitleOf } from "../mylib/thread-title.js";

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


    // 専ブラ(2ch専用ブラウザ)配信は unj-reze 側が board_id=1（うんでも実況J）限定で実装している。
    // "unj"は板ID(src/common/request/board.ts参照)。 https://scrapbox.io/2chtypebbs/subject.txt
    const senburaSubjectUrl =
        "https://unj-reze.onjmin.workers.dev/unj/subject.txt";
    let senburaCopied = $state(false);
    const copySenburaUrl = async () => {
        await navigator.clipboard.writeText(senburaSubjectUrl);
        senburaCopied = true;
        setTimeout(() => {
            senburaCopied = false;
        }, 1500);
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
            pagination = false;
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
    let filteredThreadList = $derived(
        threadList?.filter((thread) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.trim().toLowerCase();
            const title = (
                thread.title ||
                thread.contentText ||
                ""
            ).toLowerCase();
            const latest = (thread.latestRes || "").toLowerCase();
            return title.includes(q) || latest.includes(q);
        }),
    );
    // 実況コメ欄。最初は閉じておき、ボタンで開く
    let showKome = $state(false);

    // 並び順。新着順はサーバーが返した順（最新レスの新しい順）、勢い順は勢いの高い順
    let sortMode: "new" | "ikioi" = $state("new");
    let sortedThreadList = $derived(
        sortMode === "ikioi"
            ? [...(filteredThreadList ?? [])].sort((a, b) => b.ikioi - a.ikioi)
            : (filteredThreadList ?? []),
    );
    // headline の ikioi は1時間あたりのレス数。2ch の勢いに合わせて1日あたりで出す
    const ikioiPerDay = (ikioi: number) => Math.round(ikioi * 24);

    // 自分が書き込んだスレの「書き込んでから付いたレス数」
    let postedResNum = $derived.by(() => {
        const map = new Map<string, number>();
        for (const h of resHistories ?? []) {
            const prev = map.get(h.threadId);
            if (prev === undefined || h.resNum > prev)
                map.set(h.threadId, h.resNum);
        }
        return map;
    });
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
        title="実況コメ"
        onclick={() => (showKome = true)}
        transition:scale={{ duration: 200, easing: cubicOut, start: 0.85 }}
    >
        <MessageCircleIcon size={20} />
    </button>
{/if}

<MainPart {board} transparent={true}>
    <section class="unj-board-head">
        {#if board.banner}
            <img src={board.banner} alt="" class="unj-board-banner" />
        {/if}
        <h2 class="unj-board-name">{board.name}</h2>
        <p class="unj-board-desc">{board.description}</p>
        {#if online > 0}
            <p class="unj-board-online">いま {online}人 が見てます</p>
        {/if}
    </section>

    <!-- 専ブラ導線 (board_id=1限定。unj-reze側の配信実装に対応するURL) -->
    {#if board.id === 1}
        <details class="unj-box unj-senbura">
            <summary>専ブラで読む（subject.txt に対応）</summary>
            <div class="unj-senbura-row">
                <code class="unj-senbura-url">{senburaSubjectUrl}</code>
                <button
                    class="unj-btn"
                    onclick={copySenburaUrl}
                    title="URLをコピー"
                >
                    <CopyIcon size={14} />
                    {senburaCopied ? "コピーした" : "コピー"}
                </button>
            </div>
        </details>
    {/if}

    <nav class="unj-menubar">
        <button
            onclick={() => navigate(makePathname(`/${board.key}/make-thread`))}
            >スレを立てる</button
        >
        <button
            class:unj-current={sortMode === "new"}
            onclick={() => (sortMode = "new")}>新着順</button
        >
        <button
            class:unj-current={sortMode === "ikioi"}
            onclick={() => (sortMode = "ikioi")}>勢い順</button
        >
        <button onclick={() => (showKome = !showKome)}>実況コメ</button>
        <button
            onclick={() => navigate(makePathname(`/${board.key}/search`))}
            >過去ログ検索</button
        >
    </nav>

    <div class="unj-board-filter">
        <input
            type="search"
            placeholder="スレタイ・最新レスで絞り込み"
            bind:value={searchQuery}
            class="unj-input w-full"
        />
    </div>

    {#if !threadList}
        <p class="unj-board-empty">スレ一覧を読み込み中…</p>
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
        <p class="unj-board-empty">
            この板にまだスレッドが建てられてないみたい。。。
        </p>
    {:else if sortedThreadList.length === 0}
        <p class="unj-board-empty">
            「{searchQuery.trim()}」に合うスレは見つからなかった。
        </p>
    {:else}
        <ol class="unj-subject">
            {#each sortedThreadList as thread, i (thread.id)}
                {#if !ignoreList?.has(thread.ccUserId)}
                    {@const href = makePathname(
                        `/${board.key}/thread/${thread.id}/${thread.resCount > queryResultLimit ? thread.resCount - 8 : "2"}?top`,
                    )}
                    {@const posted = postedResNum.get(thread.id)}
                    {@const newCount =
                        posted === undefined
                            ? 0
                            : Math.max(0, thread.resCount - posted)}
                    <li class="unj-subject-li">
                        <a
                            {href}
                            class="unj-subject-row"
                            onclick={(e) => {
                                if (e.button === 0) e.preventDefault();
                                navigate(href);
                            }}
                        >
                            <span class="unj-subject-num">{i + 1}:</span>
                            <span class="unj-subject-body">
                                <span class="unj-subject-title">
                                    {#key thread.id}
                                        <span class="unj-subject-emoji">
                                            <TwemojiPart
                                                emoji={makeEmojiByThreadId(
                                                    thread.id,
                                                )}
                                            />
                                        </span>
                                    {/key}
                                    {threadTitleOf(
                                        thread.title,
                                        thread.contentText,
                                    )}
                                    <span class="unj-subject-count"
                                        >({thread.resCount})</span
                                    >
                                    {#if newCount > 0}
                                        <span class="unj-subject-new"
                                            >新着{newCount}</span
                                        >
                                    {/if}
                                </span>
                                <span class="unj-subject-meta">
                                    <span
                                        >{formatTimeAgo(
                                            thread.latestResAt,
                                        )}前</span
                                    >
                                    <span>勢い{ikioiPerDay(thread.ikioi)}</span>
                                    {#if thread.online > 0}
                                        <span
                                            class="unj-subject-online"
                                            class:unj-hot={thread.online >= 3}
                                            >{thread.online}人</span
                                        >
                                    {/if}
                                </span>
                                {#if thread.latestRes}
                                    <span class="unj-subject-latest"
                                        >{thread.latestRes}</span
                                    >
                                {/if}
                            </span>
                        </a>
                    </li>
                {/if}
            {/each}
        </ol>
        {#if (threadList?.length ?? 0) > 8 && !searchQuery.trim()}
            <div class="unj-board-more">
                <button
                    class="unj-btn"
                    onclick={cursorBasedPagination}
                    disabled={emitting}>もっと前のスレを読む</button
                >
            </div>
        {/if}
    {/if}

    <div class="unj-board-news">
        <NewsPart {board} />
    </div>
    <CopyleftPart />
</MainPart>

<FooterPart {board} />

<style>
    .unj-board-head {
        text-align: center;
        padding: 14px 10px 10px;
        background: var(--unj-panel);
        border-bottom: 1px solid var(--unj-border);
    }
    .unj-board-banner {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 0 auto 8px;
    }
    .unj-board-name {
        margin: 0;
        font-size: 22px;
        font-weight: bold;
        color: var(--unj-title);
        letter-spacing: 0.04em;
    }
    .unj-board-desc {
        margin: 4px 0 0;
        font-size: 12.5px;
        color: var(--unj-text-sub);
    }
    .unj-board-online {
        margin: 6px 0 0;
        font-size: 12px;
        color: var(--unj-name);
        font-weight: bold;
    }
    .unj-senbura summary {
        cursor: pointer;
        font-size: 13px;
        color: var(--unj-text-sub);
    }
    .unj-senbura-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
    }
    .unj-senbura-url {
        flex: 1;
        min-width: 0;
        overflow-x: auto;
        white-space: nowrap;
        font-size: 12px;
        padding: 6px;
        background: var(--unj-panel-alt);
        border: 1px solid var(--unj-border-soft);
    }
    .unj-menubar :global(.unj-current) {
        color: var(--unj-text);
        font-weight: bold;
        text-decoration: none;
    }
    .unj-board-filter {
        padding: 8px;
    }
    .unj-board-empty {
        text-align: center;
        padding: 40px 10px;
        color: var(--unj-text-faint);
        font-size: 14px;
    }
    /* subject.txt 風のスレ一覧 */
    .unj-subject {
        list-style: none;
        margin: 0;
        padding: 0;
        text-align: left;
        background: var(--unj-panel);
        border-top: 1px solid var(--unj-border);
        border-bottom: 1px solid var(--unj-border);
    }
    .unj-subject-li + .unj-subject-li {
        border-top: 1px solid var(--unj-border-soft);
    }
    .unj-subject-row {
        display: flex;
        gap: 6px;
        padding: 9px 10px;
        text-decoration: none;
        color: var(--unj-text);
    }
    .unj-subject-row:hover {
        background: var(--unj-panel-alt);
    }
    .unj-subject-num {
        flex: none;
        min-width: 2.2em;
        text-align: right;
        font-size: 13px;
        color: var(--unj-text-faint);
        padding-top: 1px;
    }
    .unj-subject-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .unj-subject-title {
        font-size: 15px;
        line-height: 1.45;
        color: var(--unj-link);
        word-break: break-all;
    }
    .unj-subject-row:visited .unj-subject-title {
        color: var(--unj-link-visited);
    }
    .unj-subject-emoji {
        display: inline-block;
        width: 1em;
        height: 1em;
        vertical-align: -0.12em;
        margin-right: 2px;
    }
    .unj-subject-count {
        color: var(--unj-text-sub);
        font-size: 13px;
    }
    .unj-subject-new {
        display: inline-block;
        margin-left: 4px;
        font-size: 11px;
        font-weight: bold;
        color: var(--unj-new);
    }
    .unj-subject-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0 10px;
        font-size: 11.5px;
        color: var(--unj-text-faint);
    }
    .unj-subject-online {
        color: var(--unj-name);
        font-weight: bold;
    }
    .unj-subject-online.unj-hot {
        color: var(--unj-new);
    }
    .unj-subject-latest {
        font-size: 12px;
        color: var(--unj-text-sub);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .unj-board-more {
        text-align: center;
        padding: 14px 0 6px;
    }
    .unj-board-news {
        padding: 0 8px;
    }
</style>

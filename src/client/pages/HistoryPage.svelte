<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { Link } from "svelte-routing";
    import {
        type Board,
        boardIdMap,
        unjBoard,
    } from "../../common/request/board.js";
    import { makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import { type ResHistory } from "../mylib/res-history.js";

    // boardに加えて、すべての板の情報であるboardsを受け取るように変更
    let { board }: { board: Board } = $props();

    let resHistories: ResHistory[] | null = $state(null);
    const resHistoryCache = new ObjectStorage<ResHistory[]>("resHistoryCache");
    $effect(() => {
        resHistoryCache.get().then((v) => {
            if (v && !resHistories) {
                const set = new Set();
                const formatted = v
                    .filter((v) => {
                        // 重複排除
                        if (set.has(v.threadId)) return false;
                        set.add(v.threadId);
                        return true;
                    })
                    .map((v) => {
                        // 後方互換
                        if ((v.boardId ?? -1) === -1) {
                            v.boardId = unjBoard.id;
                        }
                        return v;
                    });
                resHistories = formatted;
                resHistoryCache.set(resHistories);
            } else {
                resHistories = [];
            }
        });
    });

    // boardIdごとにグルーピングし、現在のboardを最上位にする
    type GroupedHistory = {
        boardId: number;
        histories: ResHistory[];
        isCurrent: boolean;
        boardName: string; // 板名を追加
    };

    // 💡 修正点: 派生ロジックを外部関数として切り出し、型を明確にする
    const groupAndSortHistories = (
        histories: ResHistory[] | null,
        currentBoard: Board,
        boardMap: Map<number, Board>,
    ): GroupedHistory[] => {
        if (!histories || histories.length === 0) return [];

        // 1. boardIdでグルーピング
        const groups = histories.reduce((acc, history) => {
            const id = history.boardId;
            if (!acc.has(id)) {
                acc.set(id, []);
            }
            acc.get(id)?.push(history);
            return acc;
        }, new Map<number, ResHistory[]>());

        // 2. グループを配列に変換
        const groupArray: GroupedHistory[] = Array.from(groups.entries()).map(
            ([boardId, groupedHistories]) => ({
                boardId,
                histories: groupedHistories,
                isCurrent: boardId === currentBoard.id,
                // 板名を取得。見つからない場合はフォールバック
                boardName:
                    boardMap.get(boardId)?.name ??
                    `Board ID: ${boardId} (不明)`,
            }),
        );

        // 3. ソート: 現在のboardIdを持つグループを最上位にする
        groupArray.sort((a, b) => {
            if (a.isCurrent && !b.isCurrent) return -1; // a (current) を前に
            if (!a.isCurrent && b.isCurrent) return 1; // b (current) を前に
            return 0; // その他の場合は順序維持
        });

        return groupArray;
    };

    // 💡 修正点: $derivedには外部関数の呼び出しを渡す
    const groupedHistories: GroupedHistory[] = $derived(
        groupAndSortHistories(resHistories, board, boardIdMap),
    );
</script>

<HeaderPart {board} title="レス履歴">
    <button
        class="text-xs text-red-500 font-medium px-2 py-1 rounded-full border border-red-500 hover:bg-gray-100/10"
        onclick={() => {
            if (confirm("本当に履歴を全て削除してもよろしいですか？")) {
                resHistories = [];
                resHistoryCache.set([]);
                alert("削除しました");
            }
        }}
    >
        履歴全件削除
    </button>
</HeaderPart>

<MainPart {board}>
    <div class="max-w-2xl mx-auto p-4 space-y-4 text-left">
        {#if !resHistories || resHistories.length === 0}
            <div class="text-center p-4 rounded-lg">
                <p class="text-lg mb-2">
                    データがありましぇん。ご新規さんかな？
                </p>
                <p class="text-sm text-gray-500">
                    なんかついでに<Link
                        to={makePathname(`/${board.key}/new`)}
                        class="font-medium text-blue-500 hover:underline"
                        >投稿</Link
                    >したり「あとで読む」をしてみてね。
                </p>
            </div>
        {:else}
            {#each groupedHistories as group (group.boardId)}
                <div
                    class="border border-gray-100/10 rounded-lg shadow-sm p-3 space-y-2"
                >
                    <h2
                        class="text-lg font-bold pb-1 border-b"
                        class:text-green-600={group.isCurrent}
                        class:border-green-600={group.isCurrent}
                        class:border-gray-200={!group.isCurrent}
                    >
                        {group.boardName}
                        {#if group.isCurrent}
                            <span class="text-sm font-normal text-gray-500 ml-2"
                                >(現在の板)</span
                            >
                        {/if}
                    </h2>

                    {#each group.histories as resHistory (resHistory.threadId)}
                        {@const newResponses =
                            resHistory.resCount - resHistory.resNum}
                        <Link
                            to={makePathname(
                                // board.keyの代わりに、resHistory.boardIdからboard.keyを取得する必要がある
                                `/${boardIdMap.get(resHistory.boardId)?.key ?? board.key}/thread/${resHistory.threadId}/${resHistory.resNum}`,
                            )}
                            class="block p-2 rounded hover:bg-gray-100/20 transition border-b border-gray-100/10 last:border-b-0"
                        >
                            <div class="flex items-center space-x-2">
                                <div class="flex-shrink-0">
                                    {#if newResponses > 0}
                                        <span class="text-red-500 font-bold"
                                            >+{newResponses}</span
                                        >
                                    {:else}
                                        <span class="text-gray-500">+0</span>
                                    {/if}
                                </div>
                                <div class="flex-grow min-w-0">
                                    <div class="flex items-center space-x-1">
                                        <span
                                            class="font-medium text-sm truncate"
                                            >{resHistory.title}</span
                                        >
                                        <span
                                            class="text-xs text-gray-500 whitespace-nowrap"
                                            >({resHistory.resCount})</span
                                        >
                                    </div>
                                    <p
                                        class="text-xs text-gray-500 mt-1 truncate"
                                    >
                                        {resHistory.latestRes}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    {/each}
                </div>
            {/each}
        {/if}
    </div>
</MainPart>

<FooterPart />

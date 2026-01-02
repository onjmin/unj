<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { CopyIcon, Trash2Icon } from "@lucide/svelte";
    import { Toast, createToaster } from "@skeletonlabs/skeleton-svelte";
    import { Link } from "svelte-routing";
    import {
        type Board,
        boardIdMap,
        unjBoard,
    } from "../../common/request/board.js";
    import oekakiWhitelist from "../../common/request/whitelist/oekaki.js";
    import { findIn } from "../../common/request/whitelist/site-info.js";
    import {
        type UploadResponse,
        deleteCloudflareR2,
        uploadHistory,
    } from "../mylib/cloudflare-r2.js";
    import { makePathname } from "../mylib/env.js";
    import {
        type ImgurResponse,
        deleteImgur,
        imgurHistory,
    } from "../mylib/imgur.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import { type ResHistory } from "../mylib/res-history.js";
    import ImagePreviewModal from "../parts/ImagePreviewPart.svelte";
    import PaginationControls from "../parts/PaginationControls.svelte";

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

    const groupedHistories: GroupedHistory[] = $derived(
        groupAndSortHistories(resHistories, board, boardIdMap),
    );

    const toaster = createToaster();
    let open = $state(false);
    let src = $state("");

    let uploadList: UploadResponse[] = $state([]);
    $effect(() => {
        uploadHistory.get().then((v) => {
            uploadList = v ? v : [];
        });
    });

    let imgurList: ImgurResponse[] = $state([]);
    $effect(() => {
        imgurHistory.get().then((v) => {
            imgurList = v ? v : [];
        });
    });

    const deleteOekaki = (obj: ImgurResponse) => {
        const url = (() => {
            try {
                return new URL(obj.link);
            } catch (err) {}
        })();
        const siteInfo = url ? findIn(oekakiWhitelist, url.hostname) : null;
        switch (siteInfo?.id) {
            case 102401:
                return deleteImgur(obj.deletehash);
            case 102402:
                return deleteCloudflareR2(obj.id, obj.deletehash);
        }
    };
</script>

<HeaderPart {board} title="履歴">
    <button
        class="text-xs text-red-500 font-medium px-2 py-1 rounded-full border border-red-500 hover:bg-gray-500/10"
        onclick={() => {
            if (confirm("本当にレス履歴を全て削除してもよろしいですか？")) {
                resHistories = [];
                resHistoryCache.set([]);
                alert("削除しました");
            }
        }}
    >
        レス履歴全件削除
    </button>
</HeaderPart>

<MainPart {board}>
    <div class="max-w-2xl mx-auto p-4 space-y-4 text-left">
        <div class="border border-gray-500/40 p-4 rounded-lg space-y-4">
            <h2 class="text-gray-500 text-xl font-bold border-b pb-2">
                レス履歴
            </h2>
            {#if !resHistories || resHistories.length === 0}
                <div class="text-center p-4 rounded-lg">
                    <p class="text-lg mb-2">
                        データがありましぇん。ご新規さんかな？
                    </p>
                    <p class="text-sm">
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
                        class="border border-gray-500/40 rounded-lg shadow-sm p-3 space-y-2"
                    >
                        <h3
                            class="text-lg font-bold pb-1 border-b"
                            class:text-green-600={group.isCurrent}
                            class:border-green-600={group.isCurrent}
                            class:border-gray-500={!group.isCurrent}
                        >
                            {group.boardName}
                            {#if group.isCurrent}
                                <span class="text-sm font-normal ml-2"
                                    >(現在の板)</span
                                >
                            {/if}
                        </h3>

                        <PaginationControls list={group.histories}>
                            {#snippet children(resHistory: ResHistory)}
                                {@const newResponses =
                                    resHistory.resCount - resHistory.resNum}
                                <Link
                                    to={makePathname(
                                        // board.keyの代わりに、resHistory.boardIdからboard.keyを取得する必要がある
                                        `/${boardIdMap.get(resHistory.boardId)?.key ?? board.key}/thread/${resHistory.threadId}/${resHistory.resNum}`,
                                    )}
                                    class="block p-2 rounded hover:bg-gray-500/20 transition border-b border-gray-500/40 last:border-b-0"
                                >
                                    <div class="flex items-center space-x-2">
                                        <div class="shrink-0">
                                            {#if newResponses > 0}
                                                <span
                                                    class="text-red-500 font-bold"
                                                    >+{newResponses}</span
                                                >
                                            {:else}
                                                <span class="text-gray-500"
                                                    >+0</span
                                                >
                                            {/if}
                                        </div>
                                        <div class="grow min-w-0">
                                            <div
                                                class="flex items-center space-x-1"
                                            >
                                                <span class="truncate"
                                                    >{resHistory.title}</span
                                                >
                                                <span class="whitespace-nowrap"
                                                    >({resHistory.resCount})</span
                                                >
                                            </div>
                                            <p
                                                class="text-gray-500 text-sm mt-1 truncate"
                                            >
                                                {resHistory.latestRes}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            {/snippet}
                        </PaginationControls>
                    </div>
                {/each}
            {/if}
        </div>
        <div class="border border-gray-500/40 p-4 rounded-lg space-y-4">
            <h2 class="text-gray-500 text-xl font-bold border-b pb-2">
                画像履歴
            </h2>
            <div class="p-4">
                {#if !uploadList.length}
                    <div class="opacity-50 text-center space-y-2">
                        <div>NO DATA...</div>
                        <div>いまんとこ画像履歴は空っぽみたい。。</div>
                        <div>画像うｐしてから出直してね。</div>
                    </div>
                {:else}
                    <PaginationControls list={uploadList}>
                        {#snippet children(uploadResponse: UploadResponse)}
                            <div
                                class="flex items-center py-2 border-b last:border-b-0 border-gray-500/40"
                            >
                                <div
                                    tabindex="0"
                                    role="button"
                                    onkeydown={() => {}}
                                    onclick={() => {
                                        src = uploadResponse.link;
                                        open = true;
                                    }}
                                    class="w-12 h-12 shrink-0 rounded-full bg-no-repeat bg-cover bg-center"
                                    style="background-image: url({uploadResponse.link});"
                                ></div>
                                <div class="flex-1 ml-4 overflow-hidden">
                                    <div class="font-bold truncate">
                                        {uploadResponse.delete_id}
                                    </div>
                                    <div class="opacity-50 text-sm truncate">
                                        {uploadResponse.link}
                                    </div>
                                </div>
                                <div class="flex shrink-0 space-x-2 ml-4">
                                    <button
                                        class="p-2 rounded-full hover:text-gray-500"
                                        onclick={async () => {
                                            await navigator.clipboard.writeText(
                                                uploadResponse.link,
                                            );
                                            toaster.create({
                                                title: "コピーしました",
                                            });
                                        }}
                                    >
                                        <CopyIcon class="h-6 w-6" />
                                    </button>
                                    <button
                                        class="p-2 rounded-full hover:text-gray-500"
                                        onclick={async () => {
                                            if (
                                                !confirm(
                                                    `ID:${uploadResponse.delete_id}を削除しますか？`,
                                                )
                                            )
                                                return;
                                            try {
                                                await deleteCloudflareR2(
                                                    uploadResponse.delete_id,
                                                    uploadResponse.delete_hash,
                                                );
                                            } catch (err) {
                                                alert(
                                                    `ID:${uploadResponse.delete_id}の削除に失敗しました`,
                                                );
                                                return;
                                            }
                                            uploadList = uploadList.filter(
                                                (v) =>
                                                    v.delete_id !==
                                                    uploadResponse.delete_id,
                                            );
                                            uploadHistory.set(uploadList);
                                        }}
                                    >
                                        <Trash2Icon class="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        {/snippet}
                    </PaginationControls>
                {/if}
            </div>
        </div>
        <div class="border border-gray-500/40 p-4 rounded-lg space-y-4">
            <h2 class="text-gray-500 text-xl font-bold border-b pb-2">
                お絵描き履歴
            </h2>
            <div class="p-4">
                {#if !imgurList.length}
                    <div class="opacity-50 text-center space-y-2">
                        <div>NO DATA...</div>
                        <div>いまんとこお絵描き履歴は空っぽみたい。。</div>
                        <div>お絵描きうｐしてから出直してね。</div>
                    </div>
                {:else}
                    <PaginationControls list={imgurList}>
                        {#snippet children(imgurResponse: ImgurResponse)}
                            <div
                                class="flex items-center py-2 border-b last:border-b-0 border-gray-500/40"
                            >
                                <div
                                    tabindex="0"
                                    role="button"
                                    onkeydown={() => {}}
                                    onclick={() => {
                                        src = imgurResponse.link;
                                        open = true;
                                    }}
                                    class="w-12 h-12 shrink-0 rounded-full bg-no-repeat bg-cover bg-center"
                                    style="background-image: url({imgurResponse.link});"
                                ></div>
                                <div class="flex-1 ml-4 overflow-hidden">
                                    <div class="font-bold truncate">
                                        {imgurResponse.id}
                                    </div>
                                    <div class="opacity-50 text-sm truncate">
                                        {imgurResponse.link}
                                    </div>
                                </div>
                                <div class="flex shrink-0 space-x-2 ml-4">
                                    <button
                                        class="p-2 rounded-full hover:text-gray-500"
                                        onclick={async () => {
                                            await navigator.clipboard.writeText(
                                                imgurResponse.link,
                                            );
                                            toaster.create({
                                                title: "コピーしました",
                                            });
                                        }}
                                    >
                                        <CopyIcon class="h-6 w-6" />
                                    </button>
                                    <button
                                        class="p-2 rounded-full hover:text-gray-500"
                                        onclick={async () => {
                                            if (
                                                !confirm(
                                                    `ID:${imgurResponse.id}を削除しますか？`,
                                                )
                                            )
                                                return;
                                            try {
                                                await deleteOekaki(
                                                    imgurResponse,
                                                );
                                            } catch (err) {
                                                alert(
                                                    `ID:${imgurResponse.id}の削除に失敗しました`,
                                                );
                                                return;
                                            }
                                            imgurList = imgurList.filter(
                                                (v) =>
                                                    v.id !== imgurResponse.id,
                                            );
                                            imgurHistory.set(imgurList);
                                        }}
                                    >
                                        <Trash2Icon class="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        {/snippet}
                    </PaginationControls>
                {/if}
            </div>
        </div>
    </div>
</MainPart>

<FooterPart {board} />

<ImagePreviewModal bind:open bind:src />

<Toast.Group {toaster}>
    {#snippet children(toast)}
        <Toast {toast}>
            <Toast.Message>
                <Toast.Title>{toast.title}</Toast.Title>
                <Toast.Description>{toast.description}</Toast.Description>
            </Toast.Message>
            <Toast.CloseTrigger />
        </Toast>
    {/snippet}
</Toast.Group>

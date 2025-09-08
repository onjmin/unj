<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { Link } from "svelte-routing";
    import { makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import { type ResHistory } from "../mylib/res-history.js";

    let resHistories: ResHistory[] | null = $state(null);
    const resHistoryCache = new ObjectStorage<ResHistory[]>("resHistoryCache");
    $effect(() => {
        resHistoryCache.get().then((v) => {
            if (v && !resHistories) {
                const set = new Set();
                const sorted = v.filter((v) => {
                    if (set.has(v.threadId)) return false;
                    set.add(v.threadId);
                    return true;
                });
                resHistories = sorted;
                resHistoryCache.set(resHistories);
            } else {
                resHistories = [];
            }
        });
    });
</script>

<HeaderPart title="レス履歴">
    <button
        class="text-xs text-red-500 font-medium px-2 py-1 rounded-full border border-red-500 hover:bg-red-50"
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

<MainPart>
    <div class="max-w-2xl mx-auto p-4 space-y-2 text-left">
        {#if !resHistories?.length}
            <div class="text-center p-4">
                <p class="text-lg text-gray-600 mb-2">
                    データがありましぇん。ご新規さんかな？
                </p>
                <p class="text-sm text-gray-500">
                    なんか適当に<Link
                        to={makePathname("/new")}
                        class="font-medium text-gray-900">投稿</Link
                    >したり「あとで読む」をしてみてね。
                </p>
            </div>
        {:else}
            {#each resHistories as resHistory}
                {@const newResponses = resHistory.resCount - resHistory.resNum}
                <Link
                    to={makePathname(
                        `/thread/${resHistory.threadId}/${resHistory.resNum}`,
                    )}
                    class="block p-2 bg-white rounded hover:bg-gray-50 transition"
                >
                    <div class="flex items-center space-x-2">
                        <div class="flex-shrink-0">
                            {#if newResponses > 0}
                                <span class="text-red-500 font-bold"
                                    >+{newResponses}</span
                                >
                            {:else}
                                <span class="text-gray-400">+0</span>
                            {/if}
                        </div>
                        <div class="flex-grow min-w-0">
                            <div class="flex items-center space-x-1">
                                <span
                                    class="font-medium text-gray-900 text-sm truncate"
                                    >{resHistory.title}</span
                                >
                                <span
                                    class="text-xs text-gray-500 whitespace-nowrap"
                                    >({resHistory.resCount})</span
                                >
                            </div>
                            <p class="text-xs text-gray-500 mt-1 truncate">
                                {resHistory.latestRes}
                            </p>
                        </div>
                    </div>
                </Link>
            {/each}
        {/if}
    </div>
</MainPart>

<FooterPart />

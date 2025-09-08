<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { format } from "date-fns";
    import { ja } from "date-fns/locale";
    import { Link } from "svelte-routing";
    import { type History } from "../mylib/history.js"; // モックデータ

    const histories: History[] = [
        {
            ccUserId: "user1",
            contentText: "塩コショウだけで十分…",
            contentUrl: "",
            resNum: 5,
            createdAt: new Date("2025-08-24T10:00:00Z"),
            threadId: "1",
            title: "野菜炒めのレシピ",
            resCount: 8, // 新着あり
        },
        {
            ccUserId: "user2",
            contentText: "",
            contentUrl: "https://example.com/some/link",
            resNum: 10,
            createdAt: new Date("2025-08-23T15:30:00Z"),
            threadId: "2",
            title: "SvelteKit で Tailwind",
            resCount: 10, // 新着なし
        },
        {
            ccUserId: "user3",
            contentText: "zenresモードの実装例",
            contentUrl: "",
            resNum: 2,
            createdAt: new Date("2025-08-23T08:45:00Z"),
            threadId: "3",
            title: "Discord ボット作成",
            resCount: 15, // 新着あり
        },
        {
            ccUserId: "user4",
            contentText: "別の日の投稿です",
            contentUrl: "",
            resNum: 1,
            createdAt: new Date("2025-08-22T12:00:00Z"),
            threadId: "4",
            title: "別の日のスレッド",
            resCount: 5,
        },
    ];

    const makePathname = (threadId: string): string => {
        return `/thread/${threadId}`;
    };
    let lastDisplayedDate = "";
</script>

<HeaderPart title="レス履歴" />

<MainPart>
    <div class="max-w-2xl mx-auto p-4 space-y-2 text-left">
        {#if histories.length > 0}
            {#each histories as history}
                {@const formattedDate = format(
                    history.createdAt,
                    "yy/MM/dd(EEE)",
                    { locale: ja },
                )}
                {#if formattedDate !== lastDisplayedDate}
                    <h2 class="text-xs text-gray-400 mt-4 mb-1">
                        {formattedDate}
                    </h2>
                    {@const _ = lastDisplayedDate = formattedDate}
                {/if}

                {@const newResponses = history.resCount - history.resNum}
                <div
                    class="p-2 bg-white rounded hover:bg-gray-50 transition text-sm grid grid-cols-[auto_1fr] gap-x-2"
                >
                    <div class="flex-shrink-0">
                        {#if newResponses > 0}
                            <span class="text-red-500 font-bold"
                                >+{newResponses}</span
                            >
                        {:else}
                            <span class="text-gray-400">+0</span>
                        {/if}
                    </div>
                    <div class="flex-grow">
                        <div>
                            <Link
                                to={makePathname(history.threadId)}
                                class="font-medium text-gray-900"
                            >
                                {history.title}
                            </Link>
                            ({history.resCount})
                        </div>
                        <p class="text-xs text-gray-500 mt-1 truncate">
                            {history.contentText || history.contentUrl}
                        </p>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="text-center p-4">
                <p class="text-lg text-gray-600 mb-2">
                    データがありましぇん。ご新規さんかな？
                </p>
                <p class="text-sm text-gray-500">
                    なんか適当に投稿したり「あとで読む」をしてみてね。
                </p>
            </div>
        {/if}
    </div>
</MainPart>

<FooterPart />

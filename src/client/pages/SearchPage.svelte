<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { SearchIcon } from "@lucide/svelte";
    import { format } from "date-fns";
    import { ja } from "date-fns/locale";
    import { type SearchResult } from "../../common/response/schema.js";

    // 検索クエリの状態管理
    let contentText = $state("");
    let loading = $state(false);
    let searchResults: SearchResult[] = $state([]);
    let currentQuery: string | null = $state(null);

    // 検索処理を行う関数
    const handleSearch = async () => {
        if (!contentText.trim() || contentText.trim().length < 2) {
            return;
        }

        loading = true;
        searchResults = [];
        currentQuery = contentText.trim();

        const query = {
            contentText: currentQuery,
        };

        console.log("検索クエリ:", query);

        // ダミーデータで代用
        await new Promise((r) => setTimeout(r, 1000));
        searchResults = [
            {
                ccUserId: "aQms",
                contentText: "テスト投稿のダミーデータです。",
                contentUrl: "",
                resNum: 224,
                createdAt: new Date("2025-09-07T15:11:00Z"),
                resId: "res_abcde123",
                threadId: "thread_fghij456",
                title: "テスト用スレッド(857)",
                resCount: 857,
            },
            {
                ccUserId: "x1kM",
                contentText: "てすや",
                contentUrl: "http://example.com/link",
                resNum: 176,
                createdAt: new Date("2025-09-07T15:11:00Z"),
                resId: "res_klmno789",
                threadId: "thread_fghij456",
                title: "テスト用スレッド(857)",
                resCount: 857,
            },
            {
                ccUserId: "7fFo",
                contentText: "てすや",
                contentUrl: "",
                resNum: 56,
                createdAt: new Date("2025-09-07T15:11:00Z"),
                resId: "res_pqrst012",
                threadId: "thread_fghij456",
                title: "テスト用スレッド(857)",
                resCount: 857,
            },
            {
                ccUserId: "RT20",
                contentText: "てすや",
                contentUrl: "",
                resNum: 98,
                createdAt: new Date("2025-09-07T11:12:00Z"),
                resId: "res_uvwxy345",
                threadId: "thread_zabcd678",
                title: "忍法帖レベル上げスレ(482)",
                resCount: 482,
            },
            {
                ccUserId: "8ohZ",
                contentText: "おまたせしましたすごい奴",
                contentUrl: "",
                resNum: 3,
                createdAt: new Date("2025-09-03T01:20:00Z"),
                resId: "res_efghi901",
                threadId: "thread_jklmn234",
                title: "三大頭悪い歌詞｢おまたせしましたすごい奴｣｢今日から一番一番だ｣(13)",
                resCount: 13,
            },
        ];
        loading = false;
    };

    const getFormattedText = (text: string, url: string, query: string) => {
        const fullText = url ? `${text}${url}` : text;
        if (!query || query.length < 2) return fullText;

        const regex = new RegExp(`(${query})`, "gi");
        return fullText.replace(
            regex,
            '<span class="bg-yellow-200 font-semibold">$1</span>',
        );
    };
</script>

<HeaderPart title="全文検索" />

<MainPart>
    <div class="container mx-auto p-4 max-w-2xl">
        <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center gap-2">
                <label for="contentText" class="sr-only">全文検索</label>
                <div class="relative flex-grow">
                    <div
                        class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                    >
                        <SearchIcon class="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                        id="contentText"
                        type="text"
                        bind:value={contentText}
                        class="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="全文検索"
                        onkeydown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
                <button
                    type="submit"
                    class="min-w-[70px] py-2 px-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading || contentText.trim().length < 2}
                    onclick={handleSearch}
                >
                    {#if loading}
                        <div class="flex items-center justify-center">
                            <svg
                                class="animate-spin h-5 w-5 mr-3 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            <span class="sr-only">検索中...</span>
                        </div>
                    {:else}
                        <span>検索</span>
                    {/if}
                </button>
            </div>
        </div>

        <div class="mt-8">
            <h3 class="text-xl font-bold mb-4">検索結果</h3>

            {#if loading}
                <p class="text-center text-gray-500">検索中...</p>
            {:else if searchResults.length === 0 && currentQuery}
                <p class="text-center text-gray-500">
                    該当する投稿は見つかりませんでした。
                </p>
            {:else if searchResults.length > 0}
                <ul class="space-y-4">
                    {#each searchResults as result}
                        <li class="bg-white p-4 rounded-lg shadow-md">
                            <!-- スレッドタイトルとレス数を表示 -->
                            <h4
                                class="text-lg font-bold text-gray-900 text-left"
                            >
                                {result.title}
                            </h4>
                            <!-- レス番号、ID、投稿内容を表示 -->
                            <div class="flex flex-col mt-2 text-left">
                                <div class="text-sm text-gray-800">
                                    <span class="font-bold text-blue-600 mr-1">
                                        {result.resNum}.ID:{result.ccUserId}
                                    </span>
                                    <span
                                        class="text-gray-800"
                                        tabindex="0"
                                        role="button"
                                        onkeydown={() => {}}
                                        onclick={() =>
                                            window.open(
                                                `https://example.com/thread/${result.threadId}#${result.resNum}`,
                                                "_blank",
                                            )}
                                    >
                                        {@html getFormattedText(
                                            result.contentText,
                                            result.contentUrl,
                                            currentQuery || "",
                                        )}
                                    </span>
                                </div>
                            </div>
                            <!-- 投稿日時と掲示板情報を表示 -->
                            <div
                                class="mt-1 text-sm text-gray-500 flex justify-between"
                            >
                                <span>なんでも実況J</span>
                                <span
                                    >{format(
                                        result.createdAt,
                                        "yyyy/MM/dd HH:mm",
                                        { locale: ja },
                                    )}</span
                                >
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</MainPart>

<FooterPart />

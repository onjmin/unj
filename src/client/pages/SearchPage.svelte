<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { SearchIcon } from "@lucide/svelte";

    // 検索クエリの状態管理
    let contentText = $state("");
    let loading = $state(false);
    let searchResults: any[] = $state([]);

    // 検索処理を行う関数
    async function handleSearch() {
        loading = true;
        searchResults = [];

        // 空文字のクエリを除外
        const query = {
            ...(contentText && { contentText }),
        };

        console.log("検索クエリ:", query);

        // TODO: ここに実際のAPI呼び出し処理を実装
        // 例:
        // try {
        //   const response = await fetch('/api/search', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(query)
        //   });
        //   if (response.ok) {
        //     searchResults = await response.json();
        //   }
        // } catch (error) {
        //   console.error("検索エラー:", error);
        // } finally {
        //   loading = false;
        // }

        // ダミーデータで代用
        await new Promise((r) => setTimeout(r, 1000));
        searchResults = [
            {
                id: 1,
                ccUserId: "user123",
                ccUserName: "名無しさん",
                ccUserAvatar: 1,
                contentText: "テスト投稿",
                contentUrl: "http://example.com/1",
                contentType: 1,
            },
            {
                id: 2,
                ccUserId: "guest456",
                ccUserName: "ゲスト",
                ccUserAvatar: 2,
                contentText: "検索機能のテストです",
                contentUrl: "",
                contentType: 1,
            },
        ];
        loading = false;
    }
</script>

<HeaderPart title="全文検索" />

<MainPart>
    <div class="container mx-auto p-4 max-w-2xl">
        <div class="bg-white p-6 rounded-lg shadow-md">
            <form onsubmit={handleSearch} class="flex items-center gap-2">
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
                    />
                </div>
                <button
                    type="submit"
                    class="min-w-[70px] py-2 px-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading}
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
            </form>
        </div>

        <div class="mt-8">
            <h3 class="text-xl font-bold mb-4">検索結果</h3>

            {#if loading}
                <p class="text-center text-gray-500">検索中...</p>
            {:else if searchResults.length === 0}
                <p class="text-center text-gray-500">
                    該当する投稿は見つかりませんでした。
                </p>
            {:else}
                <ul class="space-y-4">
                    {#each searchResults as result}
                        <li class="bg-white p-4 rounded-lg shadow-md">
                            <div class="text-sm text-gray-500">
                                <span>ID: {result.ccUserId}</span> |
                                <span>名前: {result.ccUserName}</span>
                            </div>
                            <p class="mt-2 text-gray-800">
                                {result.contentText}
                            </p>
                            {#if result.contentUrl}
                                <a
                                    href={result.contentUrl}
                                    class="text-blue-600 hover:underline mt-2 inline-block break-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {result.contentUrl}
                                </a>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</MainPart>

<FooterPart />

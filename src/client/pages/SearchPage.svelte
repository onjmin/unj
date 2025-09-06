<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { SearchIcon, UserIcon } from "@lucide/svelte";

    // 検索クエリの状態管理
    let ccUserId = $state("");
    let contentText = $state("");
    let loading = $state(false);
    let searchResults: any[] = $state([]);

    // 検索処理を行う関数
    async function handleSearch() {
        loading = true;
        searchResults = [];

        // 空文字のクエリを除外
        const query = {
            ...(ccUserId && { ccUserId }),
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

<HeaderPart title="検索" />

<MainPart>
    <div class="container mx-auto p-4 max-w-2xl">
        <h2 class="text-2xl font-bold mb-4">本文検索</h2>

        <div class="bg-white p-6 rounded-lg shadow-md space-y-4">
            <form
                onsubmit={handleSearch}
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <div>
                    <label
                        for="ccUserId"
                        class="flex items-center gap-2 mb-1 text-gray-600"
                    >
                        <UserIcon class="w-4 h-4" />
                        <span>ID検索</span>
                    </label>
                    <input
                        id="ccUserId"
                        type="text"
                        bind:value={ccUserId}
                        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ユーザーID"
                        maxlength="16"
                    />
                </div>

                <div class="md:col-span-2">
                    <label
                        for="contentText"
                        class="flex items-center gap-2 mb-1 text-gray-600"
                    >
                        <SearchIcon class="w-4 h-4" />
                        <span>本文検索</span>
                    </label>
                    <input
                        id="contentText"
                        type="text"
                        bind:value={contentText}
                        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="本文"
                    />
                </div>

                <div class="md:col-span-2 mt-4">
                    <button
                        type="submit"
                        class="w-full py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                                <span>検索中...</span>
                            </div>
                        {:else}
                            <span>検索</span>
                        {/if}
                    </button>
                </div>
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

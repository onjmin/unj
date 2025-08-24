<script lang="ts">
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";

    // モックデータ（閲覧したスレ）
    const threads = [
        {
            id: 1,
            title: "野菜炒めのレシピ",
            date: "2025-08-24",
            snippet: "塩コショウだけで十分…",
            url: "/thread/1",
        },
        {
            id: 2,
            title: "SvelteKit で Tailwind",
            date: "2025-08-23",
            snippet: "Vite + Tailwind の設定方法",
            url: "/thread/2",
        },
        {
            id: 3,
            title: "Discord ボット作成",
            date: "2025-08-22",
            snippet: "zenresモードの実装例",
            url: "/thread/3",
        },
    ];
</script>

<HeaderPart title="閲覧履歴" />

<MainPart>
    <div class="max-w-2xl mx-auto p-4 space-y-1">
        {#each threads as thread}
            <a
                href={thread.url}
                class="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
                <span
                    class="font-medium text-gray-900 dark:text-gray-100 truncate"
                >
                    {thread.title}
                </span>
                <span
                    class="ml-2 text-xs text-gray-400 dark:text-gray-300 flex-shrink-0"
                >
                    {thread.date}
                </span>
            </a>
        {/each}
    </div>
</MainPart>

<FooterPart />

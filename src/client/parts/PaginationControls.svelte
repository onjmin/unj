<script lang="ts">
    let { children, list = [] } = $props();

    const itemsPerPage: number = 4; // 1ページあたりの表示枚数
    let currentPage = $state(1);
    let totalPages = $derived(Math.ceil(list.length / itemsPerPage));
    const paginatedList = $derived(
        list.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage,
        ),
    );
</script>

{#if totalPages > 1}
    <div class="flex justify-center items-center mt-4 space-x-2 text-sm">
        <button
            onclick={() => (currentPage = 1)}
            disabled={currentPage === 1}
            class="px-3 py-1 rounded-md bg-gray-500/10 hover:bg-gray-500/20 disabled:opacity-50 transition-colors"
        >
            最初へ
        </button>
        <button
            onclick={() => currentPage--}
            disabled={currentPage === 1}
            class="px-3 py-1 rounded-md bg-gray-500/10 hover:bg-gray-500/20 disabled:opacity-50 transition-colors"
        >
            前へ
        </button>
        <span>{currentPage} / {totalPages}</span>
        <button
            onclick={() => currentPage++}
            disabled={currentPage === totalPages}
            class="px-3 py-1 rounded-md bg-gray-500/10 hover:bg-gray-500/20 disabled:opacity-50 transition-colors"
        >
            次へ
        </button>
        <button
            onclick={() => (currentPage = totalPages)}
            disabled={currentPage === totalPages}
            class="px-3 py-1 rounded-md bg-gray-500/10 hover:bg-gray-500/20 disabled:opacity-50 transition-colors"
        >
            最後へ
        </button>
    </div>
{/if}
<div class={`text-left space-y-4 ${totalPages > 1 ? "min-h-80" : ""}`}>
    {#each paginatedList as v}
        {@render children?.(v)}
    {/each}
</div>

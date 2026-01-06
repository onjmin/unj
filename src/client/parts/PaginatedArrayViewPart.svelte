<script lang="ts">
    import PaginationControlsPart from "./PaginationControlsPart.svelte";

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
    <PaginationControlsPart
        {currentPage}
        {totalPages}
        firstDisabled={currentPage === 1}
        prevDisabled={currentPage === 1}
        nextDisabled={currentPage === totalPages}
        lastDisabled={currentPage === totalPages}
        onClickFirst={() => (currentPage = 1)}
        onClickPrev={() => currentPage--}
        onClickNext={() => currentPage++}
        onClickLast={() => (currentPage = totalPages)}
    />
{/if}
<div class={`text-left space-y-4 ${totalPages > 1 ? "min-h-80" : ""}`}>
    {#each paginatedList as v}
        {@render children?.(v)}
    {/each}
</div>

<script lang="ts">
    let {
        currentPage,
        totalPages,

        onFirst,
        onPrev,
        onNext,
        onLast,

        firstDisabled,
        prevDisabled,
        nextDisabled,
        lastDisabled,
    } = $props();

    const handleFirst = () => {
        if (firstDisabled) return;
        onFirst?.();
    };

    const handlePrev = () => {
        if (prevDisabled) return;
        onPrev?.();
    };

    const handleNext = () => {
        if (nextDisabled) return;
        onNext?.();
    };

    const handleLast = () => {
        if (lastDisabled) return;
        onLast?.();
    };
</script>

<div
    class="flex justify-center items-center mt-4 mb-4 space-x-2 text-sm disabled:opacity-40"
>
    <button
        onclick={handleFirst}
        disabled={firstDisabled}
        class="border border-gray-500/40 px-3 py-1 rounded-md transition-colors"
    >
        最初へ
    </button>

    <button
        onclick={handlePrev}
        disabled={prevDisabled}
        class="border border-gray-500/40 px-3 py-1 rounded-md transition-colors"
    >
        前へ
    </button>

    <span>{currentPage} / {totalPages}</span>

    <button
        onclick={handleNext}
        disabled={nextDisabled}
        class="border border-gray-500/40 px-3 py-1 rounded-md transition-colors"
    >
        次へ
    </button>

    <button
        onclick={handleLast}
        disabled={lastDisabled}
        class="border border-gray-500/40 px-3 py-1 rounded-md transition-colors"
    >
        最後へ
    </button>
</div>

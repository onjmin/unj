<script lang="ts">
    let {
        currentPage,
        totalPages,

        firstDisabled,
        prevDisabled,
        nextDisabled,
        lastDisabled,

        onClickFirst,
        onClickPrev,
        onClickNext,
        onClickLast,
    }: {
        currentPage: number;
        totalPages: number;

        firstDisabled: boolean;
        prevDisabled: boolean;
        nextDisabled: boolean;
        lastDisabled: boolean;

        onClickFirst: () => void;
        onClickPrev: () => void;
        onClickNext: () => void;
        onClickLast: () => void;
    } = $props();

    const handleFirst = () => {
        if (firstDisabled) return;
        onClickFirst();
    };

    const handlePrev = () => {
        if (prevDisabled) return;
        onClickPrev();
    };

    const handleNext = () => {
        if (nextDisabled) return;
        onClickNext();
    };

    const handleLast = () => {
        if (lastDisabled) return;
        onClickLast();
    };
</script>

<div class="flex justify-center items-center mt-4 mb-4 space-x-2 text-sm">
    <button
        class="border border-gray-500/60 px-3 py-1 rounded-md transition-colors disabled:opacity-40"
        disabled={firstDisabled}
        onclick={handleFirst}
    >
        最初へ
    </button>

    <button
        class="border border-gray-500/60 px-3 py-1 rounded-md transition-colors disabled:opacity-40"
        disabled={prevDisabled}
        onclick={handlePrev}
    >
        前へ
    </button>

    <span>{currentPage} / {totalPages}</span>

    <button
        class="border border-gray-500/60 px-3 py-1 rounded-md transition-colors disabled:opacity-40"
        disabled={nextDisabled}
        onclick={handleNext}
    >
        次へ
    </button>

    <button
        class="border border-gray-500/60 px-3 py-1 rounded-md transition-colors disabled:opacity-40"
        disabled={lastDisabled}
        onclick={handleLast}
    >
        最後へ
    </button>
</div>

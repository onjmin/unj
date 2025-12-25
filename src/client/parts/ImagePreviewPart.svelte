<script lang="ts">
    let { open = $bindable(false), src = $bindable("") } = $props();

    const closeModal = () => {
        open = false;
        src = "";
    };
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onclick={closeModal}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        }}
        tabindex="0"
        role="dialog"
        aria-label="Close enlarged image"
    >
        <div class="absolute inset-0 bg-gray-100/10 transition-opacity"></div>

        <div
            class="relative z-10 flex items-center justify-center w-full h-full pointer-events-none"
        >
            <img
                {src}
                alt="拡大画像"
                class="max-w-full max-h-[80vh] w-auto h-auto object-contain select-none shadow-xl pointer-events-auto"
            />
        </div>
    </div>
{/if}

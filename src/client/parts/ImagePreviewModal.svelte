<script lang="ts">
    let { open = $bindable(false), src = $bindable("") } = $props();

    const closeModal = () => {
        open = false;
        src = "";
    };
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        onclick={closeModal}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        }}
        tabindex="0"
        role="button"
        aria-label="Close enlarged image"
    >
        <div class="absolute inset-0 bg-black opacity-50"></div>

        <div class="relative max-w-full max-h-full z-10">
            <img
                {src}
                alt="拡大画像"
                class="max-w-full max-h-full select-none"
            />
        </div>
    </div>
{/if}

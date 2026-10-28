<script lang="ts">
    let {
        open = $bindable(false),
        src = $bindable(""),
        // ドット絵（歩行グラのシートを含む）。小さくても画面に合わせて整数倍に拡大し、にじませない
        pixelated = false,
    }: { open?: boolean; src?: string; pixelated?: boolean } = $props();

    const closeModal = () => {
        open = false;
        src = "";
    };

    let natural = $state<{ w: number; h: number } | null>(null);
    $effect(() => {
        src;
        natural = null;
    });
    let scaledStyle = $derived.by(() => {
        if (!pixelated || !natural) return "";
        const maxW = window.innerWidth * 0.9;
        const maxH = window.innerHeight * 0.8;
        const scale = Math.floor(
            Math.min(maxW / natural.w, maxH / natural.h),
        );
        if (scale < 2) return "image-rendering:pixelated;";
        return `image-rendering:pixelated; width:${natural.w * scale}px; height:${natural.h * scale}px;`;
    });
</script>

{#if open}
    <!-- 下のメニュー(z-index:64)・右下の丸ボタン(90)より上に出す -->
    <div
        class="unj-image-preview fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm"
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
                style={scaledStyle}
                onload={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    natural = { w: img.naturalWidth, h: img.naturalHeight };
                }}
            />
        </div>
    </div>
{/if}

<style>
    .unj-image-preview {
        z-index: 200;
    }
</style>

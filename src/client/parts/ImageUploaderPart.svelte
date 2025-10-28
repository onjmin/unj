<script lang="ts">
    import { RotateCwIcon, UploadIcon, XIcon } from "@lucide/svelte";

    let {
        fileName = $bindable(""),
        previewUrl = $bindable(""),
        contentUrl = $bindable(""),
        menu = false,
    } = $props();

    let fileInput: HTMLInputElement;

    // 受け付けるMIMEタイプ
    const ACCEPTED_TYPES = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ];
    const acceptString = ACCEPTED_TYPES.join(", ");

    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (files && files.length > 0) {
            const file = files[0];

            // MIMEタイプをチェック
            if (!ACCEPTED_TYPES.includes(file.type)) {
                console.error(
                    `拒否されたファイル: ${file.name} (不正なタイプ: ${file.type})`,
                );
                fileName = "";
                previewUrl = "";
                contentUrl = "";
                if (fileInput) fileInput.value = "";
                return;
            }

            fileName = file.name;
            previewUrl = URL.createObjectURL(file);
            contentUrl = previewUrl;
        } else {
            fileName = "";
            previewUrl = "";
            contentUrl = "";
        }
    }

    // ファイル入力ダイアログを開く関数
    function openFileDialog() {
        fileInput.click();
    }

    // ファイル削除（クリア）関数
    function clearSelectedFile(event: MouseEvent) {
        event.stopPropagation();
        URL.revokeObjectURL(previewUrl);
        fileName = "";
        previewUrl = "";
        contentUrl = "";
        fileInput.value = "";
    }

    $effect(() => {
        if (!menu) openFileDialog();
        return () => URL.revokeObjectURL(previewUrl);
    });
</script>

<input
    type="file"
    bind:this={fileInput}
    onchange={handleFileChange}
    class="hidden"
    multiple={false}
    accept={acceptString}
/>

<div class="w-full max-w-sm aspect-video mx-auto">
    {#if !previewUrl}
        <button
            onclick={openFileDialog}
            class="flex flex-col items-center justify-center w-full h-full p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            aria-label="画像を選択 (クリックしてファイルを選択)"
        >
            <UploadIcon class="w-8 h-8 text-gray-500 mb-2" />
            <p class="text-sm font-semibold text-gray-700">画像を選択</p>
            <p class="text-xs text-gray-400 mt-1">クリックして選択</p>
        </button>
    {:else}
        <div
            class="relative w-full h-full rounded-lg shadow-lg border-2 border-green-500 overflow-hidden group"
        >
            <div class="w-full h-full">
                <img
                    src={previewUrl}
                    alt="プレビュー画像"
                    class="w-full h-full object-contain bg-gray-100 opacity-80"
                />
            </div>

            <div class="absolute inset-0 flex flex-col justify-between p-3">
                <div class="flex justify-between items-start">
                    <span
                        class="text-sm font-medium truncate max-w-[80%] text-white bg-black/50 px-2 py-1 rounded"
                        >{fileName}</span
                    >

                    <button
                        onclick={clearSelectedFile}
                        class="p-0.5 bg-red-600 rounded-full shadow-lg text-white transform transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-70 flex-shrink-0"
                        aria-label="画像を削除"
                        title="画像を削除"
                    >
                        <XIcon class="w-5 h-5" fill="white" />
                    </button>
                </div>

                <div class="flex justify-center">
                    <button
                        onclick={openFileDialog}
                        class="flex items-center space-x-2 px-3 py-1 bg-blue-600 rounded-lg shadow-lg text-white font-semibold transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-70"
                        aria-label="別の画像を選択"
                        title="別の画像を選択"
                    >
                        <RotateCwIcon class="w-4 h-4" />
                        <span class="text-sm">再選択</span>
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

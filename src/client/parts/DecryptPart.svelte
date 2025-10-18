<script lang="ts">
    import { Key } from "@lucide/svelte";
    import { Enum } from "../../common/request/content-schema.js";
    import { decrypt } from "../mylib/aes-gcm.js";

    let { contentText = $bindable(""), contentType = $bindable(0) } = $props();

    let passwordInput: string = $state("");
    let isLoading: boolean = $state(false);
    let isError: boolean = $state(false);

    const ICON_SIZE = 18;

    const handleDecrypt = async () => {
        if (!contentText) {
            isError = true;
            return;
        }

        isLoading = true;
        isError = false;

        try {
            const decryptedText = await decrypt(contentText, passwordInput);
            contentText = decryptedText;
            contentType = Enum.Text;
            passwordInput = "";
        } catch (error) {
            console.error(
                "Decryption failed. Please check the password.",
                error,
            );
            isError = true;
        } finally {
            isLoading = false;
        }
    };
</script>

<div class="p-2 w-full max-w-lg mr-auto bg-gray-50 rounded-lg shadow-inner">
    <div class="flex items-center space-x-2">
        <div class="flex-1 relative">
            <div
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none"
            >
                <Key size={ICON_SIZE} />
            </div>

            <input
                type="text"
                bind:value={passwordInput}
                onkeydown={(e) => {
                    if (e.key === "Enter") handleDecrypt();
                }}
                class:bg-red-100={isError}
                class:border-red-500={isError}
                class:border-gray-300={!isError}
                class="w-full border rounded-md py-2 pl-10 pr-3 text-sm focus:ring-indigo-500
                focus:border-indigo-500 shadow-sm transition-colors"
                placeholder="パスワード"
                disabled={isLoading}
            />
        </div>

        <button
            onclick={handleDecrypt}
            disabled={isLoading || !contentText}
            class="py-2 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white transition-colors
                    bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
            {#if isLoading}
                復号中...
            {:else}
                復号
            {/if}
        </button>
    </div>

    {#if !contentText}
        <p class="mt-2 text-xs text-red-500">暗号化されていません。</p>
    {/if}
</div>

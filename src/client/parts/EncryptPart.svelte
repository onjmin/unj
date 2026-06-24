<script lang="ts">
    import { Key } from "@lucide/svelte";

    let {
        plaintext = $bindable(""),
        password = $bindable(""),
    }: { plaintext: string; password: string } = $props();

    const ICON_SIZE = 20;
</script>

<div class="flex flex-col gap-2 w-full">
    <div class="text-xs text-gray-500">※暗号化する内容（投稿後はパスワード所持者のみ閲覧可）</div>
    <textarea
        bind:value={plaintext}
        placeholder="暗号化するメッセージを入力"
        rows={3}
        maxlength={1024}
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100/0 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        autocomplete="off"
    ></textarea>

    <div class="relative w-full max-w-sm">
        <div
            class="flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500"
        >
            <div class="p-2.5 bg-gray-500/10 rounded-l-lg">
                <Key size={ICON_SIZE} />
            </div>
            <input
                id="password"
                name="password"
                type="text"
                bind:value={password}
                placeholder="暗号化に使うパスワードを入力"
                class="flex-1 min-w-0 py-2.5 px-3 text-sm bg-gray-100/0 focus:outline-none border-none"
                autocomplete="off"
            />
        </div>
    </div>
</div>

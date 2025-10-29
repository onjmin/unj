<script lang="ts">
    import { Key } from "@lucide/svelte";

    // 親コンポーネントから渡されるパスワード値
    let { password = $bindable("") } = $props();

    // Tailwindでのアイコンのサイズ
    const ICON_SIZE = 20;

    // input要素のtype属性を常に 'text' に固定
    const inputType = "text";
</script>

<div class="relative w-full max-w-sm">
    <div
        class="flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500"
    >
        <div class="p-2.5 bg-gray-100/10 rounded-l-lg">
            <Key size={ICON_SIZE} />
        </div>

        <input
            id="password"
            name="password"
            type={inputType}
            bind:value={password}
            placeholder="暗号化に使うパスワードを入力"
            class="flex-1 min-w-0 py-2.5 px-3 text-sm bg-gray-100/0 focus:outline-none border-none"
            autocomplete="off"
        />
    </div>
</div>

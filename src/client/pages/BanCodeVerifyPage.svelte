<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Button, { Label } from "@smui/button";
    import Dialog, { Title, Actions, Content } from "@smui/dialog";
    import { navigate } from "svelte-routing";
    import { sleep } from "../../common/util.js";
    import { genBanVerifyCode } from "../mylib/anti-debug.js";
    import { makePathname } from "../mylib/env.js";
    import {
        banReason,
        banReport,
        banStatus,
        banVerifyCode,
        ipInfoJson,
    } from "../mylib/unj-storage.js";

    const handleSubmit = async () => {
        loading = true;
        await sleep((2783 + 114514 / 334 ** Math.random()) & (9800 + 3777));
        if (
            banVerifyCodeInput.trim() ===
            genBanVerifyCode(banVerifyCode.value ?? "")
        ) {
            banStatus.value = null;
            banReason.value = null;
            ipInfoJson.value = null;
            banVerifyCode.value = null;
            banReport.value = null;
            navigate(makePathname("/"), { replace: true });
        } else {
            open = true;
        }
        loading = false;
    };

    let loading = $state(false);
    let open = $state(false);
    let banVerifyCodeInput = $state("");
    let bannedDate = $state(new Date());
    let checkboxChecked = $state(false);
</script>

<HeaderPart menu={false} title="BAN解除コード入力画面" />

<MainPart menu={false}>
    <p class="mb-2 text-center text-gray-700">
        この画面から解除コードが入力できます😃
    </p>
    <p class="mb-6 text-center text-gray-500 text-sm">
        総当たりしても無駄ですよ🤭
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col">
            <label for="banned-date" class="mb-1 font-semibold text-gray-700"
                >BAN日時の入力</label
            >
            <input
                id="banned-date"
                type="date"
                placeholder="BANされた日付"
                bind:value={bannedDate}
                class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <div class="flex flex-col md:col-span-2">
            <label for="ban-code" class="mb-1 font-semibold text-gray-700"
                >BAN解除コード</label
            >
            <input
                id="ban-code"
                type="text"
                placeholder="BAN解除コード"
                bind:value={banVerifyCodeInput}
                class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <div class="flex items-center md:col-span-2">
            <input
                id="oath-checkbox"
                type="checkbox"
                bind:checked={checkboxChecked}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="oath-checkbox" class="ml-2 text-gray-700"
                >宣誓、もう荒らしません</label
            >
        </div>
    </div>

    <div class="mt-6 text-center">
        <button
            onclick={handleSubmit}
            disabled={loading}
            class={`
        px-6 py-2 rounded-md font-bold text-white transition-colors
        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"}
      `}
        >
            送信
        </button>
    </div>
</MainPart>

<FooterPart menu={false} />

<!-- ここから固有のUI -->

<Dialog
    bind:open
    aria-labelledby="verify-failed-title"
    aria-describedby="verify-failed-content"
>
    <Title id="verify-failed-title">BAN解除に失敗しました</Title>
    <Content id="verify-failed-content">時間を置いて再度お試しください</Content>
    <Actions>
        <Button>
            <Label>OK</Label>
        </Button>
    </Actions>
</Dialog>

{#if loading}
    <div
        class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-[128]"
    >
        <svg
            class="h-8 w-8 animate-spin text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
            ></circle>
            <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
        </svg>
    </div>
{/if}

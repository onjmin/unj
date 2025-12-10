<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { Mail, Search, Wrench } from "@lucide/svelte";
    import { Toast, createToaster } from "@skeletonlabs/skeleton-svelte";
    import { addHours, differenceInHours, format } from "date-fns";
    import { ja } from "date-fns/locale";
    import * as v from "valibot";
    import type { Board } from "../../common/request/board.js";
    import { contactedAt } from "../mylib/unj-storage.js";
    import {
        contactAGPL3,
        contactKaizen,
        contactPolice,
    } from "../mylib/webhook.js";
    import AGPL3Part from "../parts/contact/AGPL3Part.svelte";
    import KaizenPart from "../parts/contact/KaizenPart.svelte";
    import PolicePart from "../parts/contact/PolicePart.svelte";

    let { board }: { board: Board } = $props();

    const toaster = createToaster();

    let AGPL3PartInstance: AGPL3Part | null = $state(null);
    let KaizenPartInstance: KaizenPart | null = $state(null);
    let PolicePartInstance: PolicePart | null = $state(null);

    const contactTypes = [
        {
            icon: Wrench,
            label: "改善要望",
        },
        {
            icon: Mail,
            label: "AGPL3",
        },
        {
            icon: Search,
            label: "開示請求",
        },
    ];
    let active = $state(contactTypes[0]);

    let replyEmail = $state("");
    let fill = $state(false);
    let deadline = $state("");
    const deadlineOptions = [
        "長（いつでもいいよ）",
        "中（今週中に）",
        "短（即日対応希望）",
    ];
    let showDeadlineOptions = $state(false);

    let enabledSubmit = $state(false);
    $effect(() => {
        enabledSubmit = replyEmail !== "" && fill && !!deadline && !isSuspend;
    });

    const handleSubmit = async () => {
        if (isSuspend) {
            toaster.warning({
                title: "受付停止中です。",
            });
            return;
        }
        const emailSchema = v.pipe(v.string(), v.email());
        if (!v.safeParse(emailSchema, replyEmail).success) {
            toaster.warning({
                title: "不正なメールアドレスです。",
            });
            return;
        }
        const header = [`納期：${deadline}`, `メアド：${replyEmail}`];
        let success = false;
        try {
            switch (active.label) {
                case "改善要望":
                    if (KaizenPartInstance !== null) {
                        const input = KaizenPartInstance.getInputArray();
                        await contactKaizen([...header, ...input]);
                        success = true;
                    }
                    break;
                case "AGPL3":
                    if (AGPL3PartInstance !== null) {
                        const input = AGPL3PartInstance.getInputArray();
                        await contactAGPL3([...header, ...input]);
                        success = true;
                    }
                    break;
                case "開示請求":
                    if (PolicePartInstance !== null) {
                        const input = PolicePartInstance.getInputArray();
                        await contactPolice([...header, ...input]);
                        success = true;
                    }
                    break;
            }
        } catch (err) {}
        if (success) {
            contactedAt.value = `${+new Date()}`;
            isSuspend = true;
            toaster.success({
                title: "送信しました。",
            });
        } else {
            toaster.error({
                title: "送信に失敗しました。",
            });
        }
    };

    let isSuspend = $state(true);
    let resumeDate = $state("");

    $effect(() => {
        if (contactedAt.value === null) {
            isSuspend = false;
        } else {
            const pastDate = new Date(Number(contactedAt.value));
            const now = new Date();
            resumeDate = format(
                addHours(pastDate, 24),
                "yyyy年MM月dd日 HH時mm分ss秒",
                { locale: ja },
            );
            isSuspend = differenceInHours(now, pastDate) < 24;
        }
    });
</script>

<HeaderPart {board} title="お問い合わせ" />

<MainPart {board}>
    <p>当ページからのお問い合わせには、迅速に対応いたします。</p>
    <p class="mt-2">
        なお、誠に勝手ながら、お問い合わせの送信は1日1回までに制限させていただいております。
    </p>
    {#if isSuspend}
        <div
            class="bg-gray-500/10 border border-gray-300 p-6 rounded-lg shadow-md"
        >
            <h2 class="text-xl font-semibold">受付停止中です。</h2>
            {#if resumeDate}
                <p class="opacity-50 mt-4">
                    {resumeDate}に受付を再開いたします。
                </p>
            {/if}
        </div>
    {/if}
    <div class="mt-6">
        <div class="flex rounded-lg p-1">
            {#each contactTypes as tab}
                <button
                    onclick={() => (active = tab)}
                    class={`${active.label === tab.label ? "" : "opacity-30"} border flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors duration-200 focus:outline-none`}
                    class:shadow-md={active.label === tab.label}
                    class:font-bold={active.label === tab.label}
                >
                    <tab.icon class="mx-auto mb-1 h-5 w-5" />
                    {tab.label}
                </button>
            {/each}
        </div>
    </div>
    <div class="mt-6 flex flex-col gap-6">
        <div class="relative">
            <input
                type="email"
                placeholder="連絡先メールアドレス"
                class="peer h-10 w-full rounded-md border border-gray-500 px-3 pt-4 placeholder-transparent transition-colors duration-200 focus:border-blue-500 focus:outline-none bg-gray-100/0"
                bind:value={replyEmail}
                maxlength={254}
            />
            <label
                for="replyEmail"
                class="opacity-50 absolute left-3 top-2 text-xs transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs"
            >
                連絡先メールアドレス
            </label>
        </div>

        <div class="flex flex-col gap-2.5">
            {#if active.label === "改善要望"}
                <KaizenPart bind:this={KaizenPartInstance} bind:fill />
            {:else if active.label === "AGPL3"}
                <AGPL3Part bind:this={AGPL3PartInstance} bind:fill />
            {:else if active.label === "開示請求"}
                <PolicePart bind:this={PolicePartInstance} bind:fill />
            {/if}
        </div>

        <select
            bind:value={deadline}
            class="text-black bg-white block w-full h-10 rounded-md border border-gray-300 px-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
        >
            <option value="" disabled selected>納期</option>
            {#each deadlineOptions as str}
                <option value={str}>{str}</option>
            {/each}
        </select>

        <button
            onclick={handleSubmit}
            class="h-12 w-full rounded-md bg-blue-600 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            disabled={!enabledSubmit}
        >
            送信
        </button>
    </div>
</MainPart>

<FooterPart />

<Toast.Group {toaster}>
    {#snippet children(toast)}
        <Toast {toast}>
            <Toast.Message>
                <Toast.Title>{toast.title}</Toast.Title>
                <Toast.Description>{toast.description}</Toast.Description>
            </Toast.Message>
            <Toast.CloseTrigger />
        </Toast>
    {/snippet}
</Toast.Group>

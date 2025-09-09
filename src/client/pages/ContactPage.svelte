<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { createToaster } from "@skeletonlabs/skeleton-svelte";
    import { Toaster } from "@skeletonlabs/skeleton-svelte";
    import Button from "@smui/button";
    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import Select, { Option } from "@smui/select";
    import Tab, { Icon, Label } from "@smui/tab";
    import TabBar from "@smui/tab-bar";
    import Textfield from "@smui/textfield";
    import CharacterCounter from "@smui/textfield/character-counter";
    import { addHours, differenceInHours, format } from "date-fns";
    import { ja } from "date-fns/locale";
    import * as v from "valibot";
    import { contactedAt } from "../mylib/unj-storage.js";
    import {
        contactAGPL3,
        contactKaizen,
        contactPolice,
    } from "../mylib/webhook.js";
    import AGPL3Part from "../parts/contact/AGPL3Part.svelte";
    import KaizenPart from "../parts/contact/KaizenPart.svelte";
    import PolicePart from "../parts/contact/PolicePart.svelte";

    const toaster = createToaster();

    let AGPL3PartInstance: AGPL3Part | null = $state(null);
    let KaizenPartInstance: KaizenPart | null = $state(null);
    let PolicePartInstance: PolicePart | null = $state(null);

    type ContactType = {
        icon: string;
        label: string;
    };
    const contactTypes = [
        {
            icon: "question_answer",
            label: "改善要望",
        },
        {
            icon: "account_circle",
            label: "AGPL3",
        },
        {
            icon: "gavel",
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

<HeaderPart title="お問い合わせ" />

<MainPart>
    <p>当ページからのお問い合わせには、迅速に対応いたします。</p>
    <p>
        なお、誠に勝手ながら、お問い合わせの送信は1日1回までに制限させていただいております。
    </p>
    {#if isSuspend}
        <div
            class="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-lg shadow-md"
        >
            <h2 class="text-xl font-semibold">受付停止中です。</h2>
            {#if resumeDate}
                <p class="mt-4">{resumeDate}に受付を再開いたします。</p>
            {/if}
        </div>
    {/if}
    <LayoutGrid>
        <Cell span={12}>
            <div>
                <TabBar
                    tabs={contactTypes}
                    key={(tab: ContactType) => tab.label}
                    bind:active
                >
                    {#snippet tab(tab: ContactType)}
                        <Tab {tab}>
                            <Icon class="material-icons">{tab.icon}</Icon>
                            <Label>{tab.label}</Label>
                        </Tab>
                    {/snippet}
                </TabBar>
            </div>
        </Cell>
    </LayoutGrid>
    <div class="form-container">
        <Textfield
            label="連絡先メールアドレス"
            bind:value={replyEmail}
            input$maxlength={254}
        >
            {#snippet helper()}
                <CharacterCounter />
            {/snippet}
        </Textfield>

        {#if active.label === "改善要望"}
            <KaizenPart bind:this={KaizenPartInstance} bind:fill />
        {:else if active.label === "AGPL3"}
            <AGPL3Part bind:this={AGPL3PartInstance} bind:fill />
        {:else if active.label === "開示請求"}
            <PolicePart bind:this={PolicePartInstance} bind:fill />
        {/if}

        <Select bind:value={deadline} label="納期">
            {#each deadlineOptions as str}
                <Option value={str}>{str}</Option>
            {/each}
        </Select>

        <Button
            onclick={handleSubmit}
            variant="raised"
            disabled={!enabledSubmit}>送信</Button
        >
    </div>
</MainPart>

<FooterPart />

<Toaster {toaster}></Toaster>

<style>
    .form-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
</style>

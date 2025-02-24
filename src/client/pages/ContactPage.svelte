<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Textfield from "@smui/Textfield";
    import Button from "@smui/button";
    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import Select, { Option } from "@smui/select";
    import Tab, { Icon, Label } from "@smui/tab";
    import TabBar from "@smui/tab-bar";
    import CharacterCounter from "@smui/textfield/character-counter";
    import * as v from "valibot";
    import { validate1 } from "../mylib/validation.js";
    import {
        contactAGPL3,
        contactKaizen,
        contactPolice,
    } from "../mylib/webhook.js";
    import AGPL3Part from "../parts/contact/AGPL3Part.svelte";
    import KaizenPart from "../parts/contact/KaizenPart.svelte";
    import PolicePart from "../parts/contact/PolicePart.svelte";

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
        enabledSubmit = replyEmail !== "" && fill && !!deadline;
    });

    const emailSchema = v.pipe(v.string(), v.email());

    const handleSubmit = async () => {
        const err = validate1(emailSchema, replyEmail);
        if (err) {
            return alert("不正なメールアドレスです。"); // TODO: リッチに直す
        }
        switch (active.label) {
            case "改善要望": {
                if (KaizenPartInstance === null) {
                    break;
                }
                const input = KaizenPartInstance.getInputArray();
                try {
                    await contactKaizen([deadline, replyEmail, ...input]);
                } catch (err) {
                    // TODO: 送信に失敗した表示
                }
                break;
            }
            case "AGPL3": {
                if (AGPL3PartInstance === null) {
                    break;
                }
                const input = AGPL3PartInstance.getInputArray();
                try {
                    await contactAGPL3([deadline, replyEmail, ...input]);
                } catch (err) {
                    // TODO: 送信に失敗した表示
                }
                break;
            }
            case "開示請求": {
                if (PolicePartInstance === null) {
                    break;
                }
                const input = PolicePartInstance.getInputArray();
                try {
                    await contactPolice([deadline, replyEmail, ...input]);
                } catch (err) {
                    // TODO: 送信に失敗した表示
                }
                break;
            }
        }
    };
</script>

<!-- 問い合わせが殺到するので「よくある質問」も欲しい -->

<HeaderPart title="お問い合わせ" />

<MainPart>
    <p>当ページからのお問い合わせには、迅速に対応いたします。</p>
    <p>
        なお、誠に勝手ながら、お問い合わせの送信は1日1回までに制限させていただいております。
    </p>
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

<style>
    .form-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
</style>

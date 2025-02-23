<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Textfield from "@smui/Textfield";
    import Button from "@smui/button";
    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import SegmentedButton, { Segment, Label } from "@smui/segmented-button";
    import Select, { Option } from "@smui/select";
    import * as v from "valibot";
    import { validate1 } from "../mylib/validation.js";
    import { contactHelp } from "../mylib/webhook.js";
    import AGPL3Part from "../parts/contact/AGPL3Part.svelte";
    import HelpPart from "../parts/contact/HelpPart.svelte";
    import KaizenPart from "../parts/contact/KaizenPart.svelte";
    import PolicePart from "../parts/contact/PolicePart.svelte";

    let AGPL3PartInstance: AGPL3Part | null = $state(null);
    let HelpPartInstance: HelpPart | null = $state(null);
    let KaizenPartInstance: KaizenPart | null = $state(null);
    let PolicePartInstance: PolicePart | null = $state(null);

    let contactTypeList = ["ヘルプ", "改善要望", "AGPL3", "開示請求"];
    let contactType = $state("ヘルプ");
    let replyEmail = $state("");
    let enabledSubmit = $state(false);

    let deadline = $state("");
    const deadlineOptions = [
        "長（いつでもいいよ）",
        "中（今週中に）",
        "短（即日対応希望）",
    ];

    const emailSchema = v.pipe(v.string(), v.email());

    const handleSubmit = async () => {
        const err = validate1(emailSchema, replyEmail);
        if (err) {
            return alert("不正なメールアドレスです。"); // TODO: リッチに直す
        }
        switch (contactType) {
            case "ヘルプ": {
                if (HelpPartInstance === null) {
                    break;
                }
                const str = HelpPartInstance.toStr();
                try {
                    // await contactHelp([]);
                } catch (err) {
                    // TODO: 送信に失敗した表示
                }
                // TODO: 送信完了時専用の表示
                break;
            }
            case "改善要望": {
                if (KaizenPartInstance === null) {
                    break;
                }
                const str = KaizenPartInstance.toStr();
                try {
                    // await contactKaizen([]);
                } catch (err) {
                    // TODO: 送信に失敗した表示
                }
                break;
            }
            case "AGPL3": {
                if (AGPL3PartInstance === null) {
                    break;
                }
                const str = AGPL3PartInstance.toStr();
                try {
                    // await contactAGPL3([]);
                } catch (err) {
                    // TODO: 送信に失敗した表示
                }
                break;
            }
            case "開示請求": {
                if (PolicePartInstance === null) {
                    break;
                }
                const str = PolicePartInstance.toStr();
                try {
                    // await contactPolice([]);
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
    <p>このページからのお問い合わせは早めに反応されます。</p>
    <p>※誠に勝手ながら、1日1回までの送信に制限させて頂いています。</p>
    <LayoutGrid>
        <Cell span={12}>
            <Label>お問い合わせの種類</Label>
            <SegmentedButton
                singleSelect
                segments={contactTypeList}
                bind:selected={contactType}
            >
                {#snippet segment(segment: string)}
                    <Segment {segment}>
                        <Label>{segment}</Label>
                    </Segment>
                {/snippet}
            </SegmentedButton>
        </Cell>
    </LayoutGrid>
    <div class="form-container">
        <Textfield label="連絡先メールアドレス" bind:value={replyEmail} />
        {#if contactType === "ヘルプ"}
            <HelpPart bind:this={HelpPartInstance} bind:enabledSubmit />
        {:else if contactType === "改善要望"}
            <KaizenPart bind:this={KaizenPartInstance} bind:enabledSubmit />
        {:else if contactType === "AGPL3"}
            <AGPL3Part bind:this={AGPL3PartInstance} bind:enabledSubmit />
        {:else if contactType === "開示請求"}
            <PolicePart bind:this={PolicePartInstance} bind:enabledSubmit />
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

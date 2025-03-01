<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
    import Textfield from "@smui/Textfield";
    import Button from "@smui/button";
    import Checkbox from "@smui/checkbox";
    import FormField from "@smui/form-field";
    import List, { Item, Meta, Label, Separator, Subheader } from "@smui/list";
    import Select, { Option } from "@smui/select";
    import CharacterCounter from "@smui/textfield/character-counter";
    import { contentTypeOptions } from "../../common/validation/content-schema.js";
    import ContentPart from "../parts/ContentPart.svelte";

    let { refThreadId = "" } = $props();

    let content = $state("");
    let content_url = $state("");
    let content_type = $state(1);

    let content_types_bitmask = $state([1, 2, 4, 8, 16, 32, 64]);
    let title = $state("");

    const ccTypeOptions = [
        {
            key: 0,
            label: "完全匿名モード",
            note: "月沈めば名無し + 匿名化ID表示（ID:???）",
        },
        {
            key: 1,
            label: "半匿名モード",
            note: "月沈めば名無し + ID表示（ID:1w3z）",
        },
        {
            key: 2,
            label: "半コテモード",
            note: "月沈めば名無し + ID表示 + アイコン表示",
        },
        {
            key: 3,
            label: "コテモード",
            note: "コテハン使用可 + ID表示",
        },
        {
            key: 4,
            label: "自演防止モード",
            note: "月沈めば名無し + 自演防止ID表示（ID:8z.8u.L60）",
        },
        {
            key: 5,
            label: "半コテ & 自演防止モード",
            note: "月沈めば名無し + 自演防止ID表示 + アイコン表示",
        },
        {
            key: 6,
            label: "コテ & 自演防止モード",
            note: "コテハン使用可 + 自演防止ID表示",
        },
    ];
    let cc_type = $state(1);
    const ccNoteMap = new Map(ccTypeOptions.map((v) => [v.key, v.note]));

    let max = $state(1000);

    const timerOptions = [
        { key: 0, label: "なし" },
        { key: 1, label: "1時間" },
        { key: 3, label: "3時間" },
        { key: 6, label: "6時間" },
        { key: 12, label: "12時間" },
        { key: 24, label: "1日" },
        { key: 72, label: "3日" },
        { key: 168, label: "1週間" },
    ];
    let timer = $state(0);

    let check1 = $state(false);
    let sage = $state(false);

    const tryMakeNewThread = () => {
        alert("まだない");
    };

    const isRef = refThreadId !== "";
    if (isRef) {
        $effect(() => {
            // 次スレの場合はidbからスレタイを取ってくる
            // ただし、バックエンドで破棄される
        });
    }
</script>

<HeaderPart title="新規スレッド作成">
    {#if isRef}
        <p>次スレはスレタイ固定だよ</p>
        <p>ｳﾜｧｧ━━｡ﾟ(ﾟ´Д｀ﾟ)ﾟ｡━━ﾝ!!</p>
    {:else}
        <p>高度な設定</p>
        <FormField>
            <Checkbox bind:checked={sage} />
            {#snippet label()}
                強制sage進行
            {/snippet}
        </FormField>
        <div class="accordion-container">
            <Accordion multiple>
                <Panel>
                    <Header>匿名レベルの変更</Header>
                    <Content>
                        <Select bind:value={cc_type} label="!jien">
                            {#each ccTypeOptions as v}
                                <Option value={v.key}>{v.label}</Option>
                            {/each}
                        </Select>
                        <div
                            style="color: rgba(255, 255, 255, 0.6); font-size: 0.7rem;"
                        >
                            例：{ccNoteMap.get(cc_type)}
                        </div>
                    </Content>
                </Panel>
                <Panel>
                    <Header>投稿許可リスト</Header>
                    <Content>
                        <Label>!nopic</Label>
                        <List checkList={contentTypeOptions}>
                            {#each contentTypeOptions as v}
                                <Item>
                                    <Label>{v.label}</Label>
                                    <Meta>
                                        <Checkbox
                                            bind:group={content_types_bitmask}
                                            value={v.bit}
                                        />
                                    </Meta>
                                </Item>
                            {/each}
                        </List></Content
                    >
                </Panel>
                <Panel>
                    <Header>レス数上限</Header>
                    <Content>
                        <Textfield
                            bind:value={max}
                            label="!max"
                            type="number"
                            input$min="10"
                            input$max="1000"
                        />
                    </Content>
                </Panel>
                <Panel>
                    <Header>時間制限</Header>
                    <Content>
                        <Select bind:value={timer} label="!timer">
                            {#each timerOptions as v}
                                <Option value={v.key}>{v.label}</Option>
                            {/each}
                        </Select>
                    </Content>
                </Panel>
            </Accordion>
        </div>
    {/if}
</HeaderPart>

<MainPart>
    <div class="form-container">
        <Textfield
            disabled={isRef}
            label="スレタイ"
            bind:value={title}
            input$maxlength={32}
        >
            {#snippet helper()}
                <CharacterCounter />
            {/snippet}
        </Textfield>
        <ContentPart
            disabled={isRef}
            bind:content
            bind:content_url
            bind:content_type
        />
        <FormField>
            <Checkbox bind:checked={check1} />
            {#snippet label()}
                スレ立て準備完了？
            {/snippet}
        </FormField>
        <Button onclick={tryMakeNewThread} variant="raised" disabled={!check1}
            >新規スレッド作成</Button
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

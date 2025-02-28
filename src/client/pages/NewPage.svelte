<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Textfield from "@smui/Textfield";
    import Button from "@smui/button";
    import Checkbox from "@smui/checkbox";
    import FormField from "@smui/form-field";
    import List, { Item, Meta, Label } from "@smui/list";
    import Select, { Option } from "@smui/select";
    import CharacterCounter from "@smui/textfield/character-counter";
    import { contentTypeOptions } from "../../common/validation/content-schema.js";
    import { socket } from "../mylib/socket.js";
    import ContentPart from "../parts/ContentPart.svelte";

    let content = $state("");
    let content_url = $state("");
    let content_type = $state(1);

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

    let content_types_bitmask = $state([1, 2, 4]);
    let check1 = $state(false);

    const tryMakeNewThread = () => {
        alert("まだない");
    };
</script>

<HeaderPart title="新規スレッド作成" />

<MainPart>
    <div class="form-container">
        <Textfield label="スレタイ" bind:value={title} input$maxlength={32}>
            {#snippet helper()}
                <CharacterCounter />
            {/snippet}
        </Textfield>

        <ContentPart bind:content bind:content_url bind:content_type />

        <FormField>
            <Checkbox bind:checked={check1} />
            {#snippet label()}
                スレ立て準備完了？
            {/snippet}
        </FormField>

        <Button onclick={tryMakeNewThread} variant="raised" disabled={!check1}
            >新規スレッド作成</Button
        >

        <hr style="width:100%;" />
        <div>高度な設定</div>

        <Select bind:value={cc_type} label="匿名レベル">
            {#each ccTypeOptions as v}
                <Option value={v.key}>{v.label}</Option>
            {/each}
        </Select>
        <div>例：{ccNoteMap.get(cc_type)}</div>

        <Label>投稿許可リスト</Label>
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
        </List>
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

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
    import IconButton, { Icon } from "@smui/icon-button";
    import List, { Item, Graphic, Meta, Label } from "@smui/list";
    import Select, { Option } from "@smui/select";
    import CharacterCounter from "@smui/textfield/character-counter";
    import audio from "../../common/validation/whitelist/audio.js";
    import gif from "../../common/validation/whitelist/gif.js";
    import image from "../../common/validation/whitelist/image.js";
    import type { SiteInfo } from "../../common/validation/whitelist/site-info.js";
    import unjGames from "../../common/validation/whitelist/unj-games.js";
    import video from "../../common/validation/whitelist/video.js";
    import UrlSuggestionPart from "../parts/UrlSuggestionPart.svelte";

    let title = $state("");
    let content = $state("");
    let content_url = $state("");

    const contentTypeOptions = [
        { bit: 1, label: "テキスト", list: [] },
        { bit: 2, label: "テキスト+URL", list: [] },
        { bit: 4, label: "テキスト+ゲームURL", list: unjGames },
        { bit: 8, label: "テキスト+画像URL", list: image },
        { bit: 16, label: "テキスト+GIF画像URL", list: gif },
        { bit: 32, label: "テキスト+動画URL", list: video },
        { bit: 64, label: "テキスト+音楽URL", list: audio },
    ];
    let content_type = $state(1);

    let open = $state(false);
    let list: SiteInfo[] = $state([]);

    $effect(() => {
        list =
            contentTypeOptions.find((v) => v.bit === content_type)?.list ?? [];
    });

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

<UrlSuggestionPart bind:open bind:content_url {list}>
    {#if content_type === 2}
        <p>短縮URLは使用禁止！</p>
    {:else if content_type === 4}
        <p>みんなで遊べるブラウザゲームを集めました。</p>
    {:else if content_type === 8}
        <p>画像が埋め込まれます。</p>
    {:else if content_type === 16}
        <p>GIF画像が埋め込まれます。</p>
    {:else if content_type === 32}
        <p>動画再生プレイヤーが埋め込まれます。</p>
    {:else if content_type === 64}
        <p>音楽再生プレイヤーが埋め込まれます。</p>
    {/if}
</UrlSuggestionPart>

<MainPart>
    <div class="form-container">
        <Textfield label="スレタイ" bind:value={title} input$maxlength={32}>
            {#snippet helper()}
                <CharacterCounter />
            {/snippet}
        </Textfield>

        <Textfield
            textarea
            label="本文"
            bind:value={content}
            input$maxlength={1024}
        >
            {#snippet helper()}
                <CharacterCounter />
            {/snippet}
        </Textfield>

        <Select bind:value={content_type} label="本文の形式">
            {#each contentTypeOptions as v}
                <Option value={v.bit}>{v.label}</Option>
            {/each}
        </Select>

        <Textfield
            label="URL欄"
            bind:value={content_url}
            input$maxlength={1024}
            style="{content_type !== 1 || 'visibility:hidden'};"
        >
            {#snippet trailingIcon()}
                <IconButton
                    class="material-icons"
                    onclick={() => (open = true)}
                    style="{content_type > 2 || 'visibility:hidden'};"
                    >add_link</IconButton
                >
            {/snippet}
            {#snippet helper()}
                <CharacterCounter
                    style="{content_type !== 1 || 'visibility:hidden'};"
                />
            {/snippet}
        </Textfield>

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

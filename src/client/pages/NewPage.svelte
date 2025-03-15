<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
    import Button from "@smui/button";
    import Checkbox from "@smui/checkbox";
    import FormField from "@smui/form-field";
    import List, { Item, Meta, Label } from "@smui/list";
    import Select, { Option } from "@smui/select";
    import Textfield from "@smui/textfield";
    import CharacterCounter from "@smui/textfield/character-counter";
    import { onMount } from "svelte";
    import { navigate } from "svelte-routing";
    import {
        ccOptions,
        contentTypeOptions,
    } from "../../common/request/content-schema.js";
    import type { HeadlineThread } from "../../common/response/schema.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { base } from "../mylib/env.js";
    import { goodbye, hello, nonceKey, ok, socket } from "../mylib/socket.js";
    import { sleep } from "../mylib/util.js";
    import ResFormPart from "../parts/ResFormPart.svelte";

    let { isRef = false } = $props();

    let title = $state("");
    let userName = $state("");
    let userAvatar = $state(0);
    let content = $state("");
    let contentUrl = $state("");
    let contentType = $state(1);

    let varsan = $state(false);
    let sage = $state(false);

    const bits2Int = (bits: number[]) => bits.reduce((p, x) => p | x);

    let ccBitmask = $state([1, 4, 8]);
    let contentTypesBitmask = $state([1, 4, 8, 16, 32, 64]);
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
        { key: 4380, label: "半年" },
        { key: 8760, label: "1年間" },
    ];
    let timer = $state(0);

    let check1 = $state(false);

    const handleMakeThread = (data: { ok: boolean; new: HeadlineThread }) => {
        if (data.ok) {
            ok();
            navigate(base(`/thread/${data.new.id}`));
        }
    };

    onMount(() => {
        hello();
        socket.on("makeThread", handleMakeThread);
        return () => {
            goodbye();
            socket.off("makeThread", handleMakeThread);
        };
    });

    let emitting = $state(false);
    const tryMakeThread = async () => {
        emitting = true;
        // フロントエンドのバリデーション
        // バックエンドに送信
        socket.emit("makeThread", {
            nonce: genNonce(nonceKey),
            userName,
            userAvatar,
            title,
            content,
            contentUrl,
            contentType,
            varsan,
            sage,
            ccBitmask: bits2Int(ccBitmask),
            contentTypesBitmask: bits2Int(contentTypesBitmask),
            max,
            timer,
        });
        await sleep(4096);
        ok();
        emitting = false;
    };

    if (isRef) {
        onMount(() => {
            // 次スレの場合はkeyvalから次スレ情報を取ってくる
        });
    }
</script>

<HeaderPart title="新規スレッド作成">
    {#if isRef}
        <p>次スレはスレタイ固定です。</p>
        <p>ｳﾜｧｧ━━｡ﾟ(ﾟ´Д｀ﾟ)ﾟ｡━━ﾝ!!</p>
    {:else}
        <p>高度な設定</p>
        <FormField>
            <Checkbox disabled={emitting} bind:checked={varsan} />
            {#snippet label()}
                事前バルサン
            {/snippet}
        </FormField>
        <FormField>
            <Checkbox disabled={emitting} bind:checked={sage} />
            {#snippet label()}
                強制sage進行
            {/snippet}
        </FormField>
        <div class="accordion-container">
            <Accordion>
                <Panel>
                    <Header>匿名レベルの変更</Header>
                    <Content>
                        <Label>!jien</Label>
                        <List checkList>
                            {#each ccOptions as v}
                                <Item>
                                    <Label>{v.label}</Label>
                                    <Meta>
                                        <Checkbox
                                            bind:group={ccBitmask}
                                            value={v.bit}
                                        />
                                    </Meta>
                                </Item>
                            {/each}
                        </List>
                    </Content>
                </Panel>
                <Panel>
                    <Header>投稿許可リスト</Header>
                    <Content>
                        <Label>!nopic</Label>
                        <List checkList>
                            {#each contentTypeOptions as v}
                                <Item>
                                    <Label>{v.label}</Label>
                                    <Meta>
                                        <Checkbox
                                            bind:group={contentTypesBitmask}
                                            value={v.bit}
                                        />
                                    </Meta>
                                </Item>
                            {/each}
                        </List>
                    </Content>
                </Panel>
                <Panel>
                    <Header>レス数上限</Header>
                    <Content>
                        <Textfield
                            disabled={emitting}
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
                        <Select
                            disabled={emitting}
                            bind:value={timer}
                            label="!timer"
                        >
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
            disabled={emitting || isRef}
            label="スレタイ"
            bind:value={title}
            input$maxlength={32}
        >
            {#snippet helper()}
                <CharacterCounter />
            {/snippet}
        </Textfield>
        <ResFormPart
            disabled={emitting || isRef}
            bind:userName
            bind:userAvatar
            bind:content
            bind:contentUrl
            bind:contentType
        />
        <FormField>
            <Checkbox disabled={emitting} bind:checked={check1} />
            {#snippet label()}
                スレ立て準備完了？
            {/snippet}
        </FormField>
        <Button
            onclick={tryMakeThread}
            variant="raised"
            disabled={emitting || !check1}>新規スレッド作成</Button
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

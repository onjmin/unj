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
    import { differenceInSeconds } from "date-fns";
    import { sha256 } from "js-sha256";
    import { navigate } from "svelte-routing";
    import * as v from "valibot";
    import {
        Enum,
        type EnumType,
        ccOptions,
        contentSchemaMap,
        contentTypeOptions,
    } from "../../common/request/content-schema.js";
    import { MakeThreadSchema, myConfig } from "../../common/request/schema.js";
    import type { HeadlineThread } from "../../common/response/schema.js";
    import { randInt, sleep } from "../../common/util.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { makePathname } from "../mylib/env.js";
    import {
        type ImgurResponse,
        imgurHistory,
        uploadImgur,
    } from "../mylib/imgur.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import {
        UnjStorage,
        nonceKey,
        oekakiUploaded,
        termsAgreement,
    } from "../mylib/unj-storage.js";
    import { oekakiLogger } from "../mylib/webhook.js";
    import ResFormPart from "../parts/ResFormPart.svelte";
    import TermsConfirmPart from "../parts/TermsConfirmPart.svelte";

    let { isRef = false } = $props();

    let openConfirm = $state(false);
    let title = $state("");
    let userName = $state("");
    let userAvatar = $state(0);
    let contentText = $state("");
    let contentUrl = $state("");
    let contentType: EnumType = $state(Enum.Text);

    // UnjStorage
    const titleUnjStorage = new UnjStorage("title");
    title = titleUnjStorage.value ?? "";
    $effect(() => {
        titleUnjStorage.value = title;
    });

    // UnjStorage
    const contentTextUnjStorage = new UnjStorage("contentText");
    contentText = contentTextUnjStorage.value ?? "";
    $effect(() => {
        contentTextUnjStorage.value = contentText;
    });

    let varsan = $state(false);
    let sage = $state(false);

    const bits2Int = (bits: number[]) => bits.reduce((p, x) => p | x);

    let ccBitmask = $state([1, 4, 8]);
    let contentTypesBitmask = $state([
        Enum.Oekaki,
        Enum.Text,
        Enum.Url,
        Enum.Image,
        Enum.Gif,
        Enum.Video,
        Enum.Audio,
        Enum.Games,
    ]);
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

    const handleMakeThread = (data: {
        ok: boolean;
        new: HeadlineThread;
        yours: boolean;
    }) => {
        if (!data.ok) return;
        if (!data.yours) return;
        ok();
        titleUnjStorage.value = null;
        contentTextUnjStorage.value = null;
        navigate(makePathname(`/thread/${data.new.id}`));
    };

    $effect(() => {
        hello();
        socket.on("makeThread", handleMakeThread);
        return () => {
            goodbye();
            socket.off("makeThread", handleMakeThread);
        };
    });

    let emitting = $state(false);
    let toDataURL = $state(() => "");
    let uploadedImgur: ImgurResponse | null = null;
    const tryMakeThread = async () => {
        // 利用規約同意
        // if (termsAgreement.value !== "yes") {
        //     openConfirm = true;
        //     return;
        // }
        if (emitting) return;
        emitting = true;
        let contentMeta = {};
        if (contentType === Enum.Oekaki) {
            const result = await (async () => {
                if (uploadedImgur) {
                    contentUrl = uploadedImgur.link;
                    contentMeta = uploadedImgur;
                    return true;
                }
                const last = oekakiUploaded.value;
                if (last) {
                    const limit = randInt(16, 256);
                    const diffSeconds = differenceInSeconds(
                        new Date(),
                        new Date(last),
                    );
                    if (diffSeconds < limit) {
                        alert(`${limit - diffSeconds}秒後に再投稿できます`);
                        return;
                    }
                }
                oekakiUploaded.value = new Date().toString();
                const dataURL = toDataURL();
                if (!dataURL) return;
                try {
                    const res = await uploadImgur(dataURL);
                    const json = await res.json();
                    const { link, id, deletehash } = json.data;
                    contentUrl = link;
                    contentMeta = { link, id, deletehash };
                    uploadedImgur = { link, id, deletehash };
                    imgurHistory
                        .get()
                        .then((v) => v?.push({ link, id, deletehash }));
                    try {
                        oekakiLogger([link, id, deletehash]);
                    } catch (err) {}
                    return true;
                } catch (err) {}
            })();
            if (!result) {
                await sleep(4096);
                emitting = false;
                return;
            }
        }
        if (!contentUrl) contentType = Enum.Text;
        const data = {
            nonce: genNonce(nonceKey.value ?? ""),
            userName,
            userAvatar,
            title,
            contentText,
            contentUrl,
            contentMeta,
            contentType,
            varsan,
            sage,
            ccBitmask: bits2Int(ccBitmask),
            contentTypesBitmask: bits2Int(contentTypesBitmask),
            max,
            timer,
        };
        const result = (() => {
            // 共通のバリデーション
            const makeThread = v.safeParse(MakeThreadSchema, data, myConfig);
            if (!makeThread.success) return;
            const { contentTypesBitmask, contentType } = makeThread.output;
            if ((contentTypesBitmask & contentType) === 0) return;
            const schema = contentSchemaMap.get(contentType);
            if (!schema) return;
            const content = v.safeParse(schema, data, myConfig);
            if (!content.success) return;
            return makeThread.output;
        })();
        if (!result) {
            await sleep(4096);
            emitting = false;
            return;
        }
        socket.emit("makeThread", { ...result, contentMeta });
        await sleep(4096);
        emitting = false;
        ok();
    };

    if (isRef) {
        // $effect(() => {
        //     // 次スレの場合はkeyvalから次スレ情報を取ってくる
        // });
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
                            key={String}
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

<TermsConfirmPart {openConfirm} />

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
            bind:contentText
            bind:contentUrl
            bind:contentType
            contentTypesBitmask={bits2Int(contentTypesBitmask)}
            threadId={sha256(Math.random().toString())}
            oekaki
            bind:toDataURL
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

<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { ChevronDownIcon, ChevronRightIcon } from "@lucide/svelte";
    import Button from "@smui/button";
    import Select, { Option } from "@smui/select";
    import Textfield from "@smui/textfield";
    import CharacterCounter from "@smui/textfield/character-counter";
    import { addSeconds, differenceInSeconds } from "date-fns";
    import { sha256 } from "js-sha256";
    import { navigate } from "svelte-routing";
    import * as v from "valibot";
    import type { Board } from "../../common/request/board.js";
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
    import { ObjectStorage } from "../mylib/object-storage.js";
    import { type ResHistory } from "../mylib/res-history.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import {
        UnjStorage,
        nonceKey,
        oekakiUploaded,
        termsAgreement,
    } from "../mylib/unj-storage.js";
    import { oekakiLogger } from "../mylib/webhook.js";
    import LayerPanelPart from "../parts/LayerPanelPart.svelte";
    import ResFormPart from "../parts/ResFormPart.svelte";
    import TermsConfirmPart from "../parts/TermsConfirmPart.svelte";

    let { board, isRef = false }: { board: Board; isRef?: boolean } = $props();

    let openConfirm = $state(false);
    let title = $state("");
    let userName = $state("");
    let userAvatar = $state(0);
    let contentText = $state("");
    let contentUrl = $state("");
    let contentType: EnumType = $state(Enum.Text);
    let activeLayer = $state(null);

    // UnjStorage
    const titleUnjStorage = new UnjStorage(`title###${board.id}`);
    title = titleUnjStorage.value ?? "";
    $effect(() => {
        titleUnjStorage.value = title;
    });

    // UnjStorage
    const contentTextUnjStorage = new UnjStorage(`contentText###${board.id}`);
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
        Enum.Game,
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

    let resHistories: ResHistory[] | null = $state(null);
    const resHistoryCache = new ObjectStorage<ResHistory[]>("resHistoryCache");
    $effect(() => {
        resHistoryCache.get().then((v) => {
            if (v && !resHistories) {
                resHistories = v;
            } else {
                resHistories = [];
            }
        });
    });

    const handleMakeThread = (data: {
        ok: boolean;
        new: HeadlineThread;
        yours: boolean;
        nonceKey: string | null;
    }) => {
        if (!data.ok) return;
        if (!data.yours) return;
        ok(data.nonceKey ?? "");
        titleUnjStorage.value = null;
        contentTextUnjStorage.value = null;
        resHistories?.unshift({
            latestRes: data.new.latestRes,
            resNum: 1,
            createdAt: new Date(data.new.latestResAt),
            threadId: data.new.id,
            title: title,
            resCount: 1,
            boardId: board.id,
        });
        resHistoryCache.set(resHistories);
        navigate(makePathname(`/${board.key}/thread/${data.new.id}`));
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
        //     openConfirm = true;
        //     return;
        // }
        if (emitting || !check1) return;
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
                    const diffSeconds = differenceInSeconds(
                        new Date(last),
                        new Date(),
                    );
                    if (diffSeconds > 0) {
                        alert(`${diffSeconds}秒後に再投稿できます`);
                        return;
                    }
                }
                oekakiUploaded.value = addSeconds(
                    new Date(),
                    randInt(16, 256),
                ).toString();
                const dataURL = toDataURL();
                if (!dataURL) return;
                try {
                    const res = await uploadImgur(dataURL);
                    const json = await res.json();
                    const { link, id, deletehash } = json.data;
                    contentUrl = link;
                    contentMeta = { link, id, deletehash };
                    uploadedImgur = { link, id, deletehash };
                    try {
                        oekakiLogger([link, deletehash]);
                    } catch (err) {}
                    if (!id) return;
                    imgurHistory.get().then((v) => {
                        const arr = v ? v : [];
                        arr.push({ link, id, deletehash });
                        imgurHistory.set(arr);
                    });
                    return true;
                } catch (err) {}
            })();
            if (!result) {
                await sleep(1024);
                emitting = false;
                return;
            }
        }
        if (!contentUrl) contentType = Enum.Text;
        const data = {
            boardId: board.id,
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
            await sleep(1024);
            emitting = false;
            return;
        }
        socket.emit("makeThread", { ...result, contentMeta });
        await sleep(1024);
        emitting = false;
        ok();
    };

    if (isRef) {
        // $effect(() => {
        //     // 次スレの場合はkeyvalから次スレ情報を取ってくる
        // });
    }

    // アコーディオンの状態を管理するSvelteの状態
    let openAccordion: string | null = $state(null);
    const toggleAccordion = (panelName: string) => {
        openAccordion = openAccordion === panelName ? null : panelName;
    };
</script>

<HeaderPart {board} title="新規スレッド作成">
    {#if isRef}
        <p>次スレはスレタイ固定です。</p>
        <p>ｳﾜｧｧ━━｡ﾟ(ﾟ´Д｀ﾟ)ﾟ｡━━ﾝ!!</p>
    {:else}
        <p>高度な設定</p>
        <div class="flex items-center space-x-2">
            <input
                type="checkbox"
                id="varsan"
                disabled={emitting}
                bind:checked={varsan}
                class="h-4 w-4 text-blue-600 rounded"
            />
            <label for="varsan" class="text-sm">事前バルサン</label>
        </div>
        <div class="flex items-center space-x-2">
            <input
                type="checkbox"
                id="sage"
                disabled={emitting}
                bind:checked={sage}
                class="h-4 w-4 text-blue-600 rounded"
            />
            <label for="sage" class="text-sm">強制sage進行</label>
        </div>
        <div class="space-y-4">
            <div class="bg-white rounded-lg shadow">
                <div
                    tabindex="0"
                    role="button"
                    onkeydown={() => {}}
                    class="flex justify-between items-center p-4 cursor-pointer"
                    onclick={() => toggleAccordion("ccLevel")}
                >
                    <h3 class="font-bold text-lg">匿名レベルの変更</h3>
                    {#if openAccordion === "ccLevel"}
                        <ChevronDownIcon class="h-6 w-6" />
                    {:else}
                        <ChevronRightIcon class="h-6 w-6" />
                    {/if}
                </div>
                {#if openAccordion === "ccLevel"}
                    <div class="p-4 border-t border-gray-200">
                        <p class="text-gray-500 text-sm mb-2">!jien</p>
                        <div class="space-y-2">
                            {#each ccOptions as v}
                                <div class="flex items-center justify-between">
                                    <label for="cc-{v.bit}" class="flex-1"
                                        >{v.label}</label
                                    >
                                    <input
                                        type="checkbox"
                                        id="cc-{v.bit}"
                                        disabled={emitting}
                                        bind:group={ccBitmask}
                                        value={v.bit}
                                        class="form-checkbox h-5 w-5 text-blue-600"
                                    />
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <div class="bg-white rounded-lg shadow">
                <div
                    tabindex="0"
                    role="button"
                    onkeydown={() => {}}
                    class="flex justify-between items-center p-4 cursor-pointer"
                    onclick={() => toggleAccordion("contentType")}
                >
                    <h3 class="font-bold text-lg">投稿許可リスト</h3>
                    {#if openAccordion === "contentType"}
                        <ChevronDownIcon class="h-6 w-6" />
                    {:else}
                        <ChevronRightIcon class="h-6 w-6" />
                    {/if}
                </div>
                {#if openAccordion === "contentType"}
                    <div class="p-4 border-t border-gray-200">
                        <p class="text-gray-500 text-sm mb-2">!nopic</p>
                        <div class="space-y-2">
                            {#each contentTypeOptions as v}
                                <div class="flex items-center justify-between">
                                    <label
                                        for="contentType-{v.bit}"
                                        class="flex-1">{v.label}</label
                                    >
                                    <input
                                        type="checkbox"
                                        id="contentType-{v.bit}"
                                        disabled={emitting}
                                        bind:group={contentTypesBitmask}
                                        value={v.bit}
                                        class="form-checkbox h-5 w-5 text-blue-600"
                                    />
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <div class="bg-white rounded-lg shadow">
                <div
                    tabindex="0"
                    role="button"
                    onkeydown={() => {}}
                    class="flex justify-between items-center p-4 cursor-pointer"
                    onclick={() => toggleAccordion("maxRes")}
                >
                    <h3 class="font-bold text-lg">レス数上限</h3>
                    {#if openAccordion === "maxRes"}
                        <ChevronDownIcon class="h-6 w-6" />
                    {:else}
                        <ChevronRightIcon class="h-6 w-6" />
                    {/if}
                </div>
                {#if openAccordion === "maxRes"}
                    <div class="p-4 border-t border-gray-200">
                        <Textfield
                            disabled={emitting}
                            bind:value={max}
                            label="!max"
                            type="number"
                            input$min="10"
                            input$max="1000"
                            class="w-full"
                        />
                    </div>
                {/if}
            </div>

            <div class="bg-white rounded-lg shadow">
                <div
                    tabindex="0"
                    role="button"
                    onkeydown={() => {}}
                    class="flex justify-between items-center p-4 cursor-pointer"
                    onclick={() => toggleAccordion("timer")}
                >
                    <h3 class="font-bold text-lg">時間制限</h3>
                    {#if openAccordion === "timer"}
                        <ChevronDownIcon class="h-6 w-6" />
                    {:else}
                        <ChevronRightIcon class="h-6 w-6" />
                    {/if}
                </div>
                {#if openAccordion === "timer"}
                    <div class="p-4 border-t border-gray-200">
                        <Select
                            disabled={emitting}
                            key={String}
                            bind:value={timer}
                            label="!timer"
                            class="w-full"
                        >
                            {#each timerOptions as v}
                                <Option value={v.key}>{v.label}</Option>
                            {/each}
                        </Select>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    {#if contentType === Enum.Oekaki}
        <LayerPanelPart bind:activeLayer />
    {/if}
</HeaderPart>

<TermsConfirmPart {openConfirm} />

<MainPart {board}>
    <div class="px-4 pb-8 flex flex-col gap-2">
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
            {board}
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
            bind:activeLayer
            tryRes={tryMakeThread}
        />
        <div class="flex items-center space-x-2 mt-4">
            <input
                type="checkbox"
                id="check1"
                disabled={emitting}
                bind:checked={check1}
                class="h-4 w-4 text-blue-600 rounded"
            />
            <label for="check1" class="text-sm">スレ立て準備完了？</label>
        </div>
        <Button
            onclick={tryMakeThread}
            variant="raised"
            disabled={emitting || !check1}>新規スレッド作成</Button
        >
    </div>
</MainPart>

<FooterPart />

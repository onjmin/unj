<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import {
        ArrowDownIcon,
        BrushIcon,
        ChevronDownIcon,
        ChevronUpIcon,
        ExpandIcon,
    } from "@lucide/svelte";
    import {
        ChevronFirstIcon,
        ChevronLastIcon,
        ChevronLeftIcon,
        ChevronRightIcon,
        ChevronsLeftRightEllipsisIcon,
        CircleArrowLeftIcon,
    } from "@lucide/svelte";
    import { Switch } from "@skeletonlabs/skeleton-svelte";
    import Banner, { Icon, Label } from "@smui/banner";
    import Button from "@smui/button";
    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import Paper, { Content } from "@smui/paper";
    import {
        addSeconds,
        differenceInDays,
        differenceInSeconds,
        intervalToDuration,
    } from "date-fns";
    import { sha256 } from "js-sha256";
    import { navigate } from "svelte-routing";
    import * as v from "valibot";
    import {
        type Board,
        boardIdMap,
        touhouBoard,
    } from "../../common/request/board.js";
    import {
        Enum,
        ankaRegex,
        contentSchemaMap,
        contentTemplateMap,
    } from "../../common/request/content-schema.js";
    import {
        ResSchema,
        myConfig,
        queryResultLimit,
    } from "../../common/request/schema.js";
    import {
        SiteInfo,
        findIn,
    } from "../../common/request/whitelist/site-info.js";
    import type { Meta, Res, Thread } from "../../common/response/schema.js";
    import { randInt, sleep } from "../../common/util.js";
    import { encrypt } from "../mylib/aes-gcm.js";
    import { genAiWebhookHash, genNonce } from "../mylib/anti-debug.js";
    import {
        getResizedBase64Image,
        isAvailableCloudflareR2,
        uploadCloudflareR2,
        uploadHistory,
    } from "../mylib/cloudflare-r2.js";
    import { visible } from "../mylib/dom.js";
    import { makePathname } from "../mylib/env.js";
    import {
        type ImgurResponse,
        imgurHistory,
        uploadImgur,
    } from "../mylib/imgur.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import { type ResHistory } from "../mylib/res-history.js";
    import { scrollToAnka } from "../mylib/scroll.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import {
        changeNewResSound,
        changeReplyResSound,
        changeVolume,
        newResSoundHowl,
        replyResSoundHowl,
    } from "../mylib/sound.js";
    import { openRight } from "../mylib/store.js";
    import {
        UnjStorage,
        oekakiUploaded,
        resFormExpand,
        rpgMode,
    } from "../mylib/unj-storage.js";
    import {
        latestReadThreadId,
        nonceKey,
        sAnimsId,
        termsAgreement,
    } from "../mylib/unj-storage.js";
    import { aiWebhook, oekakiLogger } from "../mylib/webhook.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import BackgroundEmbedPart from "../parts/BackgroundEmbedPart.svelte";
    import BalsPart from "../parts/BalsPart.svelte";
    import ColorWheelPart from "../parts/ColorWheelPart.svelte";
    import DressUpPart from "../parts/DressUpPart.svelte";
    import DtmPart from "../parts/DtmPart.svelte";
    import KomePart from "../parts/KomePart.svelte";
    import LayerPanelPart from "../parts/LayerPanelPart.svelte";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";
    import OekakiPart from "../parts/OekakiPart.svelte";
    import ResFormPart from "../parts/ResFormPart.svelte";
    import ResPart from "../parts/ResPart.svelte";
    import RpgPart from "../parts/RpgPart.svelte";
    import TermsConfirmPart from "../parts/TermsConfirmPart.svelte";
    import TwemojiPart from "../parts/TwemojiPart.svelte";

    changeVolume();
    changeNewResSound();
    changeReplyResSound();

    let {
        board,
        threadId,
        resNum = 2,
    }: { board: Board; threadId: string; resNum?: number } = $props();

    let openConfirm = $state(false);
    let textarea: HTMLTextAreaElement | null = $state(null);
    const focus = () => {
        textarea?.focus();
        $openRight = true;
    };

    let userName = $state("");
    let userAvatar = $state(0);
    let password = $state("");
    let contentText = $state("");
    let contentUrl = $state("");
    let contentType = $state(0);
    let previewUrl = $state("");
    let oekakiCollab = $state("");
    let isSage = $state(false);
    let isNinja = $state(false);
    let isExpand = $state(resFormExpand.value === "1");
    let isRpgMode = $state(rpgMode.value === "1");
    let openDressUp = $state(false);
    let nowSAnimsId = $state(Number(sAnimsId.value ?? 2086));
    let dressUp: (() => void) | undefined = $state();

    $effect(() => {
        sAnimsId.value = String(nowSAnimsId);
        dressUp?.();
    });
    $effect(() => {
        rpgMode.value = isRpgMode ? "1" : "0";
    });
    $effect(() => {
        resFormExpand.value = isExpand ? "1" : "0";
    });

    // UnjStorage
    const contentTextUnjStorage = new UnjStorage(`contentText###${threadId}`);
    contentText = contentTextUnjStorage.value ?? "";
    $effect(() => {
        contentTextUnjStorage.value = contentText === "" ? null : contentText;
    });

    // UnjStorage
    const sageUnjStorage = new UnjStorage(`sage###${threadId}`);
    isSage = sageUnjStorage.value === "sage";
    $effect(() => {
        sageUnjStorage.value = isSage ? "sage" : null;
    });

    // UnjStorage
    const ninjaUnjStorage = new UnjStorage(`ninja###${threadId}`);
    isNinja = ninjaUnjStorage.value === "ninja";
    $effect(() => {
        ninjaUnjStorage.value = isNinja ? "ninja" : null;
    });

    let online = $state(0);
    let pv = $state(0);
    const handleJoinThread = (data: {
        ok: boolean;
        size: number;
        pv: number | null;
    }) => {
        if (!data.ok) return;
        online = data.size;
        pv = data.pv ?? pv;
    };

    let chips: string[] = $state([]);
    const updateChips = () => {
        if (!thread) return;
        chips = [];
        if (thread.balsResNum) chips.push("※禁断呪文バルス（スレ強制終了）");
        if (thread.resLimit < 1000) chips.push(`上限${thread.resLimit}スレ`);
        if (thread.deletedAt) chips.push("時間制限スレ");
        if ((thread.ccBitmask & 3) === 0) chips.push("ID非表示");
        if (thread.ccBitmask & 2) chips.push("自演防止＠jien");
        if ((thread.ccBitmask & 4) === 0) chips.push("コテ禁");
        if ((thread.ccBitmask & 8) === 0) chips.push("アイコン禁止");
        if (thread.varsan) chips.push("バルサン中");
        if (thread.sage) chips.push("強制sage");
    };

    const updateContentType = () => {
        if (!thread) return;
        const { contentTypesBitmask } = thread;
        if ((contentTypesBitmask & contentType) !== 0) return;
        contentType = contentTypesBitmask & -contentTypesBitmask;
    };

    let checkedOekaki = $state(false);
    $effect(() => {
        if (!thread) return;
        const { contentTypesBitmask } = thread;
        if (checkedOekaki && (contentTypesBitmask & Enum.Oekaki) !== 0)
            contentType = Enum.Oekaki;
        else if (!checkedOekaki && (contentTypesBitmask & Enum.Text) !== 0)
            contentType = Enum.Text;
    });

    let thread: Thread | null = $state(null);
    const cache = new ObjectStorage<Thread>(`threadCache###${threadId}`);
    $effect(() => {
        cache.get().then((v) => {
            if (v && !thread) loadThread(v);
        });
    });

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

    let ignoreList: Set<string> | null = $state(null);
    const ignoreListCache = new ObjectStorage<string[]>("ignoreListCache");
    $effect(() => {
        ignoreListCache.get().then((v) => {
            if (v && !ignoreList) {
                ignoreList = new Set(v);
            } else {
                ignoreList = new Set();
            }
        });
    });

    let title = $state("スレ取得中");
    let lolCount = $state(0);
    let goodVotes = $state(0);
    let badVotes = $state(0);
    let total = $state(0);
    let denominator = $state(0);
    let goodRatio = $state(0);
    let badRatio = $state(0);
    let activeLayer = $state(null);

    const loadThread = async (_thread: Thread) => {
        thread = _thread;
        if (!thread) return;
        title = thread.title;
        lolCount = thread.lolCount;
        goodVotes = thread.goodCount;
        badVotes = thread.badCount;
        updateChips();
        updateContentType();
    };

    const handleReadThread = async (data: { ok: boolean; thread: Thread }) => {
        if (!data.ok) return;
        ok();
        if (data.thread.boardId !== board.id) {
            const b = boardIdMap.get(data.thread.boardId);
            if (b) {
                navigate(makePathname(`/${b.key}/thread/${threadId}/`));
            } else {
                navigate(makePathname(`/${board.key}`));
            }
            return;
        }
        loadThread(data.thread);
        cache.set(data.thread);
        if (!new URLSearchParams(location.search).has("top"))
            setTimeout(() => scrollToAnka(resNum));
    };

    let openNewResNotice = $state(false);
    let newResCount = $state(0);
    let newResNum = $state(0);
    let isAlreadyScrollEnd = $state(false);
    $effect(() => {
        if (isAlreadyScrollEnd) {
            openNewResNotice = false;
            newResCount = 0;
        }
    });

    const isAI = (str: string) =>
        str.startsWith("!beep") ||
        str.startsWith("!ai") ||
        str.startsWith("!gen");
    let expectedResNum = 0;

    const handleRes = async (data: {
        ok: boolean;
        new: Res;
        yours: boolean;
    }) => {
        if (!data.ok || !thread) return;
        newResNum = data.new.num;
        thread.resCount = newResNum;
        if (thread.resList.length > 128) {
            thread.resList.shift();
        }
        thread.resList.push(data.new);
        if (thread.ageResNum === newResNum) thread.ageRes = data.new;
        newResSoundHowl?.play();
        if (data.yours) {
            ok();
            contentTextUnjStorage.value = null;
            contentText = "";
            contentUrl = "";
            previewUrl = "";
            if (
                contentType === Enum.Oekaki &&
                (thread.contentTypesBitmask & Enum.Text) !== 0
            ) {
                contentType = Enum.Text;
                checkedOekaki = false;
            }
            uploadedImgur = null;
            await sleep(512);
            scrollToAnka(newResNum);
            resHistories?.unshift({
                latestRes: data.new.contentText || data.new.contentUrl,
                resNum: newResNum,
                createdAt: new Date(data.new.createdAt),
                threadId: threadId,
                title: title,
                resCount: newResNum,
                boardId: board.id,
            });
            resHistoryCache.set(resHistories);

            // AI機能
            if (isAI(data.new.contentText) && expectedResNum === newResNum) {
                expectedResNum = 0;
                const nonce = sha256(Math.random().toString()).slice(0, 8);
                try {
                    aiWebhook([
                        genAiWebhookHash(nonce, threadId, newResNum),
                        nonce,
                        threadId,
                        String(newResNum), // レス番号
                        data.new.contentText,
                    ]);
                } catch (err) {}
            }
        } else if (!isAlreadyScrollEnd) {
            openNewResNotice = true;
            newResCount++;
        }

        const multiAnka = data.new.contentText
            .match(ankaRegex)
            ?.map((v) => v.slice(2))
            .map(Number);
        for (const n of multiAnka ?? []) {
            const replyTo = thread.resList.find((v) => v.yours && v.num === n);
            if (replyTo) {
                await sleep(512);
                replyResSoundHowl?.play();
                break;
            }
        }
    };

    const handleUpdateMeta = async (data: { ok: boolean; new: Meta }) => {
        if (!data.ok || !thread) return;
        thread.varsan = data.new.varsan;
        thread.sage = data.new.sage;
        thread.ccBitmask = data.new.ccBitmask;
        thread.contentTypesBitmask = data.new.contentTypesBitmask;
        thread.ps = data.new.ps;
        thread.ageResNum = data.new.ageResNum;
        thread.ageRes = data.new.ageRes;
        thread.balsResNum = data.new.balsResNum;
        updateChips();
        updateContentType();
    };

    const handleLoL = (data: {
        ok: boolean;
        lolCount: number;
        yours: boolean;
    }) => {
        if (!data.ok) return;
        lolCount = data.lolCount;
        if (data.yours) ok();
    };

    const handleLike = (data: {
        ok: boolean;
        goodCount: number;
        badCount: number;
        yours: boolean;
    }) => {
        if (!data.ok) return;
        goodVotes = data.goodCount;
        badVotes = data.badCount;
        if (data.yours) ok();
    };

    $effect(() => {
        total = goodVotes + badVotes;
        denominator = total < 16 ? 16 : total;
        goodRatio = (goodVotes / denominator) * 100;
        badRatio = (badVotes / denominator) * 100;
    });

    let remaining = $state("");
    const countdown = (date: Date): string => {
        const now = new Date();
        const diffSeconds = differenceInSeconds(date, now);
        if (diffSeconds < 0) {
            cache.set(null);
            const filtered = resHistories?.filter(
                (v) => v.threadId !== threadId,
            );
            if (filtered) resHistoryCache.set(filtered);
            navigate(makePathname(`/${board.key}`), { replace: true });
            return "期限切れ";
        }
        if (diffSeconds <= 359999) {
            const duration = intervalToDuration({ start: now, end: date });
            const hours = String(
                (duration.hours ?? 0) + (duration.days ?? 0) * 24,
            ).padStart(2, "0");
            const minutes = String(duration.minutes ?? 0).padStart(2, "0");
            const seconds = String(duration.seconds ?? 0).padStart(2, "0");
            return `${hours}:${minutes}:${seconds}`;
        }
        const days = differenceInDays(date, now);
        return `あと${days}日`;
    };

    let id: NodeJS.Timeout;
    $effect(() => {
        id = setInterval(() => {
            if (!thread) return;
            if (!thread.deletedAt) return;
            remaining = countdown(thread.deletedAt);
        }, 512);
        hello(() => {
            socket.emit("joinThread", {
                threadId,
            });
            socket.emit("readThread", {
                nonce: genNonce(nonceKey.value ?? ""),
                limit: queryResultLimit,
                sinceResNum: resNum,
                untilResNum: null,
                threadId,
            });
            latestReadThreadId.value = threadId;
        });
        socket.on("joinThread", handleJoinThread);
        socket.on("readThread", handleReadThread);
        socket.on("updateMeta", handleUpdateMeta);
        socket.on("res", handleRes);
        socket.on("lol", handleLoL);
        socket.on("like", handleLike);
        return () => {
            clearInterval(id);
            goodbye();
            socket.off("joinThread", handleJoinThread);
            socket.off("readThread", handleReadThread);
            socket.off("updateMeta", handleUpdateMeta);
            socket.off("res", handleRes);
            socket.off("lol", handleLoL);
            socket.off("like", handleLike);
        };
    });

    let laaaaaaaag = $state(false);
    $effect(() => {
        const id = setTimeout(() => {
            laaaaaaaag = true;
        }, 4096);
        return () => clearTimeout(id);
    });

    let emitting = $state(false);
    let toDataURL = $state(() => "");
    let uploadedImgur: ImgurResponse | null = null;
    const tryRes = async () => {
        // 利用規約同意
        // if (termsAgreement.value !== "yes") {
        //     openConfirm = true;
        //     return;
        // }
        if (emitting || !thread) return;
        emitting = true;

        // お絵描き機能
        if (contentType === Enum.Oekaki) {
            const result = await (async () => {
                if (uploadedImgur) {
                    contentUrl = uploadedImgur.link;
                    return true;
                }
                const last = oekakiUploaded.value;
                if (last) {
                    const diffSeconds = differenceInSeconds(
                        new Date(last),
                        new Date(),
                    );
                    if (diffSeconds > 0) {
                        if (!isAvailableCloudflareR2) {
                            alert(`${diffSeconds}秒後に再投稿できます`);
                            return;
                        }
                        // フォールバック
                        const dataURL = toDataURL();
                        if (!dataURL) return;
                        try {
                            const res = await uploadCloudflareR2(
                                dataURL,
                                false,
                            );
                            const json = await res.json();
                            const { link, delete_id, delete_hash } = json.data;
                            contentUrl = link;
                            imgurHistory.get().then((v) => {
                                const arr = v ? v : [];
                                arr.unshift({
                                    link,
                                    id: delete_id,
                                    deletehash: delete_hash,
                                });
                                imgurHistory.set(arr);
                            });
                            return true;
                        } catch (err) {}
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
                    uploadedImgur = { link, id, deletehash };
                    try {
                        oekakiLogger([link, deletehash]);
                    } catch (err) {}
                    if (!id) return;
                    imgurHistory.get().then((v) => {
                        const arr = v ? v : [];
                        arr.unshift({ link, id, deletehash });
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

        // 画像アップロード機能
        if (contentType === Enum.Image && previewUrl) {
            try {
                const res = await uploadCloudflareR2(
                    await getResizedBase64Image(previewUrl),
                );
                if (res.status !== 200) throw new Error(await res.text());
                const json = await res.json();
                const { link, delete_id, delete_hash } = json.data;
                contentUrl = link;
                uploadHistory.get().then((v) => {
                    const arr = v ? v : [];
                    arr.unshift({ link, delete_id, delete_hash });
                    uploadHistory.set(arr);
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "不明なエラー";
                alert(`画像のうｐに失敗しました。${errorMessage}`);
                emitting = false;
                return;
            }
        }

        // 暗号レス
        const _contentText = contentText;
        if (contentType === Enum.Encrypt) {
            contentText = await encrypt(contentText, password);
        }

        if (
            !contentUrl &&
            contentType !== Enum.Dtm &&
            contentType !== Enum.Encrypt
        ) {
            contentType = Enum.Text;
        }

        const data = {
            nonce: genNonce(nonceKey.value ?? ""),
            threadId,
            userName,
            userAvatar,
            contentText,
            contentUrl,
            contentType,
            sage: isSage,
            ninja: isNinja,
        };
        const result = (() => {
            const res = v.safeParse(ResSchema, data, myConfig);
            if (!res.success) return;
            const contentTypesBitmask = thread.contentTypesBitmask ?? 0;
            if ((contentTypesBitmask & res.output.contentType) === 0) return;
            const schema = contentSchemaMap.get(res.output.contentType);
            if (!schema) return;
            const content = v.safeParse(schema, data, myConfig);
            if (!content.success) return;
            return res.output;
        })();
        if (!result) {
            if (contentType === Enum.Encrypt) contentText = _contentText;
            await sleep(1024);
            emitting = false;
            return;
        }

        // AI機能
        if (isAI(result.contentText)) {
            expectedResNum = thread.resCount + 1;
        }

        socket.emit("res", result);
        await sleep(1024);
        emitting = false;
        ok();
    };

    const tryLoL = () => {
        socket.emit("lol", {
            nonce: genNonce(nonceKey.value ?? ""),
            threadId,
        });
    };

    const tryLike = (good: boolean) => {
        socket.emit("like", {
            nonce: genNonce(nonceKey.value ?? ""),
            threadId,
            good,
        });
    };

    let siteInfo: SiteInfo | null = $state(null);
    $effect(() => {
        const temp =
            contentTemplateMap.get(thread?.ageRes?.contentType ?? 0) ?? [];
        try {
            siteInfo = findIn(
                temp,
                new URL(thread?.ageRes?.contentUrl ?? "").hostname,
            );
        } catch (err) {}
    });

    const defaultSelected = "";
    let commandSelected = $state(defaultSelected);
    let commandOptions: string[] = $state([]);
    $effect(() => {
        let arr: string[] = [defaultSelected];
        if (thread?.yours)
            arr = [...arr, "!reset", "!sage", "!jien", "!add", "!バルス"];
        arr = [
            ...arr,
            "!aku",
            "!kaijo",
            "!sub",
            "!バルサン",
            "!ngk",
            "!nopic",
            "!age",
        ];
        arr = [...arr, "!ping", "!check"];
        commandOptions = arr;
    });
    $effect(() => {
        if (
            commandSelected &&
            commandSelected !== defaultSelected &&
            !contentText.includes(commandSelected)
        ) {
            contentText =
                `${contentText.replace(/\s+$/, "")}\n${commandSelected}`.replace(
                    /^\n/,
                    "",
                );
        }
    });
</script>

{#snippet form(menu = false)}
    <ResFormPart
        {board}
        disabled={emitting}
        bind:textarea
        bind:userName
        bind:userAvatar
        bind:password
        bind:contentText
        bind:contentUrl
        bind:contentType
        contentTypesBitmask={thread?.contentTypesBitmask ?? 0}
        bind:activeLayer
        {tryRes}
        {isExpand}
        bind:previewUrl
        {menu}
    />
    {#if contentType === Enum.Oekaki && !menu}
        <OekakiPart
            {threadId}
            bind:oekakiCollab
            bind:toDataURL
            bind:activeLayer
        />
    {/if}
    {#if contentType === Enum.Dtm && !menu}
        <DtmPart />
    {/if}
    <div class="w-full max-w-xs">
        <Button disabled={emitting} onclick={tryRes} variant="raised"
            >投稿する</Button
        >
        <Switch
            controlActive="bg-secondary-500"
            checked={isSage}
            onCheckedChange={(e) => {
                isSage = e.checked;
            }}
        >
            {#snippet inactiveChild()}
                <ArrowDownIcon size="14" />
            {/snippet}
            {#snippet activeChild()}
                <ArrowDownIcon size="14" />
            {/snippet}
        </Switch>
        <Switch
            controlActive="bg-secondary-500"
            checked={isNinja}
            onCheckedChange={(e) => {
                isNinja = e.checked;
            }}
        >
            {#snippet inactiveChild()}
                忍
            {/snippet}
            {#snippet activeChild()}
                忍
            {/snippet}
        </Switch>
        {#if thread?.yours}
            <Switch controlActive="bg-secondary-500" disabled checked={true}>
                {#snippet inactiveChild()}
                    主
                {/snippet}
                {#snippet activeChild()}
                    主
                {/snippet}
            </Switch>
        {/if}
        <!-- <FormField align="end">
        {#snippet label()}RPGMODE{/snippet}
        <Checkbox bind:checked={isRpgMode} />
    </FormField>
    {#if isRpgMode}
        <IconButton
            class="material-icons"
            onclick={() => {
                openDressUp = true;
            }}>checkroom</IconButton
        >
    {/if} -->
        {#if !menu}
            <Switch
                controlActive="bg-secondary-500"
                checked={checkedOekaki}
                onCheckedChange={(e) => {
                    checkedOekaki = e.checked;
                }}
            >
                {#snippet inactiveChild()}
                    <BrushIcon size="14" />
                {/snippet}
                {#snippet activeChild()}
                    <BrushIcon size="14" />
                {/snippet}
            </Switch>
        {/if}
        <Switch
            controlActive="bg-secondary-500"
            checked={isExpand}
            onCheckedChange={(e) => {
                isExpand = e.checked;
            }}
        >
            {#snippet inactiveChild()}
                <ExpandIcon size="14" />
            {/snippet}
            {#snippet activeChild()}
                <ExpandIcon size="14" />
            {/snippet}
        </Switch>
    </div>
{/snippet}

<HeaderPart {board} {title}>
    <AccessCounterPart {online} {pv} />
    <div>{@render form(true)}</div>
    {#if contentType === Enum.Oekaki}
        <br />
        <ColorWheelPart />
        <LayerPanelPart bind:activeLayer />
    {/if}
    <br />
    <KomePart {online} room={threadId} />
</HeaderPart>

<TermsConfirmPart {openConfirm} />
<DressUpPart bind:open={openDressUp} bind:nowSAnimsId />

<Banner bind:open={openNewResNotice} centered mobileStacked>
    {#snippet icon()}
        <Icon class="material-icons">fiber_new</Icon>
    {/snippet}
    {#snippet label()}
        <Label>{newResCount}件の新着レス</Label>
    {/snippet}
    {#snippet actions()}
        <Button onclick={() => scrollToAnka(newResNum)}>見に行く</Button>
        <Button>却下</Button>
    {/snippet}
</Banner>

{#if thread?.ageRes && !ignoreList?.has(thread?.ageRes.ccUserId)}
    <div class="ageRes">
        <ResPart
            {board}
            bind:ignoreList
            bind:oekakiCollab
            bind:bindContentText={contentText}
            bind:bindContentType={contentType}
            {focus}
            ccUserId={thread?.ageRes.ccUserId}
            ccUserName={thread?.ageRes.ccUserName}
            ccUserAvatar={thread?.ageRes.ccUserAvatar}
            contentText={thread?.ageRes.contentText}
            contentUrl={thread?.ageRes.contentUrl}
            contentType={Enum.Text}
            num={thread?.ageRes.num}
            isOwner={thread?.ageRes.isOwner}
            sage={thread?.ageRes.sage}
            createdAt={thread?.ageRes.createdAt}
            threadId={thread.id}
            backgroundEmbedControls={(siteInfo?.id === 1601 ||
                siteInfo?.id === 1602 ||
                siteInfo?.id === 3201) &&
                board === touhouBoard}
        />
    </div>
    {#if board === touhouBoard}
        {#key thread?.ageRes.num}
            <BackgroundEmbedPart
                contentUrl={thread.ageRes.contentUrl}
                contentType={thread.ageRes.contentType}
            />
        {/key}
    {/if}
{/if}

<!-- {#if isRpgMode}
    <RpgPart {threadId} bind:dressUp />
{/if} -->

{#snippet paginationControls()}
    <div class="flex justify-center items-center space-x-2">
        <!-- First Page Button -->
        <button
            class="bg-gray-600 text-gray-200 p-2 rounded"
            disabled={emitting || resNum < 3}
            onclick={() => {
                if (!thread) return;
                navigate(makePathname(`/${board.key}/thread/${thread.id}/`));
            }}
        >
            <ChevronFirstIcon class="w-5 h-5" />
        </button>

        <!-- Chevron Left Button -->
        <button
            class="bg-gray-600 text-gray-200 p-2 rounded"
            disabled={emitting || resNum < 3}
            onclick={() => {
                if (!thread) return;
                navigate(
                    makePathname(
                        `/${board.key}/thread/${thread.id}/${Math.max(resNum - queryResultLimit, 2)}`.replace(
                            /\/2$/,
                            "/",
                        ),
                    ),
                );
            }}
        >
            <ChevronLeftIcon class="w-5 h-5" />
        </button>

        <!-- Checkbox Outline (Disabled) -->
        <button class="bg-gray-600 text-gray-200 p-2 rounded" disabled>
            <ChevronsLeftRightEllipsisIcon class="w-5 h-5" />
        </button>

        <!-- Chevron Right Button -->
        <button
            class="bg-gray-600 text-gray-200 p-2 rounded"
            disabled={emitting ||
                (thread &&
                    (thread.resCount < queryResultLimit ||
                        resNum > thread.resCount - queryResultLimit))}
            onclick={() => {
                if (!thread) return;
                navigate(
                    makePathname(
                        `/${board.key}/thread/${thread.id}/${Math.min(resNum + queryResultLimit, thread.resCount - queryResultLimit + 1)}`,
                    ),
                );
            }}
        >
            <ChevronRightIcon class="w-5 h-5" />
        </button>

        <!-- Last Page Button -->
        <button
            class="bg-gray-600 text-gray-200 p-2 rounded"
            disabled={emitting ||
                (thread &&
                    (thread.resCount < queryResultLimit ||
                        resNum > thread.resCount - queryResultLimit))}
            onclick={() => {
                if (!thread) return;
                navigate(
                    makePathname(
                        `/${board.key}/thread/${thread.id}/${thread.resCount - queryResultLimit + 1}`,
                    ),
                );
            }}
        >
            <ChevronLastIcon class="w-5 h-5" />
        </button>
    </div>
{/snippet}

<MainPart {board}>
    {#if thread === null}
        <p>スレ取得中…</p>
        {#if laaaaaaaag}
            <MessageBoxPart
                title="まだ終わらない？"
                description={[
                    "サーバーが落ちてるかも。。",
                    "ページ更新してみてね。",
                ]}
            />
        {/if}
    {/if}
    {#if thread}
        <!-- 画面右端に上下スクロールボタンを固定配置 -->
        <div class="sticky top-1/2 -translate-y-1/2 ml-auto mr-2 w-fit z-8">
            <div class="h-0 w-0 relative" style="pointer-events: none;">
                <div
                    class="absolute right-0 top-0 flex flex-col items-center gap-8"
                    style="transform: translateY(-50%); pointer-events: auto;"
                >
                    <button
                        class="bg-gray-500/80 hover:bg-gray-500/40 text-white p-2 rounded-full shadow-lg transition"
                        onclick={() =>
                            scrollToAnka(thread?.resList.at(0)?.num ?? 0)}
                    >
                        <ChevronUpIcon class="w-5 h-5" />
                    </button>
                    <button
                        class="bg-gray-500/80 hover:bg-gray-500/40 text-white p-2 rounded-full shadow-lg transition"
                        onclick={() =>
                            scrollToAnka(thread?.resList.at(-1)?.num ?? 0)}
                    >
                        <ChevronDownIcon class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
        <div class="thread-header">
            <p class="thread-title flex items-center">
                <TwemojiPart seed={thread.id} />
                <span class="unj-font pl-1.5">{thread.title}</span>
            </p>
            <ChipSet {chips} nonInteractive>
                {#snippet chip(chip: string)}
                    <Chip {chip}>
                        <LeadingIcon class="material-icons"
                            >new_releases</LeadingIcon
                        >
                        <Text tabindex={0}>{chip}</Text>
                    </Chip>
                {/snippet}
            </ChipSet>
            {#if thread.balsResNum}
                <span class="bals-warning">
                    【閲覧注意！】このスレはスレ主によってバルスされました。
                </span>
                <br />
                <span class="bals-warning">
                    最後のコメまでスクロールするとスレが崩壊しますよっと。。
                </span>
            {/if}
            {#if remaining !== ""}
                <div style="text-align:center">
                    <Chip chip>
                        <LeadingIcon class="material-icons"
                            >schedule</LeadingIcon
                        >
                        <Text tabindex={0}>{remaining}</Text>
                    </Chip>
                </div>
            {/if}
            <div class="flex items-center space-x-2">
                <button
                    class="inline-flex items-center space-x-1 rounded-full bg-green-100/80 hover:bg-green-100/40 px-3 py-1 text-green-800"
                    onclick={tryLoL}
                >
                    <span class="font-bold">草</span>
                    <span class="text-sm"
                        >×{lolCount}<span class="font-normal">草</span></span
                    >
                </button>
                <div
                    class="relative overflow-hidden whitespace-nowrap text-green-500"
                >
                    <span
                        class="inline-block animate-wave text-base font-normal leading-none tracking-tight"
                    >
                        {"ｗ".repeat(lolCount)}
                    </span>
                </div>
            </div>
        </div>
        <div class="bg-gray-800 rounded-lg">
            {@render paginationControls()}
        </div>
        <div class="res-list">
            {#if !ignoreList?.has(thread.ccUserId)}
                <ResPart
                    {board}
                    {focus}
                    bind:ignoreList
                    bind:oekakiCollab
                    bind:bindContentText={contentText}
                    bind:bindContentType={contentType}
                    ccUserId={thread.ccUserId}
                    ccUserName={thread.ccUserName}
                    ccUserAvatar={thread.ccUserAvatar}
                    contentText={thread.contentText}
                    contentUrl={thread.contentUrl}
                    contentType={thread.contentType}
                    ps={thread.ps}
                    num={1}
                    isOwner={true}
                    createdAt={thread.createdAt}
                    threadId={thread.id}
                >
                    <div class="unj-like-vote-container">
                        <div class="vote-buttons">
                            <Button
                                class="good-vote"
                                onclick={() => tryLike(true)}>ｲｲ!</Button
                            >
                            <span class="good-count">+{goodVotes}</span>
                            <div class="bar">
                                <div
                                    class="good"
                                    style="width:{goodRatio}%;"
                                ></div>
                                <div
                                    class="bad"
                                    style="width:{badRatio}%;"
                                ></div>
                            </div>
                            <span class="bad-count">-{badVotes}</span>
                            <Button
                                class="bad-vote"
                                onclick={() => tryLike(false)}>ｲｸﾅｲ!</Button
                            >
                        </div>
                    </div>
                </ResPart>
            {/if}
            {#each thread.resList as res}
                <hr class="opacity-10" />
                {#if !ignoreList?.has(res.ccUserId)}
                    <ResPart
                        {board}
                        {focus}
                        bind:ignoreList
                        bind:oekakiCollab
                        bind:bindContentText={contentText}
                        bind:bindContentType={contentType}
                        ccUserId={res.ccUserId}
                        ccUserName={res.ccUserName}
                        ccUserAvatar={res.ccUserAvatar}
                        contentText={res.contentText}
                        contentUrl={res.contentUrl}
                        contentType={res.contentType}
                        commandResult={res.commandResult}
                        num={res.num}
                        isOwner={res.isOwner}
                        sage={res.sage}
                        createdAt={res.createdAt}
                        threadId={thread.id}
                    >
                        {#if res.num === thread.balsResNum}
                            <BalsPart {threadId} />
                        {/if}
                    </ResPart>
                {/if}
            {/each}
        </div>
        <div
            use:visible={(visible) => {
                isAlreadyScrollEnd = visible;
            }}
        ></div>
        <div class="bg-gray-800 rounded-lg">
            {@render paginationControls()}
        </div>
        <Paper>
            <Content>
                <div class="flex flex-col items-center">
                    {@render form(false)}
                </div>
            </Content>
        </Paper>

        <div
            class="mx-auto w-full max-w-sm flex flex-col space-y-2 p-4 bg-gray-100/10 rounded-lg"
        >
            <div class="flex items-center space-x-2 justify-center">
                <span class="text-sm font-medium text-gray-500"
                    >無視設定件数：</span
                >
                <span class="text-lg font-bold">
                    {ignoreList?.size ?? 0}件
                </span>
            </div>
            <div class="flex space-x-2">
                <Button
                    class="flex-1 bg-gray-600 hover:bg-gray-500"
                    disabled={!ignoreList?.size}
                    onclick={() => {
                        if (!ignoreList) return;
                        const newIgnoreList = new Set(
                            [...ignoreList].slice(0, -1),
                        );
                        ignoreList = newIgnoreList;
                        ignoreListCache.set([...newIgnoreList]);
                    }}
                >
                    一個戻す
                </Button>
                <Button
                    class="flex-1 bg-gray-600 hover:bg-gray-500"
                    disabled={!ignoreList?.size}
                    onclick={() => {
                        if (!ignoreList) return;
                        if (
                            !confirm(
                                "無視設定をクリアします。\nよろしいですか？",
                            )
                        )
                            return;
                        ignoreList = new Set();
                        ignoreListCache.set([]);
                    }}
                >
                    全クリア
                </Button>
            </div>
        </div>

        <div
            class="flex flex-col space-y-2 p-4 bg-gray-800 text-gray-200 rounded-lg"
        >
            <button
                class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                onclick={() => navigate(makePathname(`/${board.key}`))}
            >
                <CircleArrowLeftIcon size={16} />
                <span class="text-sm font-medium">板トップに戻る</span>
            </button>

            <button
                class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                onclick={() => navigate(makePathname(`/${board.key}/history`))}
            >
                <CircleArrowLeftIcon size={16} />
                <span class="text-sm font-medium">履歴に戻る</span>
            </button>
        </div>
    {/if}
</MainPart>

<FooterPart />

<style>
    .ageRes {
        margin: 0 auto;
        max-width: 100svw;
        min-width: 60svw;
    }
    .thread-header {
        text-align: left;
        inline-size: 768px;
        max-inline-size: 92%;
        padding-bottom: 16px;
        padding-left: 16px;
        padding-right: 16px;
    }
    .thread-title {
        color: #409090;
        font-weight: bold;
    }
    .res-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        text-align: left;
    }
    .bals-warning {
        background-color: #e57373;
    }

    /* ｲｲ!(・∀・) (・Ａ・)ｲｸﾅｲ!  */
    .unj-like-vote-container {
        display: flex;
        align-items: right;
        justify-content: right;
        gap: 8px;
        padding: 8px;
    }
    .vote-buttons {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    :global(.unj-like-vote-container .good-vote) {
        color: #66f;
    }

    :global(.unj-like-vote-container .bad-vote) {
        color: #f66;
    }
    @media screen and (min-width: 768px) {
        :global(.unj-like-vote-container .good-vote)::after {
            content: "(・∀・)";
        }
        :global(.unj-like-vote-container .bad-vote)::before {
            content: "(・Ａ・)";
        }
    }
    .bar {
        position: relative;
        width: 64px; /* 固定幅 */
        height: 20px;
        background-color: #eee;
        border-radius: 10px; /* 角丸 */
        margin: 0 8px; /* 左右に少し余白 */
        overflow: hidden; /* はみ出すバーが隠れるように */
    }
    .good {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background-color: skyblue;
    }
    .bad {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background-color: #f99;
    }
    .good-count {
        min-width: 3rem;
        text-align: right;
    }
    .bad-count {
        min-width: 3rem;
    }
</style>

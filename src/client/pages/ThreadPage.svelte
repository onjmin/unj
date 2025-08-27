<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Banner, { Icon, Label } from "@smui/banner";
    import Button from "@smui/button";
    import Checkbox from "@smui/checkbox";
    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import FormField from "@smui/form-field";
    import IconButton from "@smui/icon-button";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import Select, { Option } from "@smui/select";
    import Switch from "@smui/switch";
    import {
        addSeconds,
        differenceInDays,
        differenceInSeconds,
        intervalToDuration,
    } from "date-fns";
    import { navigate } from "svelte-routing";
    import * as v from "valibot";
    import {
        Enum,
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
    import { genNonce } from "../mylib/anti-debug.js";
    import { visible } from "../mylib/dom.js";
    import { makePathname } from "../mylib/env.js";
    import {
        type ImgurResponse,
        imgurHistory,
        uploadImgur,
    } from "../mylib/imgur.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
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
        rpgMode,
    } from "../mylib/unj-storage.js";
    import {
        latestReadThreadId,
        nonceKey,
        sAnimsId,
        termsAgreement,
    } from "../mylib/unj-storage.js";
    import { oekakiLogger } from "../mylib/webhook.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";
    import BackgroundEmbedPart from "../parts/BackgroundEmbedPart.svelte";
    import BalsPart from "../parts/BalsPart.svelte";
    import DressUpPart from "../parts/DressUpPart.svelte";
    import ResFormPart from "../parts/ResFormPart.svelte";
    import ResPart from "../parts/ResPart.svelte";
    import RpgPart from "../parts/RpgPart.svelte";
    import TermsConfirmPart from "../parts/TermsConfirmPart.svelte";
    import TwemojiPart from "../parts/TwemojiPart.svelte";

    changeVolume();
    changeNewResSound();
    changeReplyResSound();

    let { threadId = "", cursor = "", desc = false } = $props();

    let openConfirm = $state(false);
    let textarea: HTMLTextAreaElement | null = $state(null);
    const focus = () => {
        textarea?.focus();
        $openRight = true;
    };

    let userName = $state("");
    let userAvatar = $state(0);
    let contentText = $state("");
    let contentUrl = $state("");
    let contentType = $state(0);
    let sage = $state(false);
    let ninja = $state(false);
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

    // UnjStorage
    const contentTextUnjStorage = new UnjStorage(`contentText###${threadId}`);
    contentText = contentTextUnjStorage.value ?? "";
    $effect(() => {
        contentTextUnjStorage.value = contentText === "" ? null : contentText;
    });

    // UnjStorage
    const sageUnjStorage = new UnjStorage(`sage###${threadId}`);
    sage = sageUnjStorage.value === "sage";
    $effect(() => {
        sageUnjStorage.value = sage ? "sage" : null;
    });

    // UnjStorage
    const ninjaUnjStorage = new UnjStorage(`ninja###${threadId}`);
    ninja = ninjaUnjStorage.value === "ninja";
    $effect(() => {
        ninjaUnjStorage.value = ninja ? "ninja" : null;
    });

    let bookmark = $state(false); // idbから取得する

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

    let topCursor = $state("");
    let bottomCursor = $state("");
    let title = $state("スレ取得中");
    let lolCount = $state(0);
    let goodVotes = $state(0);
    let badVotes = $state(0);
    let total = $state(0);
    let denominator = $state(0);
    let goodRatio = $state(0);
    let badRatio = $state(0);
    let shouldScrollTo2 = $state(cursor !== "" && !desc);

    const loadThread = async (_thread: Thread) => {
        thread = _thread;
        if (!thread) return;
        if (thread.resList.length) {
            if (thread.desc) thread.resList.reverse();
            topCursor = thread.resList[0].cursor;
            bottomCursor = thread.resList[thread.resList.length - 1].cursor;
        }
        title = thread.title;
        lolCount = thread.lolCount;
        goodVotes = thread.goodCount;
        badVotes = thread.badCount;
        updateChips();
        updateContentType();
        if (shouldScrollTo2) {
            shouldScrollTo2 = false;
            await sleep(512);
            scrollTo2();
        }
    };

    const handleReadThread = async (data: { ok: boolean; thread: Thread }) => {
        if (!data.ok) return;
        ok();
        loadThread(data.thread);
        cache.set(data.thread);
    };

    let openNewResNotice = $state(false);
    let newResCount = $state(0);
    let isAlreadyScrollEnd = $state(false);
    $effect(() => {
        if (isAlreadyScrollEnd) {
            openNewResNotice = false;
            newResCount = 0;
        }
    });

    const handleRes = async (data: {
        ok: boolean;
        new: Res;
        yours: boolean;
    }) => {
        if (!data.ok || !thread) return;
        if (thread.resList.length > 128) {
            thread.resList.shift();
        }
        thread.resList.push(data.new);
        thread.latestCursor = data.new.cursor;
        if (thread.ageResNum === data.new.num) thread.ageRes = data.new;
        newResSoundHowl?.play();
        if (data.yours) {
            ok();
            contentTextUnjStorage.value = null;
            contentText = "";
            contentUrl = "";
            uploadedImgur = null;
            await sleep(512);
            scrollToEnd();
        } else if (!isAlreadyScrollEnd) {
            openNewResNotice = true;
            newResCount++;
        }
        const m = data.new.contentText.match(/>>([0-9]+)/);
        if (m) {
            const num = Number(m[1]);
            const replyTo = thread.resList.find(
                (v) => v.yours && v.num === num,
            );
            if (replyTo) {
                await sleep(512);
                replyResSoundHowl?.play();
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

    const scrollTo2 = () => {
        const main = document.querySelector(".unj-main-part") ?? document.body;
        const res = document.querySelectorAll(".res");
        const cursor = res[1];
        if (cursor) {
            main.scrollTo({
                top: (cursor as HTMLElement).offsetTop,
                behavior: "smooth",
            });
        }
    };

    const scrollToEnd = () => {
        const main = document.querySelector(".unj-main-part") ?? document.body;
        main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
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
            navigate(makePathname("/headline"), { replace: true });
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
                cursor: cursor || null,
                size: queryResultLimit,
                desc: latestReadThreadId.value === threadId ? false : desc,
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

    const cursorBasedPagination = async ({
        cursor,
        desc,
    }: {
        cursor?: string;
        desc: boolean;
    }) => {
        if (emitting) return;
        emitting = true;
        socket.emit("readThread", {
            nonce: genNonce(nonceKey.value ?? ""),
            cursor: cursor || null,
            size: queryResultLimit,
            desc,
            threadId,
        });
        await sleep(2048);
        emitting = false;
        ok();
    };

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
                await sleep(4096);
                emitting = false;
                return;
            }
        }
        if (!contentUrl) contentType = Enum.Text;
        const data = {
            nonce: genNonce(nonceKey.value ?? ""),
            threadId,
            userName,
            userAvatar,
            contentText,
            contentUrl,
            contentMeta,
            contentType,
            sage,
            ninja,
        };
        const result = (() => {
            // 共通のバリデーション
            const res = v.safeParse(ResSchema, data, myConfig);
            if (!res.success) return;
            const contentTypesBitmask = thread?.contentTypesBitmask ?? 0;
            if ((contentTypesBitmask & res.output.contentType) === 0) return;
            const schema = contentSchemaMap.get(res.output.contentType);
            if (!schema) return;
            const content = v.safeParse(schema, data, myConfig);
            if (!content.success) return;
            return res.output;
        })();
        if (!result) {
            await sleep(4096);
            emitting = false;
            return;
        }
        socket.emit("res", { ...result, contentMeta });
        await sleep(4096);
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

{#snippet form(oekaki = false)}
    <ResFormPart
        disabled={emitting}
        bind:textarea
        bind:userName
        bind:userAvatar
        bind:contentText
        bind:contentUrl
        bind:contentType
        contentTypesBitmask={thread?.contentTypesBitmask ?? 0}
        {threadId}
        {oekaki}
        bind:toDataURL
        {tryRes}
    />
    <Button disabled={emitting} onclick={tryRes} variant="raised"
        >投稿する</Button
    >
    <FormField align="end">
        {#snippet label()}
            <Icon class="material-icons">arrow_downward</Icon>
        {/snippet}
        <Checkbox bind:checked={sage} />
    </FormField>
    <FormField align="end">
        {#snippet label()}忍{/snippet}
        <Checkbox bind:checked={ninja} />
    </FormField>
    {#if thread?.yours}
        <FormField align="end">
            {#snippet label()}主{/snippet}
            <Checkbox disabled checked={true} />
        </FormField>
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
    {#if oekaki}
        <FormField align="end">
            <Switch bind:checked={checkedOekaki} />
            {#snippet label()}
                お絵描き機能
            {/snippet}
        </FormField>
    {/if}
    <!-- <Select
        disabled={emitting}
        key={String}
        bind:value={commandSelected}
        label="コマンド"
    >
        {#each commandOptions as v}
            <Option value={v}>{v}</Option>
        {/each}
    </Select> -->
{/snippet}

<HeaderPart {title} bind:bookmark>
    <AccessCounterPart {online} {pv} />
    <p>レス書き込み欄</p>
    <div>{@render form()}</div>
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
        <Button onclick={scrollToEnd}>見に行く</Button>
        <Button>却下</Button>
    {/snippet}
</Banner>

{#if thread?.ageRes}
    <div class="ageRes">
        <ResPart
            bind:input={contentText}
            backgroundEmbedControls={siteInfo?.id === 1601 ||
                siteInfo?.id === 1602 ||
                siteInfo?.id === 3201}
            {focus}
            ccUserId={thread?.ageRes.ccUserId}
            ccUserName={thread?.ageRes.ccUserName}
            ccUserAvatar={thread?.ageRes.ccUserAvatar}
            contentText={thread?.ageRes.contentText}
            contentUrl={thread?.ageRes.contentUrl}
            contentType={Enum.Text}
            cursor={thread?.ageRes.cursor}
            num={thread?.ageRes.num}
            isOwner={thread?.ageRes.isOwner}
            sage={thread?.ageRes.sage}
            createdAt={thread?.ageRes.createdAt}
            threadId={thread.id}
            threadTitle={thread.title}
        />
    </div>
    {#key thread?.ageRes.num}
        <BackgroundEmbedPart
            contentUrl={thread.ageRes.contentUrl}
            contentType={thread.ageRes.contentType}
        />
    {/key}
{/if}

{#if isRpgMode}
    <RpgPart {threadId} bind:dressUp />
{/if}

{#snippet paginationControls()}
    <IconButton
        class="material-icons"
        disabled={emitting || thread?.firstCursor === topCursor}
        onclick={() => {
            cursorBasedPagination({
                cursor: thread?.firstCursor,
                desc: false,
            });
        }}>first_page</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={emitting || thread?.firstCursor === topCursor}
        onclick={() =>
            cursorBasedPagination({
                cursor: topCursor,
                desc: true,
            })}>chevron_left</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={emitting}
        onclick={() => navigate(makePathname("/headline"))}>home</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={emitting || thread?.latestCursor === bottomCursor}
        onclick={() => {
            shouldScrollTo2 = true;
            cursorBasedPagination({
                cursor: bottomCursor,
                desc: false,
            });
        }}>chevron_right</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={emitting || thread?.latestCursor === bottomCursor}
        onclick={() => {
            shouldScrollTo2 = true;
            cursorBasedPagination({
                cursor: thread?.latestCursor,
                desc: true,
            });
        }}>last_page</IconButton
    >
{/snippet}

<MainPart>
    {#if thread === null}
        <p>スレ取得中…</p>
        <Paper
            color="primary"
            variant="outlined"
            style="visibility:{laaaaaaaag ? 'visible' : 'hidden'};"
        >
            <Title>まだ終わらない？</Title>
            <Subtitle>サーバーが落ちてるかも。。</Subtitle>
            <Content>ページ更新してみてね。</Content>
        </Paper>
    {/if}
    {#if thread}
        <div class="thread-header">
            <p class="thread-title">
                <TwemojiPart seed={thread.id} height="16" /><span
                    style="padding-left: 5px;">{thread.title}</span
                >
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
            <div class="lol-button-container">
                <Button class="lol" onclick={tryLoL}>草</Button>
                <span>×{lolCount}草</span>
                <span>{"ｗ".repeat(lolCount)}</span>
            </div>
        </div>
        <div>{@render paginationControls()}</div>
        <div class="res-list">
            <ResPart
                {focus}
                bind:input={contentText}
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
                threadTitle={thread.title}
            >
                <div class="unj-like-vote-container">
                    <div class="vote-buttons">
                        <Button class="good-vote" onclick={() => tryLike(true)}
                            >ｲｲ!</Button
                        >
                        <span class="good-count">+{goodVotes}</span>
                        <div class="bar">
                            <div class="good" style="width:{goodRatio}%;"></div>
                            <div class="bad" style="width:{badRatio}%;"></div>
                        </div>
                        <span class="bad-count">-{badVotes}</span>
                        <Button class="bad-vote" onclick={() => tryLike(false)}
                            >ｲｸﾅｲ!</Button
                        >
                    </div>
                </div>
            </ResPart>
            {#each thread.resList as res}
                <ResPart
                    {focus}
                    bind:input={contentText}
                    ccUserId={res.ccUserId}
                    ccUserName={res.ccUserName}
                    ccUserAvatar={res.ccUserAvatar}
                    contentText={res.contentText}
                    contentUrl={res.contentUrl}
                    contentType={res.contentType}
                    commandResult={res.commandResult}
                    cursor={res.cursor}
                    num={res.num}
                    isOwner={res.isOwner}
                    sage={res.sage}
                    createdAt={res.createdAt}
                    threadId={thread.id}
                    threadTitle={thread.title}
                >
                    {#if res.num === thread.balsResNum}
                        <BalsPart />
                    {/if}
                </ResPart>
            {/each}
        </div>
        <div
            use:visible={(visible) => {
                isAlreadyScrollEnd = visible;
            }}
        ></div>
        <div>{@render paginationControls()}</div>
        <Paper>
            <Title>レス書き込み欄</Title>
            <Subtitle>適当に書き込んでってクレメンス</Subtitle>
            <Content>{@render form(true)}</Content>
        </Paper>
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
        gap: 1rem;
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

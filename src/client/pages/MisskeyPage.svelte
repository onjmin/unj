<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { CircleArrowLeftIcon } from "@lucide/svelte";
    import { format } from "date-fns";
    import { ja } from "date-fns/locale";
    import { navigate } from "svelte-routing";
    import { Enum } from "../../common/request/content-schema.js";
    import audio from "../../common/request/whitelist/audio.js";
    import game from "../../common/request/whitelist/game.js";
    import gif from "../../common/request/whitelist/gif.js";
    import image from "../../common/request/whitelist/image.js";
    import { findIn } from "../../common/request/whitelist/site-info.js";
    import video from "../../common/request/whitelist/video.js";
    import { makePathname } from "../mylib/env.js";
    import {
        type Misskey,
        type Note,
        fetchMisskeyTimeline,
        findMisskey,
    } from "../mylib/misskey.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import EmbedPart from "../parts/EmbedPart.svelte";
    import FaviconPart from "../parts/FaviconPart.svelte";

    const INITIAL_LIMIT = 16;
    const LOAD_MORE_LIMIT = 16;

    let { misskeyId = "" } = $props();

    const misskey: Misskey | undefined = findMisskey(misskeyId);
    const hostname = misskey?.hostname ?? "";
    const title = misskey?.title ?? "";
    const api = misskey?.api ?? "";

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

    let timeline = $state<Note[]>([]);
    let isLoading = $state(false);
    let lastNoteId: string | undefined;

    async function loadTimeline(limit: number, untilId?: string) {
        if (isLoading || !api) return;

        // キャッシュを最初にチェック
        const cachedTimeline = await misskeyTimelineCache.get();
        if (cachedTimeline && !untilId) {
            timeline = cachedTimeline;
        }

        isLoading = true;
        const { promise, controller } = fetchMisskeyTimeline(
            api,
            limit,
            untilId,
        );

        try {
            const newTimeline = await promise;
            // 新しいデータを既存のデータに結合
            const updatedTimeline = untilId
                ? [...timeline, ...newTimeline]
                : newTimeline;

            // 投稿の重複を排除
            const uniqueTimeline = updatedTimeline.filter(
                (note, index, self) =>
                    index === self.findIndex((t) => t.id === note.id),
            );
            timeline = uniqueTimeline;

            if (newTimeline.length > 0) {
                lastNoteId = newTimeline[newTimeline.length - 1].id;
            }

            // キャッシュを更新
            misskeyTimelineCache.set(uniqueTimeline);
        } finally {
            isLoading = false;
            controller.abort();
        }
    }

    // ObjectStorageを初期化
    const misskeyTimelineCache = new ObjectStorage<Note[]>(
        `misskeyTimelineCache###${misskeyId}`,
    );

    $effect.root(() => {
        loadTimeline(INITIAL_LIMIT);
    });

    const handleLoadMore = () => {
        if (lastNoteId) {
            loadTimeline(LOAD_MORE_LIMIT, lastNoteId);
        }
    };

    const regexUrl = /(https?:\/\/[A-Za-z0-9\-\._~:/?#[\]@!$&'()*+,;=%]+)/gi;

    const formatText = (text: string) => {
        let formattedText = text.replace(/\n/g, "<br />");
        formattedText = formattedText.replace(
            regexUrl,
            '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline break-all">$1</a>',
        );
        return formattedText;
    };

    const findEmbeddable = (text: string): [string, number] | undefined => {
        for (const str of text.match(regexUrl) ?? []) {
            let url: URL | undefined;
            try {
                url = new URL(str);
            } catch (err) {}
            if (!url) continue;
            let _contentType = 0;
            if (findIn(gif, url.hostname) && url.href.slice(-4) === ".gif") {
                _contentType = Enum.Gif;
            } else if (findIn(image, url.hostname)) _contentType = Enum.Image;
            else if (findIn(video, url.hostname)) _contentType = Enum.Video;
            else if (findIn(audio, url.hostname)) _contentType = Enum.Audio;
            else if (findIn(game, url.hostname)) _contentType = Enum.Game;
            if (_contentType !== 0) return [url.href, _contentType];
        }
    };

    let laaaaaaaag = $state(false);
    $effect(() => {
        const id = setTimeout(() => {
            laaaaaaaag = true;
        }, 4096);
        return () => clearTimeout(id);
    });

    let isModalOpen = $state(false);
    let selectedImageUrl = $state("");

    function openModal(url: string) {
        selectedImageUrl = url;
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
        selectedImageUrl = "";
    }
</script>

<HeaderPart {title}>
    <div class="flex flex-col items-end space-y-2 text-right">
        <p class="text-xs text-gray-500">
            このページからの投稿は許可されていません
        </p>
        <p class="text-xs text-gray-500">
            投稿をしたい場合はMisskeyを開いてください。
        </p>
        <a
            href={`https://${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
        >
            <span class="text-sm font-medium">Misskeyを開く</span>
        </a>
    </div>
</HeaderPart>

<MainPart>
    {#if timeline.length === 0}
        <p>スレ取得中…</p>
        <div
            class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg shadow-md"
            class:invisible={!laaaaaaaag}
        >
            <h2 class="text-xl font-semibold">まだ終わらない？</h2>
            <h3 class="text-base mt-2">サーバーが落ちてるかも。。</h3>
            <p class="mt-4">ページ更新してみてね。</p>
        </div>
    {/if}
    {#if timeline.length > 0}
        <div class="text-left w-full max-w-[768px] mx-auto px-4 pb-4">
            <p class="flex items-center font-bold text-[#409090]">
                <FaviconPart {hostname} />
                <span class="pl-1.5">{title}</span>
            </p>
        </div>
        <div class="mx-auto my-0 w-full max-w-[768px] px-4">
            <div class="space-y-4">
                {#each timeline as note (note.id)}
                    {#if !note.isHidden && note.text !== null && note.userId !== "9tjlknm0fl"}
                        {@const embeddable = findEmbeddable(note.text ?? "")}
                        <div
                            class="bg-transparent border-[2mm] border-solid border-white border-opacity-10 p-4 rounded-lg shadow-inner"
                        >
                            <div
                                class="flex flex-wrap items-center mb-2 text-gray-500 text-sm"
                            >
                                <span> 0： </span>
                                <span class="font-bold text-[#409090]">
                                    {note.user.name ?? note.user.username}
                                </span>
                                <span>
                                    ：{format(
                                        note.createdAt,
                                        "yy/MM/dd(EEE) HH:mm:ss",
                                        {
                                            locale: ja,
                                        },
                                    )}
                                </span>
                                <span class="ml-1">
                                    ID:{note.user.username}
                                </span>
                            </div>
                            <div class="flex items-start">
                                <div class="mr-2 flex-shrink-0">
                                    <img
                                        src={note.user.avatarUrl}
                                        alt={`${note.user.username}'s avatar`}
                                        class="w-16 h-16 rounded-full"
                                    />
                                </div>

                                <div class="flex-1 min-w-0">
                                    <div
                                        class="text-gray-800 text-left overflow-wrap break-word whitespace-pre-wrap mb-2"
                                    >
                                        {@html formatText(note.text)}
                                    </div>

                                    {#if note.files && note.files.length > 0}
                                        <div
                                            class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                                        >
                                            {#each note.files as file (file.id)}
                                                <button
                                                    class="w-full h-auto rounded-lg object-cover cursor-pointer"
                                                    onclick={() =>
                                                        openModal(file.url)}
                                                    aria-label={`View enlarged version of ${file.name}`}
                                                >
                                                    <img
                                                        src={file.thumbnailUrl}
                                                        alt={file.name}
                                                        loading="lazy"
                                                    />
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}

                                    {#if embeddable}
                                        <div class="text-left">
                                            <EmbedPart
                                                ccUserAvatar={1}
                                                contentUrl={embeddable[0]}
                                                contentType={embeddable[1]}
                                            />
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>

        <div class="flex justify-center my-4">
            <button
                onclick={handleLoadMore}
                class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                disabled={isLoading}
            >
                {isLoading ? "読み込み中..." : "続きを読む"}
            </button>
        </div>

        <div
            class="flex flex-col space-y-2 p-4 bg-gray-800 text-gray-200 rounded-lg"
        >
            <button
                class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                onclick={() => navigate(makePathname("/headline"))}
            >
                <CircleArrowLeftIcon size={16} />
                <span class="text-sm font-medium">板トップに戻る</span>
            </button>

            <button
                class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                onclick={() => navigate(makePathname("/history"))}
            >
                <CircleArrowLeftIcon size={16} />
                <span class="text-sm font-medium">履歴に戻る</span>
            </button>
        </div>
    {/if}
</MainPart>

<FooterPart />

{#if isModalOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        onclick={closeModal}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        }}
        tabindex="0"
        role="button"
        aria-label="Close enlarged image"
    >
        <div class="absolute inset-0 bg-black opacity-50"></div>

        <div class="relative max-w-full max-h-full z-10">
            <img
                src={selectedImageUrl}
                alt="拡大画像"
                class="max-w-full max-h-full select-none"
            />
        </div>
    </div>
{/if}

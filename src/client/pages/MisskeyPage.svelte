<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { format } from "date-fns";
    import { ja } from "date-fns/locale";
    import type { Board } from "../../common/request/board.js";
    import { Enum, urlRegex } from "../../common/request/content-schema.js";
    import audio from "../../common/request/whitelist/audio.js";
    import game from "../../common/request/whitelist/game.js";
    import gif from "../../common/request/whitelist/gif.js";
    import image from "../../common/request/whitelist/image.js";
    import { findIn } from "../../common/request/whitelist/site-info.js";
    import sns from "../../common/request/whitelist/sns.js";
    import video from "../../common/request/whitelist/video.js";
    import {
        type Misskey,
        type Note,
        fetchMisskeyTimeline,
        findMisskey,
    } from "../mylib/misskey.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import EmbedPart from "../parts/EmbedPart.svelte";
    import FaviconPart from "../parts/emoji/FaviconPart.svelte";
    import FooterLinkPart from "../parts/FooterLinkPart.svelte";
    import ImagePreviewModal from "../parts/ImagePreviewPart.svelte";
    import KomePart from "../parts/KomePart.svelte";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";
    import HeadlinePart from "../parts/HeadlinePart.svelte";
    import CopyleftPart from "../parts/CopyleftPart.svelte";
    import PaginationControlsPart from "../parts/PaginationControlsPart.svelte";
    import { untrack } from "svelte";
    import { queryResultLimit } from "../../common/request/schema.js";

    const misskeyEmojiRegex = /:[A-Za-z0-9_]{1,32}:/g;

    let { board, misskeyId }: { board: Board; misskeyId: string } = $props();

    let misskey: Misskey | undefined = $state();
    let misskeyTimelineCache: ObjectStorage<Note[]>;

    $effect(() => {
        const key = board.key;
        const id = misskeyId;

        untrack(async () => {
            misskey = findMisskey(key, id);
            misskeyTimelineCache = new ObjectStorage<Note[]>(
                `misskeyTimelineCache###${id}`,
            );
            resetAndLoad();

            const cachedTimeline = await misskeyTimelineCache.get();
            if (cachedTimeline) {
                preloadTimeline = cachedTimeline;
            }
        });
    });

    const hostname = $derived(misskey?.hostname ?? "");
    const title = $derived(misskey?.title ?? "");

    // ---- pagination state ----
    let pageIndex = $state(0);
    let pages = $state<Note[][]>([]);
    let pageAnchors = $state<string[]>([]);
    let isLoading = $state(false);

    function resetAndLoad() {
        pageIndex = 0;
        pages = [];
        pageAnchors = [];
        loadPage(0);
    }

    const totalPages = $derived(pages.length + 1);

    const firstDisabled = $derived(isLoading || pageIndex >= pages.length);
    const prevDisabled = $derived(isLoading || pageIndex >= pages.length);
    const nextDisabled = $derived(pageIndex === 0);
    const lastDisabled = $derived(pageIndex === 0);

    const goToPage = (p: number) => {
        if (p < 0) return;
        pageIndex = p;
        loadPage(pageIndex);
    };

    const handleFirst = () => goToPage(pages.length); // 最古
    const handlePrev = () => goToPage(pageIndex + 1); // 過去へ
    const handleNext = () => goToPage(pageIndex - 1); // 新しいへ
    const handleLast = () => goToPage(0); // 最新

    function normalizeAscending(notes: Note[]) {
        return [...notes].reverse();
    }

    async function loadPage(page: number) {
        if (!misskey || isLoading) return;
        if (pages[page]) return;

        isLoading = true;

        const untilId = page > 0 ? pageAnchors[page - 1] : undefined;

        const { promise, controller } = fetchMisskeyTimeline(misskey, {
            limit: queryResultLimit,
            untilId,
        });

        try {
            const notes = await promise;
            if (notes.length === 0) return;

            pageAnchors[page] = notes[notes.length - 1].id;
            pages[page] = normalizeAscending(notes);

            misskeyTimelineCache.set(pages.flat());
        } finally {
            isLoading = false;
            controller.abort();
        }
    }

    let preloadTimeline: Note[] = $state([]);
    const timeline = $derived(pages[pageIndex] ?? []);

    // ---- text / embed helpers ----
    const formatText = (text: string) => {
        const segments: Array<{
            type: "text" | "url" | "br";
            content: string;
        }> = [];

        const lines = text.split("\n");

        for (const [lineIndex, line] of lines.entries()) {
            let lastIndex = 0;
            const matches = line.matchAll(urlRegex);

            for (const match of matches) {
                const url = match[0];
                const matchIndex = match.index ?? 0;

                if (matchIndex > lastIndex) {
                    segments.push({
                        type: "text",
                        content: line.substring(lastIndex, matchIndex),
                    });
                }

                segments.push({ type: "url", content: url });
                lastIndex = matchIndex + url.length;
            }

            if (lastIndex < line.length) {
                segments.push({
                    type: "text",
                    content: line.substring(lastIndex),
                });
            }

            if (lineIndex < lines.length - 1) {
                segments.push({ type: "br", content: "" });
            }
        }

        return segments;
    };

    const findEmbeddable = (text: string): [string, number] | undefined => {
        for (const str of text.match(urlRegex) ?? []) {
            let url: URL | undefined;
            try {
                url = new URL(str);
            } catch {}
            if (!url) continue;

            let type = 0;
            if (findIn(gif, url.hostname) && url.href.endsWith(".gif"))
                type = Enum.Gif;
            else if (findIn(image, url.hostname)) type = Enum.Image;
            else if (findIn(video, url.hostname)) type = Enum.Video;
            else if (findIn(audio, url.hostname)) type = Enum.Audio;
            else if (findIn(game, url.hostname)) type = Enum.Game;
            else if (findIn(sns, url.hostname)) type = Enum.Sns;

            if (type !== 0) return [url.href, type];
        }
    };

    let laaaaaaaag = $state(false);
    $effect(() => {
        const id = setTimeout(() => (laaaaaaaag = true), 4096);
        return () => clearTimeout(id);
    });

    let open = $state(false);
    let src = $state("");
</script>

<HeaderPart {board} {title}>
    <div class="flex flex-col items-end space-y-2 text-right">
        <p class="text-xs text-gray-500">
            このページからの投稿は許可されていません
        </p>
        <p class="text-xs text-gray-500">
            投稿をしたい場合はMisskeyを開いてください。
        </p>
        <a
            href={misskey?.channelId
                ? `https://${hostname}/channels/${misskey.channelId}`
                : `https://${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center px-4 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20"
        >
            Misskeyを開く
        </a>
    </div>
    <br />
    <KomePart online={0} room={misskeyId} />
</HeaderPart>

{#snippet paginationControls()}
    <PaginationControlsPart
        currentPage={totalPages - pageIndex}
        {totalPages}
        {firstDisabled}
        {prevDisabled}
        {nextDisabled}
        {lastDisabled}
        onClickFirst={handleFirst}
        onClickPrev={handlePrev}
        onClickNext={handleNext}
        onClickLast={handleLast}
    />
{/snippet}

<MainPart {board}>
    {@const items = timeline.length
        ? timeline
        : preloadTimeline.length
          ? preloadTimeline
          : []}
    {#if items.length === 0}
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

    {#if items.length > 0}
        <div class="px-4 pb-2 text-left">
            <p class="flex items-center font-bold text-gray-500">
                <span class="w-4 h-4"><FaviconPart {hostname} /></span>
                <span class="pl-1.5">{title}</span>
            </p>
        </div>

        {@render paginationControls()}

        <div class="mx-auto w-full px-2 text-left">
            <div>
                {#each items as note, i}
                    {#if !note.isHidden && note.text && note.userId !== "9tjlknm0fl"}
                        {@const embeddable = findEmbeddable(note.text)}
                        <div class="p-4 rounded-lg shadow-inner">
                            <div class="text-sm text-gray-500 mb-2">
                                {i +
                                    1 +
                                    (1000 -
                                        queryResultLimit * (pageIndex + 1))}:
                                <span class="font-bold text-teal-600"
                                    >風吹けば名無し</span
                                >
                                {format(
                                    note.createdAt,
                                    "yy/MM/dd(EEE) HH:mm:ss",
                                    {
                                        locale: ja,
                                    },
                                )}
                                ID:{note.user.username}
                            </div>

                            <div class="flex items-start whitespace-pre-wrap">
                                <div class="w-8"></div>
                                <div class="flex-1 min-w-0">
                                    <div
                                        class="text-left overflow-wrap break-word whitespace-pre-wrap mb-2"
                                    >
                                        {#each formatText(note.text) as seg}
                                            {#if seg.type === "url"}
                                                <a
                                                    href={seg.content}
                                                    target="_blank"
                                                    class="text-blue-500 hover:underline"
                                                >
                                                    {seg.content}
                                                </a>
                                            {:else if seg.type === "br"}
                                                <br />
                                            {:else}
                                                {seg.content.replace(
                                                    misskeyEmojiRegex,
                                                    "",
                                                )}
                                            {/if}
                                        {/each}
                                    </div>
                                </div>
                            </div>

                            {#if note.files && note.files.length > 0}
                                <div class="mt-2 flex">
                                    <!-- 左インデント -->
                                    <div class="w-8 shrink-0"></div>

                                    <!-- コンテンツ本体（必ず独立ブロック） -->
                                    <div class="flex-1 min-w-0">
                                        <div
                                            class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                                        >
                                            {#each note.files as file (file.id)}
                                                {#if file.type.startsWith("image/")}
                                                    <button
                                                        class="w-full rounded-lg object-cover cursor-pointer bg-gray-500/10 hover:bg-gray-500/20"
                                                        onclick={() => {
                                                            src = file.url;
                                                            open = true;
                                                        }}
                                                        aria-label={`View enlarged version of ${file.name}`}
                                                    >
                                                        <img
                                                            src={file.thumbnailUrl}
                                                            alt={file.name}
                                                            loading="lazy"
                                                        />
                                                    </button>
                                                {:else if file.type.startsWith("audio/")}
                                                    <div
                                                        class="w-full md:col-span-2"
                                                    >
                                                        <p
                                                            class="text-sm text-gray-500 truncate"
                                                        >
                                                            {file.name}
                                                        </p>
                                                        <audio
                                                            controls
                                                            class="w-full mt-1"
                                                        >
                                                            <source
                                                                src={file.url}
                                                                type={file.type}
                                                            />
                                                            ブラウザが音声再生に対応していません。
                                                        </audio>
                                                    </div>
                                                {:else if file.type.startsWith("video/")}
                                                    <div
                                                        class="w-full md:col-span-2"
                                                    >
                                                        <p
                                                            class="text-sm text-gray-500 truncate"
                                                        >
                                                            {file.name}
                                                        </p>
                                                        <video
                                                            controls
                                                            class="w-full mt-1 rounded-lg"
                                                            preload="metadata"
                                                        >
                                                            <source
                                                                src={file.url}
                                                                type={file.type}
                                                            />
                                                            <track
                                                                kind="captions"
                                                                srclang="ja"
                                                                label="キャプション"
                                                            />
                                                            ブラウザが動画再生に対応していません。
                                                        </video>
                                                    </div>
                                                {:else}
                                                    <div class="w-full">
                                                        <p
                                                            class="text-sm text-gray-500 truncate"
                                                        >
                                                            {file.name}
                                                        </p>
                                                        <a
                                                            href={file.url}
                                                            class="text-blue-500 hover:underline"
                                                            download={file.name}
                                                        >
                                                            ダウンロード
                                                        </a>
                                                    </div>
                                                {/if}
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            {/if}

                            {#if embeddable}
                                <div class="mt-2 flex">
                                    <!-- 左インデント -->
                                    <div class="w-8 shrink-0"></div>

                                    <!-- Embed 本体（必ずブロックとして閉じる） -->
                                    <div class="flex-1 min-w-0">
                                        <div class="block clear-both text-left">
                                            <EmbedPart
                                                ccUserAvatar={1}
                                                contentUrl={embeddable[0]}
                                                contentType={embeddable[1]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        </div>

        {@render paginationControls()}

        <FooterLinkPart {board} />
        <HeadlinePart {board} />
        <CopyleftPart />
    {/if}
</MainPart>

<FooterPart {board} />
<ImagePreviewModal bind:open bind:src />

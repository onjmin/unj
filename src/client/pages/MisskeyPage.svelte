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

    const INITIAL_LIMIT = 16;
    const LOAD_MORE_LIMIT = 16;

    let { board, misskeyId }: { board: Board; misskeyId: string } = $props();

    let misskey: Misskey | undefined;
    $effect.root(() => {
        misskey = findMisskey(board.key, misskeyId);
    });

    const hostname = $derived(misskey?.hostname ?? "");
    const title = $derived(misskey?.title ?? "");
    const api = $derived(misskey?.api ?? "");

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

    // Misskeyの過去ログの保存
    let misskeyTimelineCache: ObjectStorage<Note[]>;
    $effect.root(() => {
        misskeyTimelineCache = new ObjectStorage<Note[]>(
            `misskeyTimelineCache###${misskeyId}`,
        );
    });

    $effect.root(() => {
        loadTimeline(INITIAL_LIMIT);
    });

    const handleLoadMore = () => {
        if (lastNoteId) {
            loadTimeline(LOAD_MORE_LIMIT, lastNoteId);
        }
    };

    const formatText = (text: string) => {
        const segments: Array<{
            type: "text" | "url" | "br";
            content: string;
        }> = [];

        // 1. まず改行文字 '\n' でテキスト全体を分割
        const lines = text.split("\n");

        // for...of文を使用してlines配列を処理
        for (const [lineIndex, line] of lines.entries()) {
            let lastIndex = 0;

            // 2. 各行をさらにURLで分割
            // Array.from(line.matchAll(urlRegex)) を for...of文で使用
            const matches = line.matchAll(urlRegex);

            for (const match of matches) {
                const url = match[0];
                const matchIndex = match.index ?? 0;

                // URLより前のテキスト部分
                if (matchIndex > lastIndex) {
                    segments.push({
                        type: "text",
                        content: line.substring(lastIndex, matchIndex),
                    });
                }

                // URL部分
                segments.push({
                    type: "url",
                    content: url,
                });

                lastIndex = matchIndex + url.length;
            }

            // 最後のURLより後のテキスト部分
            if (lastIndex < line.length) {
                segments.push({
                    type: "text",
                    content: line.substring(lastIndex),
                });
            }

            // 3. 行の終わりに改行セグメントを追加 (ただし最終行は除く)
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
            } catch (err) {}
            if (!url) continue;
            let _contentType = 0;
            if (findIn(gif, url.hostname) && url.href.slice(-4) === ".gif") {
                _contentType = Enum.Gif;
            } else if (findIn(image, url.hostname)) _contentType = Enum.Image;
            else if (findIn(video, url.hostname)) _contentType = Enum.Video;
            else if (findIn(audio, url.hostname)) _contentType = Enum.Audio;
            else if (findIn(game, url.hostname)) _contentType = Enum.Game;
            else if (findIn(sns, url.hostname)) _contentType = Enum.Sns;
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
            href={`https://${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition-colors duration-200"
        >
            <span class="text-sm font-medium">Misskeyを開く</span>
        </a>
    </div>
    <br />
    <KomePart online={0} room={misskeyId} />
</HeaderPart>

<MainPart {board}>
    {#if timeline.length === 0}
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
    {#if timeline.length > 0}
        <div class="text-left w-full mx-auto px-4 pb-4">
            <p class="flex items-center font-bold unj-font text-gray-500">
                <span class="w-4 h-4">
                    <FaviconPart {hostname} />
                </span>
                <span class="pl-1.5">{title}</span>
            </p>
        </div>
        <div class="mx-auto my-0 w-full px-4">
            <div class="space-y-4">
                {#each timeline as note (note.id)}
                    <hr class="opacity-10" />
                    {#if !note.isHidden && note.text !== null && note.userId !== "9tjlknm0fl"}
                        {@const embeddable = findEmbeddable(note.text ?? "")}
                        <div class="p-4 rounded-lg shadow-inner">
                            <div
                                class="unj-font flex flex-wrap items-center mb-2 text-gray-500 text-sm"
                            >
                                <span> 0： </span>
                                <span class="font-bold text-teal-600">
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
                                <div class="mr-2 shrink-0">
                                    <img
                                        src={note.user.avatarUrl}
                                        alt={`${note.user.username}'s avatar`}
                                        class="w-16 h-16 rounded-full"
                                    />
                                </div>

                                <div class="flex-1 min-w-0">
                                    <div
                                        class="text-left overflow-wrap break-word whitespace-pre-wrap mb-2"
                                    >
                                        {#each formatText(note.text) as segment}
                                            {#if segment.type === "url"}
                                                <a
                                                    href={segment.content}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="text-blue-500 hover:underline break-all"
                                                >
                                                    {segment.content}
                                                </a>
                                            {:else if segment.type === "br"}
                                                <br />
                                            {:else}
                                                <span
                                                    class="unj-font whitespace-pre-wrap"
                                                    >{segment.content}</span
                                                >
                                            {/if}
                                        {/each}
                                    </div>

                                    {#if note.files && note.files.length > 0}
                                        <div
                                            class="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                                        >
                                            {#each note.files as file (file.id)}
                                                {#if file.type.startsWith("image/")}
                                                    <button
                                                        class="w-full h-auto rounded-lg object-cover cursor-pointer bg-gray-500/10 hover:bg-gray-500/20"
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
                                                        class="w-full"
                                                        class:sm:col-span-2={note
                                                            .files.length === 1}
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
                                                        class="w-full"
                                                        class:sm:col-span-2={note
                                                            .files.length === 1}
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
                                                                src=""
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
                class="bg-gray-500/10 hover:bg-gray-500/20 font-bold py-2 px-4 rounded"
                disabled={isLoading}
            >
                {isLoading ? "読み込み中..." : "続きを読む"}
            </button>
        </div>

        <FooterLinkPart {board} />
    {/if}
</MainPart>

<FooterPart />

<ImagePreviewModal bind:open bind:src />

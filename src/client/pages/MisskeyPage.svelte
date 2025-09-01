<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { CircleArrowLeftIcon } from "@lucide/svelte";
    import { navigate } from "svelte-routing";
    import { makePathname } from "../mylib/env.js";
    import {
        type Misskey,
        type Timeline,
        fetchMisskeyTimeline,
        findMisskey,
    } from "../mylib/misskey.js";
    import { goodbye, hello, socket } from "../mylib/socket.js";
    import AccessCounterPart from "../parts/AccessCounterPart.svelte";

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

    let timeline = $state<Timeline>([]);
    let isLoading = $state(false);
    let lastNoteId: string | undefined;

    async function loadTimeline(limit: number, untilId?: string) {
        if (isLoading || !api) return;

        isLoading = true;
        const { promise, controller } = fetchMisskeyTimeline(
            api,
            limit,
            untilId,
        );

        try {
            const newTimeline = await promise;
            timeline = untilId ? [...timeline, ...newTimeline] : newTimeline;
            if (newTimeline.length > 0) {
                lastNoteId = newTimeline[newTimeline.length - 1].id;
            }
        } finally {
            isLoading = false;
            controller.abort();
        }
    }

    $effect.root(() => {
        loadTimeline(INITIAL_LIMIT);
    });

    const handleLoadMore = () => {
        if (lastNoteId) {
            loadTimeline(LOAD_MORE_LIMIT, lastNoteId);
        }
    };

    function formatText(text: string | null) {
        if (!text) return "";
        return text.replace(/\n/g, "<br />");
    }

    $effect(() => {
        hello(() => {
            socket.emit("joinThread", {
                threadId: misskeyId,
            });
        });
        socket.on("joinThread", handleJoinThread);
        return () => {
            goodbye();
            socket.off("joinThread", handleJoinThread);
        };
    });
</script>

<HeaderPart {title}>
    <AccessCounterPart {online} {pv} />
</HeaderPart>

<MainPart>
    <div class="mx-auto my-0 w-full max-w-[768px] px-4">
        <div class="space-y-4">
            {#each timeline as note (note.id)}
                <div
                    class="bg-transparent border-2 border-solid border-gray-400 p-4 rounded-lg shadow-inner"
                >
                    <div class="flex items-center mb-2 text-sm text-gray-800">
                        <span class="font-bold text-[#409090]">
                            {note.user.name ?? note.user.username}
                        </span>
                        <span class="ml-2 text-gray-500">
                            {new Date(note.createdAt).toLocaleString()}
                        </span>
                        <span class="ml-auto text-gray-500">
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
                                        <img
                                            src={file.thumbnailUrl}
                                            alt={file.name}
                                            class="w-full h-auto rounded-lg object-cover"
                                            loading="lazy"
                                        />
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    {#if timeline.length > 0}
        <div class="flex justify-center my-4">
            <button
                onclick={handleLoadMore}
                class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                disabled={isLoading}
            >
                {isLoading ? "読み込み中..." : "続きを読む"}
            </button>
        </div>
    {/if}

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
</MainPart>

<FooterPart />

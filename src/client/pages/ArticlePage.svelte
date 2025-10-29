<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import {
        ChevronFirstIcon,
        ChevronLastIcon,
        ChevronLeftIcon,
        ChevronRightIcon,
        ChevronsLeftRightEllipsisIcon,
        CircleArrowLeftIcon,
    } from "@lucide/svelte";
    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import { navigate } from "svelte-routing";
    import type { Board } from "../../common/request/board.js";
    import {
        type BloggerItem,
        formatDate,
        label2icon,
    } from "../mylib/blogger.js";
    import { decodeEnv, makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";

    let { board, newsId }: { board: Board; newsId: string } = $props();

    const VITE_BLOGGER_BLOG_ID = decodeEnv(
        import.meta.env.VITE_BLOGGER_BLOG_ID,
    );
    const VITE_BLOGGER_API_KEY = decodeEnv(
        import.meta.env.VITE_BLOGGER_API_KEY,
    );

    let items: BloggerItem[] | null = $state(null);
    const cache = new ObjectStorage<BloggerItem[]>("newsCache");
    $effect(() => {
        cache.get().then((v) => {
            if (v && !items) {
                items = v.reverse();
                updatePagination();
            }
        });
    });

    let first: string | null = $state(null);
    let prev: string | null = $state(null);
    let next: string | null = $state(null);
    let last: string | null = $state(null);
    const updatePagination = () => {
        if (!items) return;
        const lastIdx = items.length - 1;
        const idx = items.map((v) => v.id).indexOf(newsId);
        if (idx === -1) return;
        const a = idx !== 0;
        first = !a ? null : items[0].id;
        prev = !a ? null : items[idx - 1].id;
        const b = idx !== lastIdx;
        next = !b ? null : items[idx + 1].id;
        last = !b ? null : items[lastIdx].id;
    };

    let item: BloggerItem | null = $state(null);
    let title = $state("ニュース取得中");
    let error = $state(false);
    $effect(() => {
        const _newsId = newsId;
        const cache = new ObjectStorage<BloggerItem>(
            `articleCache###${newsId}`,
        );
        cache.get().then((v) => {
            if (v) {
                if (_newsId !== newsId) return;
                item = v;
                title = item?.title ?? "ニュース取得失敗";
                updatePagination();
            }
        });
        (async () => {
            try {
                const res = await fetch(
                    `https://www.googleapis.com/blogger/v3/blogs/${VITE_BLOGGER_BLOG_ID}/posts/${newsId}?key=${VITE_BLOGGER_API_KEY}&fields=id,title,published,labels,content`,
                ).then((response) => response.json());
                if (_newsId !== newsId) return;
                item = res;
                title = item?.title ?? "ニュース取得失敗";
                updatePagination();
                cache.set(item);
            } catch (err) {
                error = true;
            }
        })();
    });

    let laaaaaaaag = $state(false);
    $effect(() => {
        const id = setTimeout(() => {
            laaaaaaaag = true;
        }, 4096);
        return () => clearTimeout(id);
    });
</script>

<HeaderPart {board} {title} />

{#snippet paginationControls()}
    <div class="flex justify-center items-center space-x-2">
        <!-- First Page -->
        <button
            class="p-2 rounded bg-gray-600 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={first === null}
            onclick={() =>
                navigate(makePathname(`/${board.key}/news/${first}`))}
        >
            <ChevronFirstIcon class="w-5 h-5" />
        </button>

        <!-- Prev -->
        <button
            class="p-2 rounded bg-gray-600 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={prev === null}
            onclick={() => navigate(makePathname(`/${board.key}/news/${prev}`))}
        >
            <ChevronLeftIcon class="w-5 h-5" />
        </button>

        <!-- Checkbox Outline (Disabled) -->
        <button class="bg-gray-600 text-gray-200 p-2 rounded" disabled>
            <ChevronsLeftRightEllipsisIcon class="w-5 h-5" />
        </button>

        <!-- Next -->
        <button
            class="p-2 rounded bg-gray-600 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={next === null}
            onclick={() => navigate(makePathname(`/${board.key}/news/${next}`))}
        >
            <ChevronRightIcon class="w-5 h-5" />
        </button>

        <!-- Last Page -->
        <button
            class="p-2 rounded bg-gray-600 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={last === null}
            onclick={() => navigate(makePathname(`/${board.key}/news/${last}`))}
        >
            <ChevronLastIcon class="w-5 h-5" />
        </button>
    </div>
{/snippet}

<MainPart {board}>
    {#if error}
        <div
            class="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg shadow-md"
        >
            <h2 class="text-xl font-semibold">エラー発生</h2>
            <h3 class="text-base mt-2">ニュース取得失敗。。</h3>
            <p class="mt-4">管理人に言ったら直してくれるかも。</p>
        </div>
    {:else if item === null}
        <p>ニュース取得中…</p>
        <div
            class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg shadow-md"
            class:invisible={!laaaaaaaag}
        >
            <h2 class="text-xl font-semibold">まだ終わらない？</h2>
            <h3 class="text-base mt-2">サーバーが落ちてるかも。。</h3>
            <p class="mt-4">ページ更新してみてね。</p>
        </div>
    {:else if item}
        <h1
            class="text-left text-2xl text-gray-500 font-bold mb-2 mx-auto w-full max-w-3xl px-4 break-words whitespace-normal"
        >
            {item.title}
        </h1>
        <p
            class="text-left text-sm mb-4 mx-auto w-full max-w-3xl px-4 break-words whitespace-normal"
        >
            公開日：{formatDate(item.published)}
        </p>
        <h1
            class="text-left mx-auto w-full max-w-3xl px-4 break-words whitespace-normal"
        >
            <ChipSet chips={item.labels} nonInteractive>
                {#snippet chip(chip: string)}
                    <Chip {chip}>
                        {#if label2icon.has(chip)}
                            <LeadingIcon class="material-icons"
                                >{label2icon.get(chip)}</LeadingIcon
                            >
                        {/if}
                        <Text tabindex={0}>{chip}</Text>
                    </Chip>
                {/snippet}
            </ChipSet>
        </h1>

        <div
            class="bg-gray-800 rounded-lg mx-auto w-full max-w-3xl px-4 mb-4 p-2"
        >
            {@render paginationControls()}
        </div>

        <div class="flex justify-center">
            <div
                class="text-left w-full max-w-3xl px-4 break-words whitespace-normal"
            >
                {@html item.content}
            </div>
        </div>

        <div
            class="bg-gray-800 rounded-lg mx-auto w-full max-w-3xl px-4 mt-4 p-2"
        >
            {@render paginationControls()}
        </div>

        <div
            class="flex flex-col space-y-2 p-4 bg-gray-800 text-gray-200 rounded-lg mx-auto w-full max-w-3xl px-4 mt-4"
        >
            <button
                class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                onclick={() => navigate(makePathname(`/${board.key}/news`))}
            >
                <CircleArrowLeftIcon size={16} />
                <span class="text-sm font-medium">ニュース一覧に戻る</span>
            </button>
        </div>
    {/if}
</MainPart>

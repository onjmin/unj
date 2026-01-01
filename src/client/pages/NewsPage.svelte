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
    } from "@lucide/svelte";
    import { navigate } from "svelte-routing";
    import type { Board } from "../../common/request/board.js";
    import {
        type BloggerItem,
        formatDate,
        getLabelIconComponent,
    } from "../mylib/blogger.js";
    import { decodeEnv, makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import FooterLinkPart from "../parts/FooterLinkPart.svelte";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";

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
        const cache = new ObjectStorage<BloggerItem>(`newsCache###${newsId}`);
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
        <MessageBoxPart
            title="エラー発生"
            description={[
                "ニュース取得失敗。。",
                "管理人に言ったら直してくれるかも。",
            ]}
        />
    {:else if item === null}
        <p>ニュース取得中…</p>
        {#if laaaaaaaag}
            <MessageBoxPart
                title="まだ終わらない？"
                description={[
                    "サーバーが落ちてるかも。。",
                    "ページ更新してみてね。",
                ]}
            />
        {/if}
    {:else if item}
        <h1
            class="text-base text-left opacity-60 font-bold mb-2 mx-auto w-full max-w-3xl px-4 wrap-break-words whitespace-normal"
        >
            {item.title}
        </h1>
        <p
            class="text-left text-sm mb-4 mx-auto w-full max-w-3xl px-4 wrap-break-words whitespace-normal"
        >
            公開日：{formatDate(item.published)}
        </p>
        <h1
            class="text-left my-2 mx-auto w-full max-w-3xl px-4 wrap-break-words whitespace-normal"
        >
            {#if item.labels?.length}
                {@const chip = item.labels.at(0) ?? ""}
                {@const IconComponent = getLabelIconComponent(chip)}

                <span
                    class="inline-flex items-center h-5 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-500/10 bg-gray-100/10 whitespace-nowrap"
                    title={chip}
                >
                    {#if IconComponent}
                        <IconComponent
                            size={12}
                            class="mr-1 text-gray-500 shrink-0"
                        />
                    {/if}
                    <span class="text-sm">
                        {chip}
                    </span>
                </span>
            {/if}
        </h1>

        <div
            class="bg-gray-800 rounded-lg mx-auto w-full max-w-3xl px-4 mb-4 p-2"
        >
            {@render paginationControls()}
        </div>

        <div class="flex justify-center">
            <div
                class="text-left w-full max-w-3xl px-4 wrap-break-words whitespace-normal"
            >
                {@html item.content}
            </div>
        </div>

        <div
            class="bg-gray-800 rounded-lg mx-auto w-full max-w-3xl px-4 mt-4 p-2"
        >
            {@render paginationControls()}
        </div>

        <FooterLinkPart {board} />
    {/if}
</MainPart>

<FooterPart />

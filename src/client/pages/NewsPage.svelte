<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { navigate } from "svelte-routing";
    import type { Board } from "../../common/request/board.js";
    import {
        type BloggerItem,
        formatDateYMDVerbose,
        getLabelIconComponent,
    } from "../mylib/blogger.js";
    import { decodeEnv, makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import FooterLinkPart from "../parts/FooterLinkPart.svelte";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";
    import HeadlinePart from "../parts/HeadlinePart.svelte";
    import CopyleftPart from "../parts/CopyleftPart.svelte";
    import PaginationControlsPart from "../parts/PaginationControlsPart.svelte";

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
    let index = $state(0);
    const updatePagination = () => {
        if (!items) return;
        const lastIdx = items.length - 1;
        const idx = items.map((v) => v.id).indexOf(newsId);
        if (idx === -1) return;
        index = idx + 1;
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
    <PaginationControlsPart
        currentPage={index}
        totalPages={items?.length ?? 0}
        firstDisabled={first === null}
        prevDisabled={prev === null}
        nextDisabled={next === null}
        lastDisabled={last === null}
        onClickFirst={() =>
            first !== null &&
            navigate(makePathname(`/${board.key}/news/${first}`))}
        onClickPrev={() =>
            prev !== null &&
            navigate(makePathname(`/${board.key}/news/${prev}`))}
        onClickNext={() =>
            next !== null &&
            navigate(makePathname(`/${board.key}/news/${next}`))}
        onClickLast={() =>
            last !== null &&
            navigate(makePathname(`/${board.key}/news/${last}`))}
    />
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
            公開日：{formatDateYMDVerbose(item.published)}
        </p>
        <h1
            class="text-left my-2 mx-auto w-full max-w-3xl px-4 h-7 flex items-center wrap-break-words whitespace-normal"
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
                            class="mr-1 shrink-0 text-gray-500"
                        />
                    {/if}
                    <span class="text-sm">{chip}</span>
                </span>
            {/if}
        </h1>
        {@render paginationControls()}
        <div class="flex justify-center">
            <div
                class="text-left w-full max-w-3xl px-4 wrap-break-words whitespace-normal"
            >
                {@html item.content}
            </div>
        </div>
        {@render paginationControls()}
        <FooterLinkPart {board} />
        <HeadlinePart {board} />
        <CopyleftPart />
    {/if}
</MainPart>

<FooterPart {board} />

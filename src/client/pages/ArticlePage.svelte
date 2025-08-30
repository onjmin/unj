<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import IconButton from "@smui/icon-button";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import { navigate } from "svelte-routing";
    import {
        type BloggerItem,
        formatDate,
        label2icon,
    } from "../mylib/blogger.js";
    import { decodeEnv, makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";

    let { newsId = "" } = $props();

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

<HeaderPart {title} />

{#snippet paginationControls()}
    <IconButton
        class="material-icons"
        disabled={first === null}
        onclick={() => navigate(makePathname(`/news/${first}`))}
        >first_page</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={prev === null}
        onclick={() => navigate(makePathname(`/news/${prev}`))}
        >chevron_left</IconButton
    >
    <IconButton
        class="material-icons"
        onclick={() => navigate(makePathname("/news"))}>home</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={next === null}
        onclick={() => navigate(makePathname(`/news/${next}`))}
        >chevron_right</IconButton
    >
    <IconButton
        class="material-icons"
        disabled={last === null}
        onclick={() => navigate(makePathname(`/news/${last}`))}
        >last_page</IconButton
    >
{/snippet}

<MainPart>
    {#if error}
        <Paper color="primary" variant="outlined">
            <Title>エラー発生</Title>
            <Subtitle>ニュース取得失敗。。</Subtitle>
            <Content>管理人に言ったら直してくれるかも。</Content>
        </Paper>
    {:else if item === null}
        <p>ニュース取得中…</p>
        <Paper
            color="primary"
            variant="outlined"
            style="visibility:{laaaaaaaag ? 'visible' : 'hidden'};"
        >
            <Title>まだ終わらない？</Title>
            <Subtitle>サーバーが落ちてるかも。。</Subtitle>
            <Content>ページ更新してみてね。</Content>
        </Paper>
    {:else if item}
        <h1 class="left title">{item.title}</h1>
        <p class="left date">公開日：{formatDate(item.published)}</p>
        <h1 class="left labels">
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
        <div class="bg-gray-800 dark:bg-gray-200">
            {@render paginationControls()}
        </div>
        <div class="left content">
            {@html item.content}
        </div>
        <div class="bg-gray-800 dark:bg-gray-200">
            {@render paginationControls()}
        </div>
    {/if}
</MainPart>

<FooterPart />

<style>
    .left {
        text-align: left;
        inline-size: 768px;
        max-width: 90svw;
        word-break: break-word;
        overflow-wrap: break-word;
        white-space: normal;
    }
    .title {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
    .date {
        font-size: 0.875rem;
        color: gray;
        margin-bottom: 1rem;
    }
</style>

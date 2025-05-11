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

    let item: BloggerItem | null = $state(null);
    const cache = new ObjectStorage<BloggerItem>(`articleCache###${newsId}`);
    $effect(() => {
        cache.get().then((v) => {
            if (v && !item) {
                item = v;
                title = item?.title ?? "ニュース取得失敗";
            }
        });
    });

    let error = $state(false);
    let title = $state("ニュース取得中");
    $effect(() => {
        (async () => {
            try {
                const res = await fetch(
                    `https://www.googleapis.com/blogger/v3/blogs/${VITE_BLOGGER_BLOG_ID}/posts/${newsId}?key=${VITE_BLOGGER_API_KEY}&fields=id,title,published,labels,content`,
                ).then((response) => response.json());
                item = res;
                title = item?.title ?? "ニュース取得失敗";
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
    <IconButton class="material-icons" disabled={true}>first_page</IconButton>
    <IconButton class="material-icons" disabled={true}>chevron_left</IconButton>
    <IconButton
        class="material-icons"
        onclick={() => navigate(makePathname("/news"))}>home</IconButton
    >
    <IconButton class="material-icons" disabled={true}>chevron_right</IconButton
    >
    <IconButton class="material-icons" disabled={true}>last_page</IconButton>
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
        <div class="pagination">
            {@render paginationControls()}
        </div>
        <div class="left content">
            {@html item.content}
        </div>
        <div class="pagination">
            {@render paginationControls()}
        </div>
    {/if}
</MainPart>

<FooterPart />

<style>
    .left {
        text-align: left;
        inline-size: 768px;
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
    .pagination {
        text-align: center;
        margin: 1rem 0;
    }
</style>

<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import List, { Item, Separator } from "@smui/list";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import { Link } from "svelte-routing";
    import {
        type BloggerItem,
        formatDate,
        label2icon,
    } from "../mylib/blogger.js";
    import { decodeEnv, makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";

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
            if (v && !items) items = v;
        });
    });

    let error = $state(false);
    $effect(() => {
        (async () => {
            try {
                const res = await fetch(
                    `https://www.googleapis.com/blogger/v3/blogs/${VITE_BLOGGER_BLOG_ID}/posts?key=${VITE_BLOGGER_API_KEY}&fields=items(id,title,published,labels)`,
                ).then((response) => response.json());
                items = res.items;
                cache.set(items);
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

<HeaderPart title="ニュース" />

<MainPart>
    {#if error}
        <Paper color="primary" variant="outlined">
            <Title>エラー発生</Title>
            <Subtitle>ニュース取得失敗。。</Subtitle>
            <Content>管理人に言ったら直してくれるかも。</Content>
        </Paper>
    {:else if items === null}
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
    {:else if items}
        <List class="demo-list" nonInteractive>
            {#each items as item, i}
                <Item disabled>
                    <div class="date">{formatDate(item.published)}</div>
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
                    <div>
                        <Link to={makePathname(`/news/${item.id}`)}
                            >{item.title}</Link
                        >
                    </div>
                </Item>
                {#if i % 4 === 3 && i !== items.length - 1}
                    <Separator />
                {/if}
            {/each}
        </List>
    {/if}
</MainPart>

<FooterPart />

<style>
    .date {
        font-size: 0.875rem;
        color: gray;
    }
</style>

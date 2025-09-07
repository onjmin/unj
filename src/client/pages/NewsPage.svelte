<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import List, { Item, Separator } from "@smui/list";
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
        <div
            class="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg shadow-md"
        >
            <h2 class="text-xl font-semibold">エラー発生</h2>
            <h3 class="text-base mt-2">ニュース取得失敗。。</h3>
            <p class="mt-4">管理人に言ったら直してくれるかも。</p>
        </div>
    {:else if items === null}
        <p>ニュース取得中…</p>
        <div
            class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg shadow-md"
            class:invisible={!laaaaaaaag}
        >
            <h2 class="text-xl font-semibold">まだ終わらない？</h2>
            <h3 class="text-base mt-2">サーバーが落ちてるかも。。</h3>
            <p class="mt-4">ページ更新してみてね。</p>
        </div>
    {:else if items}
        <List class="demo-list" nonInteractive>
            {#each items as item, i}
                <Item disabled>
                    <div class="date">{formatDate(item.published)}</div>
                    <div class="hidden md:flex">
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
                    </div>
                    <div class="news-link text-left">
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
        flex: 0 0 auto; /* 幅固定（縮まない） */
        font-size: 0.85rem;
        color: #666;
    }

    .news-link {
        flex: 1 1 auto;
        overflow: hidden;
        text-overflow: ellipsis; /* タイトルが長いとき「…」に */
        white-space: nowrap;
    }
</style>

<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Chip, { Set as ChipSet, LeadingIcon, Text } from "@smui/chips";
    import List, { Item, Separator } from "@smui/list";
    import { Link } from "svelte-routing";
    import type { Board } from "../../common/request/board.js";
    import {
        type BloggerItem,
        formatDate,
        label2icon,
    } from "../mylib/blogger.js";
    import { decodeEnv, makePathname } from "../mylib/env.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";

    let { board }: { board: Board } = $props();

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

<HeaderPart {board} title="ニュース" />

<MainPart {board}>
    {#if error}
        <MessageBoxPart
            title="エラー発生"
            description={[
                "ニュース取得失敗。。",
                "管理人に言ったら直してくれるかも。",
            ]}
        />
    {:else if items === null}
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
    {:else if items}
        <div
            class="w-full max-w-3xl mx-auto rounded-md overflow-hidden bg-gray-100/10"
        >
            <List class="demo-list" nonInteractive>
                {#each items as item, i}
                    <Item disabled class="p-0">
                        <div
                            class="flex items-center p-3 sm:p-4 hover:bg-gray-100/20 transition-colors"
                        >
                            <div
                                class="flex-shrink-0 text-xs sm:text-sm text-gray-500 mr-4 w-20 sm:w-24"
                            >
                                {formatDate(item.published)}
                            </div>
                            <div class="hidden md:flex flex-shrink-0 mr-4">
                                <ChipSet chips={item.labels} nonInteractive>
                                    {#snippet chip(chip: string)}
                                        <Chip {chip}>
                                            {#if label2icon.has(chip)}
                                                <LeadingIcon
                                                    class="material-icons"
                                                    >{label2icon.get(
                                                        chip,
                                                    )}</LeadingIcon
                                                >
                                            {/if}
                                            <Text tabindex={0}>{chip}</Text>
                                        </Chip>
                                    {/snippet}
                                </ChipSet>
                            </div>
                            <div
                                class="flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-left"
                            >
                                <Link
                                    to={makePathname(
                                        `/${board.key}/news/${item.id}`,
                                    )}
                                    class="block truncate">{item.title}</Link
                                >
                            </div>
                        </div>
                    </Item>
                    {#if i % 4 === 3 && i !== items.length - 1}
                        <Separator class="border-t border-gray-300 my-1" />
                    {/if}
                {/each}
            </List>
        </div>
    {/if}
</MainPart>

<FooterPart />

<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import type { Board } from "../../common/request/board.js";
    import { externalLinkGroups } from "../mylib/links.js";

    import { Music, Server, Link, Globe, Sprout } from "@lucide/svelte";

    const getFaviconUrl = (src: string) => {
        const hostname = new URL(src).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}`;
    };
    import CustomEmojiPart from "../parts/emoji/CustomEmojiPart.svelte";
    import CopyleftPart from "../parts/CopyleftPart.svelte";

    let { board }: { board: Board } = $props();

    const sections = externalLinkGroups.map((group, index) => ({
        title: group.title,
        items: group.links,
        icon: [null, Sprout, Music, Server, Link, Globe][index],
    }));
</script>

<HeaderPart {board} title="リンク集" />

<MainPart {board}>
    <p>おんJ発の掲示板・文化・派生サイト集です。</p>
    <p>暇なときにでも、ふらっと立ち寄ってみてください。</p>

    <div class="space-y-8 max-w-lg mx-auto">
        {#each sections as section}
            {@const Icon = section.icon}

            <section>
                <h2 class="flex items-center gap-2 text-sm font-semibold mb-3">
                    {#if Icon}
                        <Icon size={16} class="opacity-70" />
                    {:else}
                        <CustomEmojiPart
                            size="16"
                            emoji={"1451476135584989416"}
                        />
                    {/if}
                    {section.title}
                </h2>

                <ul
                    class="rounded-lg shadow-md divide-y divide-gray-500/20 border border-gray-500/10"
                >
                    {#each section.items as site}
                        <li class="p-2">
                            <div class="flex items-start gap-3">
                                <!-- 1行目：favicon + title -->
                                <div
                                    class="flex items-center gap-2 min-w-0 w-full"
                                >
                                    <div
                                        class="w-3 h-3 rounded-sm bg-cover bg-center shrink-0"
                                        style="background-image: url({getFaviconUrl(
                                            site.src,
                                        )});"
                                    ></div>
                                    <a
                                        href={site.src}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="block min-w-0 text-sm font-medium text-gray-500 truncate hover:underline"
                                    >
                                        {site.name}
                                    </a>
                                </div>
                            </div>

                            <!-- 2行目：description（全幅） -->
                            <p
                                class="mt-1 text-sm opacity-60 truncate text-left"
                            >
                                {site.description}
                            </p>
                        </li>
                    {/each}
                </ul>
            </section>
        {/each}
    </div>
    <CopyleftPart />
</MainPart>

<FooterPart {board} />

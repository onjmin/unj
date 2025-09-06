<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { topIllusts } from "../mylib/top-illusts.js";
</script>

<HeaderPart title="TOP絵集" />

<MainPart>
    <div class="space-y-4">
        <p class="mb-4">
            当サイト「うんｊ」のトップページで使用している各イラストは、複数の絵師による合同制作作品です。
        </p>
        <p class="mb-6">
            なお、絵師の方々からの正式な許可は得ておりませんので、ご苦情をいただいた場合には速やかに差し替えさせていただきます。
        </p>
    </div>

    <div class="container mx-auto grid grid-cols-1 gap-8">
        {#each topIllusts as topIllust, i}
            <div class="col-span-12 space-y-2">
                <a
                    href={topIllust.src}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        class="w-full h-auto rounded-lg shadow-lg"
                        alt="TOP絵"
                        src={topIllust.src}
                    />
                </a>
                <div class="text-sm text-gray-700 break-words">
                    図{i + 1}
                    {topIllust.label}
                </div>
                <a
                    class="text-sm text-blue-600 hover:underline break-words block"
                    href={topIllust.href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {topIllust.href}
                </a>
            </div>
        {/each}
    </div>
</MainPart>

<FooterPart />

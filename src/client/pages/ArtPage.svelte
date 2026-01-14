<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import type { Board } from "../../common/request/board.js";
    import { topIllusts } from "../mylib/top-illusts.js";
    import ImagePreviewModal from "../parts/ImagePreviewPart.svelte";

    let { board }: { board: Board } = $props();

    let open = $state(false);
    let src = $state("");
</script>

<HeaderPart {board} title="TOP絵集" />

<MainPart {board}>
    <div>
        <p>
            当サイト「うんｊ」のトップページで使用している各イラストは、複数の絵師による合同制作作品です。
        </p>
        <p>
            なお、絵師の方々からの正式な許可は得ておりませんので、ご苦情をいただいた場合には速やかに差し替えさせていただきます。
        </p>
    </div>

    <div class="container mx-auto grid grid-cols-1 gap-8">
        {#each topIllusts as topIllust, i}
            <div class="col-span-12 space-y-2">
                <button
                    onclick={() => {
                        src = topIllust.src;
                        open = true;
                    }}
                >
                    <img class="unj-img" alt="TOP絵" src={topIllust.src} />
                </button>
                <div class="wrap-break-words">
                    図{i + 1}
                    {topIllust.label}
                </div>
                <div class="mb-0.5 wrap-anywhere">
                    <a
                        href={topIllust.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="cursor-pointer"
                    >
                        {topIllust.href}
                    </a>
                </div>
            </div>
        {/each}
    </div>
</MainPart>

<FooterPart {board} />

<ImagePreviewModal bind:open bind:src />

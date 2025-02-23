<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import { topIllusts } from "../mylib/top-illust.js";
</script>

<HeaderPart title="TOP絵集" />

<MainPart>
    <p>うんｊのTOP絵に使わせて頂いているイラスト一覧です。</p>
    <p>絵師に許可を取った訳ではないので苦情を受ければ差し替えます。</p>
    <LayoutGrid>
        {#each topIllusts as topIllust, i}
            <Cell span={12}>
                <a
                    href={topIllust.src}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img class="unj-img" alt="TOP絵" src={topIllust.src} />
                </a>
                <div class="unj-img-label">図{i + 1} {topIllust.label}</div>
                <a
                    class="unj-img-href"
                    href={topIllust.href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {topIllust.href}
                </a>
            </Cell>
        {/each}
    </LayoutGrid>
</MainPart>

<FooterPart />

<style>
    .unj-img-label,
    .unj-img-href {
        white-space: normal;
        word-wrap: break-word;
        display: block;
    }
</style>

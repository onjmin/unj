<script lang="ts">
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    import TermsPart from "../parts/TermsPart.svelte";
</script>

<HeaderPart title="うんｊ利用規約" />

<MainPart>
    <div class="unj-terms">
        <TermsPart />
    </div>
</MainPart>

<FooterPart />

<style>
    :global(.unj-terms pre) {
        text-align: left;
        overflow: scroll;
        height: calc(
            100vh - var(--top-margin) - var(--bottom-margin) - var(--any-margin) *
                4
        );
    }
</style>

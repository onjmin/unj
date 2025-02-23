<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

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
    }
</style>

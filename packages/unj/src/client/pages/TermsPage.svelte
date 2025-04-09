<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Accordion, { Panel, Header, Content } from "@smui-extra/accordion";
    import { faq } from "../mylib/faq.js";
    import TermsPart from "../parts/TermsPart.svelte";
</script>

<HeaderPart title="うんｊ利用規約">
    <p>よくある質問</p>
    <div class="accordion-container">
        <Accordion>
            {#each faq as [q, a]}
                <Panel>
                    <Header>{q}</Header>
                    <Content>{a}</Content>
                </Panel>
            {/each}
        </Accordion>
    </div></HeaderPart
>

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

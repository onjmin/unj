<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Button from "@smui/button";
    import ContentPart from "../parts/ContentPart.svelte";

    let { threadId = "", resNum = "" } = $props();

    let content = $state("");
    let content_url = $state("");
    let content_type = $state(1);
</script>

<HeaderPart
    title="【速報】みのもんたの家に侵入者。犯人は逃走中"
    bookmark={true}
>
    <p>スレ書き込みUI</p>
    <ContentPart bind:content bind:content_url bind:content_type />
    <Button onclick={() => alert("まだない")} variant="raised">投稿する</Button>
</HeaderPart>

<MainPart>
    <p>【速報】みのもんたの家に侵入者。犯人は逃走中</p>
</MainPart>

<FooterPart />

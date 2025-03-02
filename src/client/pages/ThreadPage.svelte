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

    let bookmark = $state(false); // idbから取得する
</script>

<HeaderPart title="令和生まれの87%がもはや淫夢を知らない模様" bind:bookmark>
    <p>スレ書き込みUI</p>
    <ContentPart bind:content bind:content_url bind:content_type />
    <Button onclick={() => alert("まだない")} variant="raised">投稿する</Button>
</HeaderPart>

<MainPart>
    <p>令和生まれの87%がもはや淫夢を知らない模様</p>
    <p>草×</p>
</MainPart>

<FooterPart />

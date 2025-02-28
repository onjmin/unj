<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    let { threadId = "", resNum = "" } = $props();
</script>

<HeaderPart title="ダミーのスレタイ" bookmark={true}>
    <p>スレ書き込みUI</p>
</HeaderPart>

<MainPart>
    <p>UNDER CONSTRUCTION</p>
</MainPart>

<FooterPart />

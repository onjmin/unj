<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import PaintPart from "../parts/PaintPart.svelte";
</script>

<HeaderPart menu={false} title="実験用" />

<MainPart menu={false}>
    <p>実験用</p>
    <PaintPart threadId="test" />
</MainPart>

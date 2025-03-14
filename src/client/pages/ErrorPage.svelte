<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import Paper, { Title, Content, Subtitle } from "@smui/paper";
    import { errorReason } from "../mylib/socket.js";
</script>

<HeaderPart menu={false} title="エラーデス！！" />

<MainPart menu={false}>
    <p>ここで何か起こっているようだ</p>
    {#if errorReason === "multipleConnections"}
        <Paper color="primary" variant="outlined">
            <Title>不自然な操作を感知しました。</Title>
            <Subtitle>うんｊは同じIPからの多窓を禁止しています。。</Subtitle>
            <Content>まずはこのタブを閉じようね。</Content>
        </Paper>
    {:else if errorReason === "newUserRateLimit"}
        <Paper color="primary" variant="outlined">
            <Title>不自然な操作を感知しました。</Title>
            <Subtitle>新人さん接続規制中。。</Subtitle>
            <Content>しばらくしてからページ更新してみてね。</Content>
        </Paper>
    {/if}
    <div class="iframe-container">
        <iframe title="error" src="https://image.open2ch.net/page/error/mogura/"
        ></iframe>
    </div>
</MainPart>

<FooterPart />

<style>
    .iframe-container {
        width: 96vw;
        height: 76vh;
        overflow: hidden;
        margin: 0;
        padding-top: 16px;
    }
    .iframe-container iframe {
        border: none;
        width: 100%;
        height: 100%;
    }
</style>

<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { errorReason } from "../mylib/socket.js";
    import MessageBoxPart from "../parts/MessageBoxPart.svelte";
</script>

<HeaderPart menu={false} title="エラーデス！！" />

<MainPart menu={false}>
    <p>ここで何か起こっているようだ</p>
    {#if errorReason === "denied"}
        <MessageBoxPart
            title="アクセス制限中です"
            description={[
                "現在、サーバーは攻撃遮断モードになっています。",
                "少し時間を置いてから再度アクセスしてください。",
            ]}
        />
    {:else if errorReason === "multipleConnectionsLimit"}
        <MessageBoxPart
            title="複数タブの個数上限です。"
            description={[
                "うんｊは同じIPからの複数タブを制限しています。。",
                "まずはこのタブを閉じようね。",
            ]}
        />
    {:else if errorReason === "newUsersRateLimit"}
        <MessageBoxPart
            title="不自然な操作を感知しました。"
            description={[
                "新人さん接続規制中。。",
                "しばらくしてからリロードしてみてね。",
            ]}
        />
    {:else if errorReason === "grantFailed"}
        <MessageBoxPart
            title="致命的なエラーが発生しました。"
            description={[
                "認証情報に不整合が起きています。",
                "リロードしても直らないので管理人に復旧依頼をお願いします。",
            ]}
        />
    {/if}
    <div class="iframe-container">
        <iframe title="error" src="https://dma-cmyk.github.io/BabyWhacker/"
        ></iframe>
    </div>
</MainPart>

<FooterPart menu={false} />

<style>
    .iframe-container {
        width: 96svw;
        height: 96svh;
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

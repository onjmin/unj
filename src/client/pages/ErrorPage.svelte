<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { makePathname } from "../mylib/env.js";
    import { errorReason } from "../mylib/socket.js";
</script>

<HeaderPart menu={false} title="エラーデス！！" />

<MainPart menu={false}>
    <p>ここで何か起こっているようだ</p>
    {#if errorReason === "multipleConnectionsLimit"}
        <div
            class="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-lg shadow-md"
        >
            <h2 class="text-xl font-semibold">複数タブの個数上限です。</h2>
            <h3 class="text-base mt-2">
                うんｊは同じIPからの複数タブを制限しています。。
            </h3>
            <p class="mt-4">まずはこのタブを閉じようね。</p>
        </div>
    {:else if errorReason === "newUsersRateLimit"}
        <div
            class="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-lg shadow-md"
        >
            <h2 class="text-xl font-semibold">不自然な操作を感知しました。</h2>
            <h3 class="text-base mt-2">新人さん接続規制中。。</h3>
            <p class="mt-4">しばらくしてからリロードしてみてね。</p>
            <button
                class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                on:click={() => {
                    location.href = makePathname("/");
                }}
            >
                リロード
            </button>
        </div>
    {:else if errorReason === "grantFailed"}
        <div
            class="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-lg shadow-md"
        >
            <h2 class="text-xl font-semibold">
                致命的なエラーが発生しました。
            </h2>
            <h3 class="text-base mt-2">認証情報に不整合が起きています。</h3>
            <p class="mt-4">
                リロードしても直らないので管理人に復旧依頼をお願いします。
            </p>
        </div>
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

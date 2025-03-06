<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import Button from "@smui/button";
    import LinearProgress from "@smui/linear-progress";
    import Slider from "@smui/slider";
    import { format } from "date-fns";
    import { ja } from "date-fns/locale";
    import type { Res, Thread } from "../../common/response/schema.js";
    import { genUnjApiToken } from "../mylib/anti-debug.js";
    import { init, ok, socket, token } from "../mylib/socket.js";
    import ContentFormPart from "../parts/ContentFormPart.svelte";

    let { threadId = "", resNum = "" } = $props();

    let content = $state("");
    let content_url = $state("");
    let content_type = $state(1);

    let bookmark = $state(false); // idbから取得する

    let onlineUserCount = $state(0);
    const handleJoinThread = (data: { ok: boolean; size: number }) => {
        if (data.ok) {
            onlineUserCount = data.size;
        }
    };

    let thread: Thread | null = $state(null);
    let title = $state("少女祈祷中…");
    let lolCount = $state(0);
    let goodVotes = $state(0);
    let badVotes = $state(0);
    let total = $state(0);
    let denominator = $state(0);
    let goodRatio = $state(0);
    let badRatio = $state(0);
    const handleReadThread = (data: { ok: boolean; thread: Thread }) => {
        if (data.ok) {
            ok();
            thread = data.thread;
            title = thread.title;
            lolCount = thread.lol_count;
            goodVotes = thread.good_count;
            badVotes = thread.bad_count;
        }
    };

    $effect(() => {
        total = goodVotes + badVotes;
        denominator = total < 16 ? 16 : total;
        goodRatio = (goodVotes / denominator) * 100;
        badRatio = (badVotes / denominator) * 100;
    });

    $effect(() => {
        const id = init(() => {
            socket.emit("joinThread", {});
            socket.emit("readThread", {
                token: genUnjApiToken(token),
                cursor: null,
                size: 16,
                desc: true,
                thread_id: threadId,
            });
        });
        socket.on("joinThread", handleJoinThread);
        socket.on("readThread", handleReadThread);
        return () => {
            clearTimeout(id);
            socket.off("joinThread", handleJoinThread);
            socket.off("readThread", handleReadThread);
        };
    });
</script>

<HeaderPart {title} bind:bookmark>
    <p>スレ書き込みUI</p>
    <ContentFormPart bind:content bind:content_url bind:content_type />
    <Button onclick={() => alert("まだない")} variant="raised">投稿する</Button>
</HeaderPart>

<MainPart>
    {#if thread}
        <p>{thread.title}</p>
        <p>草×{thread.lol_count}草</p>
        <div class="res-list">
            {#each thread.res_list as res, i}
                <div class="res">
                    <!-- 上段: 名前欄 -->
                    <div class="name-row">
                        {res.num}：<span class="user-name"
                            >{res.cc_user_name}</span
                        >：
                        {format(res.created_at, "yy/MM/dd(EEE) HH:mm:ss", {
                            locale: ja,
                        })}
                        ID:{res.cc_user_id}
                    </div>
                    <!-- 下段: アイコンと内容 -->
                    <div class="content-row">
                        <!-- 固定幅・高さのアイコン -->
                        <span class="avatar">
                            <img
                                src="https://avatars.githubusercontent.com/u/88383494"
                                alt="User Avatar"
                            />
                        </span>
                        <!-- 右側のコンテンツ領域 -->
                        <div class="content">
                            <div class="content-text">
                                {res.content.repeat(1000)}
                            </div>
                            <div class="content-url">
                                <a
                                    href={res.content_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {res.content_url}
                                </a>
                            </div>
                            <div class="content-embed">youtube embed</div>
                        </div>
                    </div>
                    {#if i === 0}
                        <div class="unj-like-vote-container">
                            <div class="vote-buttons">
                                <Button
                                    class="good-vote"
                                    onclick={() => (goodVotes += 1)}
                                    >ｲｲ!(・∀・)</Button
                                >
                                <span class="good-count">+{goodVotes}</span>
                                <div class="bar">
                                    <div
                                        class="good"
                                        style="width:{goodRatio}%;"
                                    ></div>
                                    <div
                                        class="bad"
                                        style="width:{badRatio}%;"
                                    ></div>
                                </div>
                                <span class="bad-count">-{badVotes}</span>
                                <Button
                                    class="bad-vote"
                                    onclick={() => (badVotes += 1)}
                                    >(・Ａ・)ｲｸﾅｲ!</Button
                                >
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</MainPart>

<FooterPart />

<style>
    .res-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        text-align: left;
    }

    .res {
        border: 2mm ridge rgba(255, 255, 255, 0.1);
        padding: 8px;
    }

    /* 名前欄は全幅で上段に表示 */
    .name-row {
        width: 100%;
        margin-bottom: 8px;
    }

    /* content-row はアイコンと内容を横並びに */
    .content-row {
        display: flex;
        align-items: flex-start;
        width: 100%;
    }

    /* avatar は固定サイズ、左側に配置 */
    .avatar {
        flex: 0 0 auto;
        width: 64px;
        height: 64px;
        margin-right: 8px;
    }
    .avatar img {
        border-radius: 50%;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .avatar img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* content は縦並びに、右側の残りスペースを使用 */
    .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        inline-size: 768px;
        max-inline-size: 100%;
    }

    /* content-text は改行を含むテキストを自動折り返し */
    .content-text {
        display: block;
        white-space: pre-wrap; /* 改行も反映、必要に応じて折り返す */
        overflow-wrap: break-word; /* 長い単語も折り返し */
        margin-bottom: 4px;
    }

    .content-url,
    .content-embed {
        margin-bottom: 4px;
    }

    .content-url a {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .user-name {
        color: #66c0b5;
        font-weight: bold;
    }

    /* ｲｲ!(・∀・) (・Ａ・)ｲｸﾅｲ!  */
    .unj-like-vote-container {
        display: flex;
        align-items: right;
        justify-content: right;
        gap: 8px;
        padding: 8px;
    }
    .vote-buttons {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    :global(.unj-like-vote-container .good-vote) {
        background-color: #66f;
        color: white;
    }

    :global(.unj-like-vote-container .bad-vote) {
        background-color: #f66;
        color: white;
    }
    .bar {
        position: relative;
        width: 64px; /* 固定幅 */
        height: 20px;
        background-color: #eee;
        border-radius: 10px; /* 角丸 */
        margin: 0 8px; /* 左右に少し余白 */
        overflow: hidden; /* はみ出すバーが隠れるように */
    }
    .good {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background-color: skyblue;
    }
    .bad {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background-color: #f99;
    }
</style>

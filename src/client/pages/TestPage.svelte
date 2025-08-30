<script lang="ts">
    import { corsKiller } from "@onjmin/cors-killer";

    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import OekakiPart from "../parts/OekakiPart.svelte";

    let { npm = 0 } = $props();

    const samples = [
        {
            label: "Imgur（CORS対応・素通し）",
            url: "https://i.imgur.com/WKkpmbf.jpeg",
        },
        {
            label: "Wikipedia（CORS対応・素通し）",
            url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg",
        },
        {
            label: "Unsplash（CORS対応・素通し）",
            url: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
        },
        {
            label: "一般サイト（プロキシ経由想定）",
            url: "https://imgx.site/i/3q9sMTX.png",
        },
        {
            label: "data URI（素通し）",
            url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
        },
    ];

    let inputUrl: string = $state(samples[0].url);
    let resultUrl: string = $state("");
    let error: string = $state("");
    let previewType: "image" | "none" = $state("none");

    function run() {
        error = "";
        resultUrl = corsKiller(inputUrl.trim());

        if (!resultUrl) {
            error =
                "結果は空文字になりました（無効なURL or URLが長すぎる可能性があります）";
            previewType = "none";
            return;
        }

        // ごく簡易なプレビュー判定（画像だけ）
        if (
            resultUrl.startsWith("data:image") ||
            /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(resultUrl)
        ) {
            previewType = "image";
        } else {
            previewType = "none";
        }
    }

    async function copy() {
        if (!resultUrl) return;
        try {
            await navigator.clipboard.writeText(resultUrl);
        } catch {}
    }
</script>

<HeaderPart menu={false} title="実験用" />

<MainPart menu={false}>
    {#if npm === 1}
        <h1 class="text-2xl font-bold mb-4">@onjmin/oekaki DEMO</h1>
        <OekakiPart threadId="test" />
    {:else if npm === 2}
        <div class="mx-auto max-w-3xl p-6">
            <h1 class="text-2xl font-bold mb-4">@onjmin/cors-killer DEMO</h1>
            <p class="text-sm text-gray-600 mb-6">
                入力URLを <code>corsKiller()</code> に通し、素通し or プロキシ変換されたURLを表示します。
            </p>

            <!-- Sample selector -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1"
                    >サンプル
                    <select
                        class="w-full rounded-xl border px-3 py-2 outline-none focus:ring focus:ring-blue-200"
                        bind:value={inputUrl}
                        onchange={run}
                    >
                        {#each samples as s}
                            <option value={s.url}>{s.label}</option>
                        {/each}
                    </select></label
                >
            </div>

            <!-- URL input -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1"
                    >URL を入力
                    <div class="flex gap-2">
                        <input
                            class="w-full rounded-xl border px-3 py-2 outline-none focus:ring focus:ring-blue-200"
                            type="text"
                            placeholder="https://example.com/image.png"
                            bind:value={inputUrl}
                            onkeydown={(e) => e.key === "Enter" && run()}
                        />
                        <button
                            class="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 active:scale-[0.99]"
                            onclick={run}
                        >
                            変換
                        </button>
                    </div></label
                >
            </div>

            <!-- Result -->
            <div class="rounded-2xl border p-4">
                <div class="mb-2 flex items-center justify-between gap-3">
                    <h2 class="text-lg font-semibold">結果 URL</h2>
                    <div class="flex items-center gap-2">
                        <a
                            class="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                            href={resultUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-disabled={!resultUrl}
                        >
                            新しいタブで開く
                        </a>
                        <button
                            class="rounded-lg bg-gray-800 px-3 py-1 text-sm text-white hover:bg-black disabled:opacity-40"
                            onclick={copy}
                            disabled={!resultUrl}
                        >
                            コピー
                        </button>
                    </div>
                </div>

                <pre
                    class="overflow-x-auto rounded-xl bg-gray-50 p-3 text-xs">{resultUrl ||
                        "(なし)"}</pre>

                {#if error}
                    <p class="mt-2 text-sm text-red-600">{error}</p>
                {/if}

                {#if previewType === "image" && resultUrl}
                    <div class="mt-4">
                        <p class="mb-2 text-sm text-gray-600">
                            プレビュー（画像）
                        </p>
                        <img
                            class="max-h-80 w-auto rounded-xl border"
                            alt="preview"
                            src={resultUrl}
                        />
                    </div>
                {/if}
            </div>

            <!-- Notes -->
            <div class="mt-6 text-xs text-gray-500 leading-relaxed">
                <p>
                    ※ 画像以外（動画/音声/JS/CSS
                    など）はプレビューしませんが、結果 URL 自体は利用できます。
                </p>
                <p>
                    ※ 結果が空文字になる場合は、URL
                    が無効、または極端に長い（2,000文字超）可能性があります。
                </p>
            </div>
        </div>{/if}
</MainPart>

<FooterPart menu={false} />

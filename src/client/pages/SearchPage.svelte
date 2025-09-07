<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { SearchIcon } from "@lucide/svelte";
    import { format } from "date-fns";
    import { ja } from "date-fns/locale";
    import { navigate } from "svelte-routing";
    import * as v from "valibot";
    import {
        SearchSchema,
        myConfig,
        queryResultLimit,
    } from "../../common/request/schema.js";
    import { type SearchResult } from "../../common/response/schema.js";
    import { sleep } from "../../common/util.js";
    import { genNonce } from "../mylib/anti-debug.js";
    import { makePathname } from "../mylib/env.js";
    import { goodbye, hello, ok, socket } from "../mylib/socket.js";
    import { nonceKey } from "../mylib/unj-storage.js";

    let contentText = $state("");
    let searchResults: SearchResult[] = $state([]);
    let currentQuery: string | null = $state(null); // 検索処理を行う関数

    const handleSearch = (data: { ok: boolean; list: SearchResult[] }) => {
        if (!data.ok) return;
        ok();
        currentQuery = contentText.trim();
        if (!pagination) {
            searchResults = data.list;
            console.log(data.list);
        } else {
            if (searchResults) searchResults = searchResults.concat(data.list);
        }
    };

    const getFormattedText = (text: string, query: string) => {
        if (!query || query.length < 2) return text;

        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(
            regex,
            '<span class="bg-yellow-200 font-semibold">$1</span>',
        );
    };

    $effect(() => {
        hello();
        socket.on("search", handleSearch);
        return () => {
            goodbye();
            socket.off("search", handleSearch);
        };
    });

    let emitting = $state(false);
    let pagination = $state(false); // TODO: ページネーション
    const trySearch = async () => {
        if (emitting) return;
        emitting = true;
        const data = {
            nonce: genNonce(nonceKey.value ?? ""),
            limit: queryResultLimit,
            sinceResId: null,
            untilResId: null,
            keyword: contentText,
        };
        const result = (() => {
            const search = v.safeParse(SearchSchema, data, myConfig);
            if (!search.success) return;
            return search.output;
        })();
        if (!result) {
            await sleep(4096);
            emitting = false;
            return;
        }
        socket.emit("search", result);
        await sleep(4096);
        emitting = false;
        ok();
    };
</script>

<HeaderPart title="全文検索" />

<MainPart>
    <div class="container mx-auto p-4 max-w-2xl">
        <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center gap-2">
                <label for="contentText" class="sr-only">全文検索</label>
                <div class="relative flex-grow">
                    <div
                        class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                    >
                        <SearchIcon class="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                        id="contentText"
                        type="text"
                        bind:value={contentText}
                        class="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="全文検索"
                        onkeydown={(e) => e.key === "Enter" && trySearch()}
                    />
                </div>
                <button
                    type="submit"
                    class="min-w-[70px] py-2 px-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={emitting || contentText.trim().length < 2}
                    onclick={trySearch}
                >
                    {#if emitting}
                        <div class="flex items-center justify-center">
                            <svg
                                class="animate-spin h-5 w-5 mr-3 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg> <span class="sr-only">検索中...</span>
                        </div>
                    {:else}
                        <span>検索</span>
                    {/if}
                </button>
            </div>
        </div>
        <div class="mt-8">
            <h3 class="text-xl font-bold mb-4">検索結果</h3>

            {#if emitting}
                <p class="text-center text-gray-500">検索中...</p>
            {:else if searchResults.length === 0 && currentQuery}
                <p class="text-center text-gray-500">
                    該当する投稿は見つかりませんでした。
                </p>
            {:else if searchResults.length > 0}
                <ul class="space-y-4">
                    {#each searchResults as result}
                        <li class="bg-white p-4 rounded-lg shadow-md">
                            <div
                                class="text-lg font-bold text-gray-900 text-left cursor-pointer hover:underline"
                                tabindex="0"
                                role="button"
                                onkeydown={() => {}}
                                onclick={() =>
                                    navigate(
                                        makePathname(
                                            `/thread/${result.threadId}/`,
                                        ),
                                    )}
                            >
                                {@html getFormattedText(
                                    result.title,
                                    currentQuery || "",
                                )}
                            </div>
                            <div class="flex flex-col mt-2 text-left">
                                <div class="text-sm text-gray-800">
                                    <span
                                        class="text-blue-800 cursor-pointer hover:underline"
                                        tabindex="0"
                                        role="button"
                                        onkeydown={() => {}}
                                        onclick={() =>
                                            navigate(
                                                makePathname(
                                                    `/thread/${result.threadId}/${result.resNum}`,
                                                ),
                                            )}
                                    >
                                        {result.resNum}.
                                    </span>
                                    <span class="text-gray-500">
                                        ID:{result.ccUserId}
                                    </span>
                                    <span class="text-gray-800">
                                        {@html getFormattedText(
                                            result.contentText,
                                            currentQuery || "",
                                        )}
                                    </span>
                                    {#if result.contentUrl}
                                        <a
                                            href={result.contentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-blue-500 hover:underline ml-1"
                                        >
                                            {@html getFormattedText(
                                                result.contentUrl,
                                                currentQuery || "",
                                            )}
                                        </a>
                                    {/if}
                                </div>
                            </div>
                            <div
                                class="mt-1 text-xs text-gray-500 flex justify-between"
                            >
                                <span>うんち実況J</span>
                                <span
                                    >{format(
                                        result.createdAt,
                                        "yyyy/MM/dd HH:mm",
                                        { locale: ja },
                                    )}</span
                                >
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</MainPart>

<FooterPart />

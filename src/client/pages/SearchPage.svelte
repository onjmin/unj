<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { SearchIcon, XIcon } from "@lucide/svelte";
    import { format } from "date-fns";
    import { ja } from "date-fns/locale";
    import { Link, navigate } from "svelte-routing";
    import * as v from "valibot";
    import { type Board, boardIdMap } from "../../common/request/board.js";
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

    let { board }: { board: Board } = $props();

    let currentQuery = $state("");
    try {
        currentQuery = decodeURIComponent(
            (new URLSearchParams(window.location.search).get("q") ?? "").trim(),
        );
    } catch (err) {}

    let searchQuery = $state("");
    let isQueryValid = $derived(searchQuery.trim().length > 0);
    let searchResults = $state(new Map<string, SearchResult[]>());

    const handleSearch = (data: { ok: boolean; list: SearchResult[] }) => {
        if (!data.ok) return;
        ok();
        for (const v of data.list) {
            const arr = searchResults.get(v.threadId) ?? [];
            arr.push(v);
            searchResults.set(v.threadId, arr);
        }
        searchResults = new Map(searchResults);
    };

    $effect(() => {
        hello();
        socket.on("search", handleSearch);
        setTimeout(trySearch);
        return () => {
            goodbye();
            socket.off("search", handleSearch);
        };
    });

    const jumpToSearch = () => {
        const trimmed = searchQuery.trim();
        if (!trimmed.length) return;
        const q = encodeURIComponent(trimmed);
        navigate(makePathname(`/${board.key}/search?q=${q}`));
        currentQuery = trimmed;
        trySearch();
    };

    let emitting = $state(false);
    const trySearch = async () => {
        if (currentQuery === "") return;
        searchQuery = currentQuery;
        searchResults = new Map();
        if (emitting) return;
        emitting = true;
        const data = {
            nonce: genNonce(nonceKey.value ?? ""),
            limit: queryResultLimit,
            keyword: currentQuery,
        };
        const result = (() => {
            const search = v.safeParse(SearchSchema, data, myConfig);
            if (!search.success) return;
            return search.output;
        })();
        if (!result) {
            await sleep(1024);
            emitting = false;
            return;
        }
        socket.emit("search", result);
        await sleep(1024);
        emitting = false;
        ok();
    };

    const highlightSafe = function* (text: string, query: string) {
        if (!query) {
            yield { type: "text" as const, value: text };
            return;
        }

        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        let lastIndex = 0;
        let index = lowerText.indexOf(lowerQuery, lastIndex);

        while (index !== -1) {
            if (index > lastIndex) {
                yield {
                    type: "text" as const,
                    value: text.slice(lastIndex, index),
                };
            }
            yield {
                type: "highlight" as const,
                value: text.slice(index, index + query.length),
            };
            lastIndex = index + query.length;

            // 条件式の中で代入せずに次の検索
            index = lowerText.indexOf(lowerQuery, lastIndex);
        }

        if (lastIndex < text.length) {
            yield { type: "text" as const, value: text.slice(lastIndex) };
        }
    };
</script>

<HeaderPart {board} title="全文検索" />

<MainPart {board}>
    <div class="container mx-auto p-4 max-w-2xl">
        <div class="p-6 rounded-lg shadow-md">
            <div class="flex items-center gap-2">
                <label for="contentText" class="sr-only">全文検索</label>
                <div class="relative flex-grow">
                    <div
                        class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                    >
                        <SearchIcon class="w-4 h-4" />
                    </div>
                    <input
                        id="contentText"
                        type="text"
                        bind:value={searchQuery}
                        class="bg-gray-100/0 w-full p-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="全文検索"
                        onkeydown={(e) =>
                            e.key === "Enter" && isQueryValid && jumpToSearch()}
                    />
                    {#if searchQuery.length > 0}
                        <button
                            type="button"
                            class="absolute inset-y-0 right-0 flex items-center pr-3"
                            title="検索内容をクリア"
                            onclick={() => {
                                searchQuery = "";
                            }}
                        >
                            <XIcon
                                class="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                            />
                        </button>
                    {/if}
                </div>
                <button
                    type="submit"
                    onclick={jumpToSearch}
                    disabled={emitting || !isQueryValid}
                    class="min-w-[70px] py-2 px-4 rounded-md font-semibold transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed bg-gray-500/10 hover:bg-gray-500/20"
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
                <p class="text-center">検索中...</p>
            {:else if searchResults.size === 0 && currentQuery !== ""}
                <p class="text-center">該当する投稿は見つかりませんでした。</p>
            {:else if searchResults.size > 0}
                <ul class="space-y-4">
                    {#each searchResults as [threadId, results]}
                        {#snippet highlight(text: string)}
                            {#each highlightSafe(text, currentQuery) as part}
                                {#if part.type === "highlight"}
                                    <span
                                        class="text-gray-500 bg-yellow-200 font-semibold"
                                        >{part.value}</span
                                    >
                                {:else}
                                    {part.value}
                                {/if}
                            {/each}
                        {/snippet}
                        <li
                            class="border border-gray-500/10 p-4 rounded-lg shadow-md"
                        >
                            <div>
                                <div class="flex items-end">
                                    <Link
                                        to={makePathname(
                                            `/${results[0].boardId}/thread/${threadId}/`,
                                        )}
                                        class="text-lg font-bold text-left cursor-pointer hover:underline"
                                    >
                                        <span>
                                            {@render highlight(
                                                results[0].title,
                                            )}
                                        </span>
                                    </Link>
                                    <span class="opacity-50 ml-1"
                                        >({results[0].resCount})</span
                                    >
                                </div>
                            </div>
                            {#each results as result}
                                <div class="flex flex-col mt-2 text-left">
                                    <div class="text-sm break-words">
                                        <Link
                                            to={makePathname(
                                                `/${board.key}/thread/${threadId}/${result.resNum}`,
                                            )}
                                            class="cursor-pointer hover:underline"
                                            >{result.resNum}.</Link
                                        >
                                        <span class="text-gray-500">
                                            ID:{@render highlight(
                                                result.ccUserId,
                                            )}
                                        </span>
                                        <span>
                                            {@render highlight(
                                                result.contentText,
                                            )}
                                        </span>
                                        {#if result.contentUrl}
                                            {@render highlight(
                                                result.contentUrl,
                                            )}
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                            <div
                                class="opacity-50 mt-1 text-xs flex justify-between"
                            >
                                <span
                                    >{boardIdMap.get(results[0].boardId)
                                        ?.name}</span
                                >
                                <span
                                    >{format(
                                        results[0].createdAt,
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

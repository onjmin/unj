<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import type { Board } from "../../common/request/board.js";
    import { links } from "../mylib/links.js";

    let { board }: { board: Board } = $props();
</script>

<HeaderPart {board} title="リンク集" />

<!-- <MainPart {board}>
    <p class="mb-4">おんj発の掲示板群</p>
    <div class="w-full max-w-lg mx-auto">
        <ul class="rounded-lg shadow-md divide-y divide-gray-200 bg-gray-100/10">
            {#each links as siteInfo, i}
                <li class="p-4 flex items-center space-x-4">
                    <div
                        class="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                        style="background-image: url({siteInfo.favicon});"
                    ></div>
                    <div class="flex-1 min-w-0 text-left">
                        <a
                            href={siteInfo.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-sm font-medium text-gray-900 truncate hover:underline text-left"
                        >
                            {siteInfo.name}
                        </a>
                        <p class="text-sm text-gray-500 truncate text-left">
                            {siteInfo.description}
                        </p>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</MainPart> -->

<MainPart {board}>
    <div
        class="flex flex-col items-center justify-center text-left p-8 bg-gray-100/10 rounded-lg shadow-md max-w-lg mx-auto mt-10"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 text-red-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.456-1.636 1.54-2.903l-6.928-11.897c-.917-1.574-3.578-1.574-4.495 0L3.551 18.097c-.916 1.573-.001 3.208 1.54 3.208z"
            />
        </svg>
        <h2 class="text-xl md:text-2xl font-bold mb-2">重要なお知らせ</h2>
        <p class="text-sm md:text-base">
            この度は、リンク集が不正アクセスに悪用されたため、一時的に公開を停止しております。
        </p>
        <p class="text-sm md:text-base mt-2">
            ご不便をおかけして大変申し訳ございませんが、何卒ご理解いただけますようお願い申し上げます。
        </p>
        <hr class="w-full border-t border-gray-200 my-4" />
        <p class="text-sm md:text-base text-gray-500 font-bold mb-2">
            ぷゆゆ管理人様、なんI管理人様へ
        </p>
        <p class="text-xs text-gray-500">
            当サイトのリンク集が不正アクセスに悪用され、
            ご迷惑をおかけしたことを深くお詫び申し上げます。
            この度は、大変申し訳ございませんでした。
        </p>
        <p class="text-xs text-gray-500 mt-2">
            日頃より掲示板を運営していただき、心より感謝申し上げます。
        </p>
    </div>
</MainPart>

<FooterPart />

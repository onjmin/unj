<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { links } from "../mylib/links.js";
</script>

<HeaderPart title="リンク集" />

<MainPart>
    <p class="mb-4 text-left">おんj発の掲示板群</p>
    <div class="w-full max-w-lg mx-auto">
        <ul class="rounded-lg shadow-md divide-y divide-gray-200 bg-white">
            {#each links as siteInfo, i}
                <li
                    class="p-4 flex items-center space-x-4 transition-colors duration-200 ease-in-out hover:bg-gray-50"
                >
                    <div
                        class="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                        style="background-image: url({siteInfo.favicon});"
                    ></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">
                            {siteInfo.name}
                        </p>
                        <p class="text-sm text-gray-500 truncate">
                            {siteInfo.description}
                        </p>
                    </div>
                    <a
                        href={siteInfo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        aria-label="新しいタブで{siteInfo.name}を開く"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                            />
                        </svg>
                    </a>
                </li>
            {/each}
        </ul>
    </div>
</MainPart>

<FooterPart />

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
    <p class="mb-4">おんj発の掲示板群</p>
    <div class="w-full max-w-lg mx-auto">
        <ul class="rounded-lg shadow-md divide-y divide-gray-200 bg-white">
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
</MainPart>

<FooterPart />

<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { ChevronDownIcon, ChevronRightIcon } from "@lucide/svelte";
    import { faq } from "../mylib/faq.js";
    import TermsPart from "../parts/TermsPart.svelte";

    // 開いている質問のインデックスを管理する状態
    let openQuestion: number | null = $state(null);

    // 質問の開閉を切り替える関数
    const toggleQuestion = (index: number) => {
        openQuestion = openQuestion === index ? null : index;
    };
</script>

<HeaderPart title="うんｊ利用規約">
    <p>よくある質問</p>
    <div class="space-y-4">
        {#each faq as [q, a], i}
            <div class="bg-white rounded-lg shadow">
                <div
                    tabindex="0"
                    role="button"
                    onkeydown={() => {}}
                    class="flex justify-between items-center p-4 cursor-pointer"
                    onclick={() => toggleQuestion(i)}
                >
                    <h3 class="font-bold text-lg">{q}</h3>
                    {#if openQuestion === i}
                        <ChevronDownIcon class="h-6 w-6" />
                    {:else}
                        <ChevronRightIcon class="h-6 w-6" />
                    {/if}
                </div>
                {#if openQuestion === i}
                    <div class="p-4 border-t border-gray-200">
                        {a}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</HeaderPart>

<MainPart>
    <TermsPart />
</MainPart>

<FooterPart />

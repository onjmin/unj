<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { ChevronDownIcon, ChevronRightIcon } from "@lucide/svelte";
    import type { Board } from "../../common/request/board.js";
    import { faq } from "../mylib/faq.js";
    import TermsPart from "../parts/TermsPart.svelte";

    let { board }: { board: Board } = $props();

    // 開いている質問のインデックスを管理する状態
    let openQuestion: number | null = $state(null);

    // 質問の開閉を切り替える関数
    const toggleQuestion = (index: number) => {
        openQuestion = openQuestion === index ? null : index;
    };
</script>

<HeaderPart {board} title="うんｊ利用規約">
    <p>よくある質問</p>
    <div class="space-y-2">
        {#each faq as [q, a], i}
            <div class="border border-gray-500/10 rounded-lg shadow">
                <div
                    tabindex="0"
                    role="button"
                    onkeydown={() => {}}
                    class="flex justify-between items-center p-1 cursor-pointer"
                    onclick={() => toggleQuestion(i)}
                >
                    <h3 class="text-xs">{q}</h3>
                    {#if openQuestion === i}
                        <ChevronDownIcon class="h-4 w-4" />
                    {:else}
                        <ChevronRightIcon class="h-4 w-4" />
                    {/if}
                </div>
                {#if openQuestion === i}
                    <div class="p-1 border-t border-gray-500/20">
                        {a}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</HeaderPart>

<MainPart {board}>
    <TermsPart />
</MainPart>

<FooterPart {board} />

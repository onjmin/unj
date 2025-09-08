<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import {
        ChevronDownIcon,
        ChevronRightIcon,
        CopyIcon,
        PlayIcon,
        Trash2Icon,
        Volume2Icon,
    } from "@lucide/svelte";
    import { Slider } from "@skeletonlabs/skeleton-svelte";
    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import SegmentedButton, { Segment } from "@smui/segmented-button";
    import Snackbar, { Label as SnackbarLabel } from "@smui/snackbar";
    import { Howler } from "howler";
    import {
        type ImgurResponse,
        deleteImgur,
        imgurHistory,
    } from "../mylib/imgur.js";
    import {
        changeNewResSound,
        changeReplyResSound,
        changeVolume,
        coinSound,
        newResSoundHowl,
        replyResSoundHowl,
        soundMap,
        wafSound,
    } from "../mylib/sound.js";
    import {
        newResSound,
        replyResSound,
        soundVolume,
        theme,
    } from "../mylib/unj-storage.js";

    changeVolume();
    changeNewResSound();
    changeReplyResSound();

    let soundVolumeSlider = $state([Howler.volume() * 100]);
    let selectedNewResSound: string = $state(
        newResSound.value ?? coinSound.key,
    );
    let selectedReplyResSound: string = $state(
        replyResSound.value ?? wafSound.key,
    );

    $effect(() => {
        soundVolume.value = String(soundVolumeSlider[0] / 100);
        changeVolume();
    });
    $effect(() => {
        newResSound.value = selectedNewResSound;
        changeNewResSound();
    });
    $effect(() => {
        replyResSound.value = selectedReplyResSound;
        changeReplyResSound();
    });

    const themes = [
        "bubblegum",
        "bubblegum-dark",
        "fixation",
        "fixation-dark",
        "material",
        "material-dark",
        "metro",
        "metro-dark",
        "svelte",
        "svelte-dark",
        "unity",
        "unity-dark",
    ];

    let selectedTheme: string = $state(theme.value ?? "");
    $effect(() => {
        if (!selectedTheme) return;
        theme.value = selectedTheme;
    });

    // 標準テーマ
    const segmentedList = ["ダークモード", "ライトモード"];
    let segmentedSelected = $state("");
    if (theme.value === "metro-dark") segmentedSelected = "ダークモード";
    if (theme.value === "unity") segmentedSelected = "ライトモード";
    $effect(() => {
        if (segmentedSelected === "ダークモード") theme.value = "metro-dark";
        if (segmentedSelected === "ライトモード") theme.value = "unity";
    });

    let imgurList: ImgurResponse[] = $state([]);
    $effect(() => {
        imgurHistory.get().then((v) => {
            imgurList = v ? v : [];
        });
    });

    let snackbar: Snackbar;
    $effect(() => () => snackbar.close());

    let openAccordion: string | null = $state(null);
    const toggleAccordion = (panelName: string) => {
        openAccordion = openAccordion === panelName ? null : panelName;
    };

    let isModalOpen = $state(false);
    let selectedImageUrl = $state("");

    const openModal = (url: string) => {
        selectedImageUrl = url;
        isModalOpen = true;
    };

    const closeModal = () => {
        isModalOpen = false;
        selectedImageUrl = "";
    };
</script>

<HeaderPart title="個人設定">
    <p>高度な設定</p>
    <p>なし</p>
</HeaderPart>

<MainPart>
    <p>ここで設定変更できます</p>
    <div class="space-y-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="flex justify-between items-center p-4 cursor-pointer"
                onclick={() => toggleAccordion("theme")}
            >
                <h3 class="font-bold text-lg">テーマの変更</h3>
                {#if openAccordion === "theme"}
                    <ChevronDownIcon class="h-6 w-6" />
                {:else}
                    <ChevronRightIcon class="h-6 w-6" />
                {/if}
            </div>
            {#if openAccordion === "theme"}
                <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <LayoutGrid>
                        <Cell span={12}>
                            <SegmentedButton
                                singleSelect
                                segments={segmentedList}
                                bind:selected={segmentedSelected}
                            >
                                {#snippet segment(segment: string)}
                                    <Segment {segment}>
                                        <div class="px-4 py-2">{segment}</div>
                                    </Segment>
                                {/snippet}
                            </SegmentedButton>
                        </Cell>
                    </LayoutGrid>
                    <div class="mt-4 space-y-2">
                        {#each themes as theme}
                            <div class="flex items-center space-x-2 py-2">
                                <input
                                    type="radio"
                                    id="{theme}-theme"
                                    bind:group={selectedTheme}
                                    value={theme}
                                    class="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                />
                                <label for="{theme}-theme" class="flex-1"
                                    >{theme}</label
                                >
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="flex justify-between items-center p-4 cursor-pointer"
                onclick={() => toggleAccordion("volume")}
            >
                <h3 class="font-bold text-lg">SE音量</h3>
                {#if openAccordion === "volume"}
                    <ChevronDownIcon class="h-6 w-6" />
                {:else}
                    <ChevronRightIcon class="h-6 w-6" />
                {/if}
            </div>
            {#if openAccordion === "volume"}
                <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-4">
                        <div class="flex-1">
                            <Slider
                                value={soundVolumeSlider}
                                onValueChange={(e) =>
                                    (soundVolumeSlider = e.value)}
                                markers={[25, 50, 75]}
                            />
                        </div>
                        <div class="flex-shrink-0">
                            音量：{soundVolumeSlider[0] | 0}%
                        </div>
                        <button
                            class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            onclick={() => newResSoundHowl?.play()}
                        >
                            <Volume2Icon class="h-6 w-6" />
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="flex justify-between items-center p-4 cursor-pointer"
                onclick={() => toggleAccordion("newResSound")}
            >
                <h3 class="font-bold text-lg">新着レスSE</h3>
                {#if openAccordion === "newResSound"}
                    <ChevronDownIcon class="h-6 w-6" />
                {:else}
                    <ChevronRightIcon class="h-6 w-6" />
                {/if}
            </div>
            {#if openAccordion === "newResSound"}
                <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="space-y-2">
                        {#each soundMap as [key, sound]}
                            <div class="flex items-center space-x-2 py-2">
                                <input
                                    type="radio"
                                    id="{key}-new-res"
                                    bind:group={selectedNewResSound}
                                    value={key}
                                    class="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                />
                                <label for="{key}-new-res" class="flex-1"
                                    >{sound.label}</label
                                >
                                {#if sound.src !== null}
                                    <button
                                        class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                        onclick={() =>
                                            setTimeout(
                                                () => newResSoundHowl?.play(),
                                                1,
                                            )}
                                    >
                                        <PlayIcon class="h-6 w-6" />
                                    </button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="flex justify-between items-center p-4 cursor-pointer"
                onclick={() => toggleAccordion("replyResSound")}
            >
                <h3 class="font-bold text-lg">安価レスSE</h3>
                {#if openAccordion === "replyResSound"}
                    <ChevronDownIcon class="h-6 w-6" />
                {:else}
                    <ChevronRightIcon class="h-6 w-6" />
                {/if}
            </div>
            {#if openAccordion === "replyResSound"}
                <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="space-y-2">
                        {#each soundMap as [key, sound]}
                            <div class="flex items-center space-x-2 py-2">
                                <input
                                    type="radio"
                                    id="{key}-reply-res"
                                    bind:group={selectedReplyResSound}
                                    value={key}
                                    class="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                />
                                <label for="{key}-reply-res" class="flex-1"
                                    >{sound.label}</label
                                >
                                {#if sound.src !== null}
                                    <button
                                        class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                        onclick={() =>
                                            setTimeout(
                                                () => replyResSoundHowl?.play(),
                                                1,
                                            )}
                                    >
                                        <PlayIcon class="h-6 w-6" />
                                    </button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="flex justify-between items-center p-4 cursor-pointer"
                onclick={() => toggleAccordion("imgurHistory")}
            >
                <h3 class="font-bold text-lg">お絵描き履歴</h3>
                {#if openAccordion === "imgurHistory"}
                    <ChevronDownIcon class="h-6 w-6" />
                {:else}
                    <ChevronRightIcon class="h-6 w-6" />
                {/if}
            </div>
            {#if openAccordion === "imgurHistory"}
                <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    {#if !imgurList.length}
                        <div class="text-gray-500 text-center space-y-2">
                            <div>NO DATA...</div>
                            <div>いまんとこお絵描き履歴は空っぽみたい。。</div>
                            <div>お絵描きをうｐしてから出直してね。</div>
                        </div>
                    {:else}
                        <div class="text-left space-y-4">
                            {#each imgurList as imgurResponse}
                                <div
                                    tabindex="0"
                                    role="button"
                                    onkeydown={() => {}}
                                    onclick={() =>
                                        openModal(imgurResponse.link)}
                                    class="flex items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                >
                                    <div
                                        class="w-12 h-12 flex-shrink-0 rounded-full bg-no-repeat bg-cover bg-center"
                                        style="background-image: url({imgurResponse.link});"
                                    ></div>
                                    <div class="flex-1 ml-4 overflow-hidden">
                                        <div class="font-bold truncate">
                                            {imgurResponse.id}
                                        </div>
                                        <div
                                            class="text-sm text-gray-500 truncate"
                                        >
                                            {imgurResponse.link}
                                        </div>
                                    </div>
                                    <div
                                        class="flex flex-shrink-0 space-x-2 ml-4"
                                    >
                                        <button
                                            class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                            onclick={async () => {
                                                await navigator.clipboard.writeText(
                                                    imgurResponse.link,
                                                );
                                                snackbar.open();
                                            }}
                                        >
                                            <CopyIcon class="h-6 w-6" />
                                        </button>
                                        <button
                                            class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                            onclick={async () => {
                                                if (
                                                    !confirm(
                                                        `${imgurResponse.id}を削除しますか？`,
                                                    )
                                                )
                                                    return;
                                                try {
                                                    await deleteImgur(
                                                        imgurResponse.deletehash,
                                                    );
                                                } catch (err) {
                                                    alert(
                                                        `${imgurResponse.id}の削除に失敗しました`,
                                                    );
                                                    return;
                                                }
                                                imgurList = imgurList.filter(
                                                    (v) =>
                                                        v.id !==
                                                        imgurResponse.id,
                                                );
                                                imgurHistory.set(imgurList);
                                            }}
                                        >
                                            <Trash2Icon class="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</MainPart>

<Snackbar bind:this={snackbar}>
    <SnackbarLabel>コピーしました</SnackbarLabel>
</Snackbar>

<FooterPart />

{#if isModalOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        onclick={closeModal}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        }}
        tabindex="0"
        role="button"
        aria-label="Close enlarged image"
    >
        <div class="absolute inset-0 bg-black opacity-50"></div>

        <div class="relative max-w-full max-h-full z-10">
            <img
                src={selectedImageUrl}
                alt="拡大画像"
                class="max-w-full max-h-full select-none"
            />
        </div>
    </div>
{/if}

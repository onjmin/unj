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
        LightbulbIcon,
        PlayIcon,
        Trash2Icon,
        Volume2Icon,
    } from "@lucide/svelte";
    import { createToaster } from "@skeletonlabs/skeleton-svelte";
    import { Toaster } from "@skeletonlabs/skeleton-svelte";
    import { Slider } from "@skeletonlabs/skeleton-svelte";
    import { Howler } from "howler";
    import { pokemonMap } from "../../common/pokemon.js";
    import type { Board } from "../../common/request/board.js";
    import {
        type ImgurResponse,
        deleteImgur,
        imgurHistory,
    } from "../mylib/imgur.js";
    import { ObjectStorage } from "../mylib/object-storage.js";
    import {
        changeNewResSound,
        changeReplyResSound,
        changeVolume,
        coinSound,
        newResSoundHowl,
        replyResSoundHowl,
        soundMap,
        wafSound,
        yajuKokoSound,
        yajuShoutSound,
    } from "../mylib/sound.js";
    import {
        authToken,
        newResSound,
        ninjaPokemon,
        ninjaScore,
        replyResSound,
        soundVolume,
        theme,
    } from "../mylib/unj-storage.js";
    import ImagePreviewModal from "../parts/ImagePreviewPart.svelte";

    let { board }: { board: Board } = $props();

    const toaster = createToaster();

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

    const themeMap = new Map<string, string>([
        ["bubblegum", "バブルガム風（カラフルでポップ）"],
        ["fixation", "強調テーマ（ハッキリ目立つ）"],
        ["material", "紙っぽいデザイン（Google風）"],
        ["metro", "四角タイル風（Windowsっぽい）"],
        ["svelte", "スッキリ軽め（Svelte公式っぽい）"],
        ["unity", "調和・統一感（まとまりある）"],
    ]);

    let selectedTheme: string = $state(theme.value ?? "");
    $effect(() => {
        if (!selectedTheme) return;
        theme.value = selectedTheme;
    });

    let imgurList: ImgurResponse[] = $state([]);
    $effect(() => {
        imgurHistory.get().then((v) => {
            imgurList = v ? v : [];
        });
    });

    let openAccordion: string | null = $state(null);
    const toggleAccordion = (panelName: string) => {
        openAccordion = openAccordion === panelName ? null : panelName;
    };

    let open = $state(false);
    let src = $state("");

    let ignoreList: Set<string> | null = $state(null);
    const ignoreListCache = new ObjectStorage<string[]>("ignoreListCache");
    $effect(() => {
        ignoreListCache.get().then((v) => {
            if (v && !ignoreList) {
                ignoreList = new Set(v);
            } else {
                ignoreList = new Set();
            }
        });
    });

    // ページネーション用変数

    let currentPage: number = $state(1); // 現在のページ
    const itemsPerPage: number = 10; // 1ページあたりの表示枚数
    const totalPages = $derived(Math.ceil(imgurList.length / itemsPerPage));
    const reversedImgurList = $derived([...imgurList].reverse());
    const paginatedImgurList = $derived(
        reversedImgurList.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage,
        ),
    );

    let isEditing = $state(false);
    let token = $state(authToken.value ?? "");

    const pokemonId = Math.min(
        151,
        Math.max(0, Number(ninjaPokemon.value) | 0),
    );
    const pokemonName = pokemonMap.get(pokemonId) ?? "けつばん";
    const ninjaLv = (Number(ninjaScore.value) ** (1 / 3)) | 0;

    const pokemonSound = (pokemonId: number) =>
        `https://www.pokemon.jp/special/nakigoe151/sound/m/${pokemonId.toString().padStart(3, "0")}.mp3`;
</script>

<HeaderPart {board} title="個人設定">
    <p>高度な設定</p>
    <section class="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            ポケモン忍法帖
        </h2>

        <div
            class="flex flex-col space-y-4 p-4 border rounded-lg bg-indigo-50 shadow-inner items-center sm:items-stretch"
        >
            <div class="w-20 h-20 flex-shrink-0 mx-auto">
                <img
                    src={pokemonId === 0
                        ? "https://archives.bulbagarden.net/media/upload/9/9e/Ghost_I.png"
                        : `https://img.yakkun.com/poke/icon96/n${pokemonId}.gif`}
                    alt={pokemonName}
                    class="w-full h-full object-contain"
                />
            </div>

            <div class="text-center pt-2 border-t border-indigo-200">
                <p class="text-sm font-medium text-gray-500">No. {pokemonId}</p>
                <div class="flex items-center justify-center space-x-2">
                    <p class="text-xl font-bold text-indigo-800">
                        <strong>{pokemonName}</strong>
                    </p>
                    <button
                        onclick={() => {
                            const sound = new Howl({
                                src: [pokemonSound(pokemonId || 112)],
                                html5: true,
                            });
                            sound.play();
                        }}
                        class="text-indigo-600 hover:text-indigo-800 transition duration-150 p-1 rounded-full hover:bg-indigo-100"
                        aria-label="鳴き声を再生"
                    >
                        <Volume2Icon class="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div class="text-center pt-2 border-t border-indigo-200">
                <p class="text-sm font-medium text-indigo-600">
                    ポケモンのレベル
                </p>
                <p class="text-4xl font-extrabold text-gray-900">
                    Lv.{ninjaLv}
                </p>
            </div>
        </div>
    </section>

    <section class="p-6 bg-white rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">
            移行用トークン
        </h2>

        <div class="space-y-4">
            <div class="flex flex-col space-y-2">
                {#if isEditing}
                    <textarea
                        bind:value={token}
                        placeholder="新しいトークンを入力してください"
                        rows="4"
                        class="w-full p-2 border-2 border-indigo-500 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-y"
                    ></textarea>
                    <button
                        onclick={() => {
                            isEditing = false;
                            authToken.value = token.trim();
                        }}
                        class="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-150 shadow-md"
                    >
                        保存
                    </button>
                {:else}
                    <textarea
                        value={token}
                        readonly
                        rows="4"
                        class="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-default resize-y"
                    ></textarea>
                    <button
                        onclick={() => {
                            isEditing = true;
                        }}
                        class="w-full px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition duration-150 shadow-md"
                    >
                        編集
                    </button>
                {/if}
            </div>

            <div
                class="p-3 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-lg flex flex-col space-y-1"
            >
                <div class="flex items-center">
                    <LightbulbIcon
                        class="w-5 h-5 flex-shrink-0 text-green-600 mr-2"
                    />
                    <p class="font-bold text-sm">ヒント</p>
                </div>
                <div class="text-xs">
                    <p>
                        このトークンは<strong>最大4日</strong
                        >で失効します。<strong>端末の引っ越し</strong
                        >にお使いください。
                    </p>
                </div>
            </div>
        </div>
    </section>
</HeaderPart>

<MainPart {board}>
    <p>ここで設定変更できます</p>
    <div class="space-y-4">
        <div class="bg-white rounded-lg shadow">
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
                <div class="p-4 border-t border-gray-200">
                    <div class="mt-4 space-y-2">
                        {#each themeMap as [theme, description]}
                            <div class="flex items-center space-x-2 py-2">
                                <input
                                    type="radio"
                                    id="{theme}-theme"
                                    bind:group={selectedTheme}
                                    value={theme}
                                    class="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                />
                                <label
                                    for="{theme}-theme"
                                    class="flex-1 text-left"
                                    >{description}</label
                                >
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
        <div class="bg-white rounded-lg shadow">
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
                <div class="p-4 border-t border-gray-200">
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
                            class="p-2 rounded-full hover:bg-gray-200"
                            onclick={() => newResSoundHowl?.play()}
                        >
                            <Volume2Icon class="h-6 w-6" />
                        </button>
                    </div>
                </div>
            {/if}
        </div>
        <div class="bg-white rounded-lg shadow">
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
                <div class="p-4 border-t border-gray-200">
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
                                <label
                                    for="{key}-new-res"
                                    class="flex-1 text-left"
                                    >{sound.label}</label
                                >
                                {#if sound.src !== null}
                                    <button
                                        class="p-2 rounded-full hover:bg-gray-200"
                                        onclick={() => {
                                            selectedNewResSound = key;
                                            setTimeout(
                                                () => newResSoundHowl?.play(),
                                                1,
                                            );
                                        }}
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
        <div class="bg-white rounded-lg shadow">
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
                <div class="p-4 border-t border-gray-200">
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
                                <label
                                    for="{key}-reply-res"
                                    class="flex-1 text-left"
                                    >{sound.label}</label
                                >
                                {#if sound.src !== null}
                                    <button
                                        class="p-2 rounded-full hover:bg-gray-200"
                                        onclick={() => {
                                            selectedReplyResSound = key;
                                            setTimeout(
                                                () => replyResSoundHowl?.play(),
                                                1,
                                            );
                                        }}
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
        <div class="bg-white rounded-lg shadow">
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
                <div class="p-4 border-t border-gray-200">
                    {#if !imgurList.length}
                        <div class="text-gray-500 text-center space-y-2">
                            <div>NO DATA...</div>
                            <div>いまんとこお絵描き履歴は空っぽみたい。。</div>
                            <div>お絵描きをうｐしてから出直してね。</div>
                        </div>
                    {:else}
                        {#snippet paginationControls()}
                            {#if totalPages > 1}
                                <div
                                    class="flex justify-center items-center mt-4 space-x-2"
                                >
                                    <button
                                        onclick={() => (currentPage = 1)}
                                        disabled={currentPage === 1}
                                        class="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        最初へ
                                    </button>
                                    <button
                                        onclick={() => currentPage--}
                                        disabled={currentPage === 1}
                                        class="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        前へ
                                    </button>
                                    <span>{currentPage} / {totalPages}</span>
                                    <button
                                        onclick={() => currentPage++}
                                        disabled={currentPage === totalPages}
                                        class="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        次へ
                                    </button>
                                    <button
                                        onclick={() =>
                                            (currentPage = totalPages)}
                                        disabled={currentPage === totalPages}
                                        class="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        最後へ
                                    </button>
                                </div>
                            {/if}
                        {/snippet}
                        {@render paginationControls()}
                        <div class="text-left space-y-4">
                            {#each paginatedImgurList as imgurResponse}
                                <div
                                    class="flex items-center py-2 border-b border-gray-200 last:border-b-0"
                                >
                                    <div
                                        tabindex="0"
                                        role="button"
                                        onkeydown={() => {}}
                                        onclick={() => {
                                            src = imgurResponse.link;
                                            open = true;
                                        }}
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
                                            class="p-2 rounded-full hover:bg-gray-200"
                                            onclick={async () => {
                                                await navigator.clipboard.writeText(
                                                    imgurResponse.link,
                                                );
                                                toaster.create({
                                                    title: "コピーしました",
                                                });
                                            }}
                                        >
                                            <CopyIcon class="h-6 w-6" />
                                        </button>
                                        <button
                                            class="p-2 rounded-full hover:bg-gray-200"
                                            onclick={async () => {
                                                if (
                                                    !confirm(
                                                        `ID:${imgurResponse.id}を削除しますか？`,
                                                    )
                                                )
                                                    return;
                                                try {
                                                    await deleteImgur(
                                                        imgurResponse.deletehash,
                                                    );
                                                } catch (err) {
                                                    alert(
                                                        `ID:${imgurResponse.id}の削除に失敗しました`,
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
                        {@render paginationControls()}
                    {/if}
                </div>
            {/if}
        </div>
        <div class="bg-white rounded-lg shadow">
            <div
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="flex justify-between items-center p-4 cursor-pointer"
                onclick={() => toggleAccordion("ignoreList")}
            >
                <h3 class="font-bold text-lg">無視リスト</h3>
                {#if openAccordion === "ignoreList"}
                    <ChevronDownIcon class="h-6 w-6" />
                {:else}
                    <ChevronRightIcon class="h-6 w-6" />
                {/if}
            </div>
            {#if openAccordion === "ignoreList"}
                <div class="p-4 border-t border-gray-200">
                    {#if !ignoreList || ignoreList.size === 0}
                        <div class="text-gray-500 text-center space-y-2">
                            <div>NO DATA...</div>
                            <div>無視リストは空っぽみたい。。</div>
                        </div>
                    {:else}
                        <div class="text-left space-y-4">
                            {#each [...ignoreList] as id}
                                <div
                                    class="flex items-center py-2 border-b border-gray-200 last:border-b-0"
                                >
                                    <div class="flex-1 ml-4 overflow-hidden">
                                        <div class="font-bold truncate">
                                            ID:{id}
                                        </div>
                                    </div>
                                    <div
                                        class="flex flex-shrink-0 space-x-2 ml-4"
                                    >
                                        <button
                                            class="p-2 rounded-full hover:bg-gray-200"
                                            onclick={() => {
                                                if (!ignoreList) return;
                                                ignoreList.delete(id);
                                                ignoreList = new Set(
                                                    ignoreList,
                                                );
                                                ignoreListCache.set([
                                                    ...ignoreList,
                                                ]);
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

<Toaster {toaster}></Toaster>

<FooterPart />

<ImagePreviewModal bind:open bind:src />

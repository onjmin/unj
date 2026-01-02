<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import {
        ChevronDownIcon,
        ChevronRightIcon,
        LightbulbIcon,
        PlayIcon,
        Trash2Icon,
        Volume2Icon,
    } from "@lucide/svelte";
    import { Slider } from "@skeletonlabs/skeleton-svelte";
    import { Howler } from "howler";
    import { pokemonMap } from "../../common/pokemon.js";
    import type { Board } from "../../common/request/board.js";
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
    } from "../mylib/unj-storage.js";
    import {
        customBackgroundUrl,
        customBackgroundOpacity,
        selectedTheme,
    } from "../mylib/store.js";

    let { board }: { board: Board } = $props();

    changeVolume();
    changeNewResSound();
    changeReplyResSound();

    let customBackgroundOpacitySlider = $state([
        $customBackgroundOpacity * 100,
    ]);

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

    let openAccordion: string | null = $state(null);
    const toggleAccordion = (panelName: string) => {
        openAccordion = openAccordion === panelName ? null : panelName;
    };

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
    <section class="border border-gray-500/40 mb-8 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 border-b pb-2">ポケモン忍法帖</h2>

        <div
            class="flex flex-col space-y-4 p-4 border border-gray-500/40 rounded-lg shadow-inner items-center sm:items-stretch"
        >
            <div class="w-20 h-20 shrink-0 mx-auto">
                <img
                    src={pokemonId === 0
                        ? "https://archives.bulbagarden.net/media/upload/9/9e/Ghost_I.png"
                        : `https://img.yakkun.com/poke/icon96/n${pokemonId}.gif`}
                    alt={pokemonName}
                    class="w-full h-full object-contain"
                />
            </div>

            <div class="text-center pt-2 border-t border-gray-500/40">
                <p class="text-sm font-medium">No. {pokemonId}</p>
                <div class="flex items-center justify-center space-x-2">
                    <p class="text-xl font-bold">
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
                        class="transition duration-150 p-1 rounded-full"
                        aria-label="鳴き声を再生"
                    >
                        <Volume2Icon class="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div class="text-center pt-2 border-t border-gray-500/40">
                <p class="text-sm font-medium">ポケモンのレベル</p>
                <p class="text-4xl font-extrabold">
                    Lv.{ninjaLv}
                </p>
            </div>
        </div>
    </section>

    <section class="border border-gray-500/40 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4 border-b pb-2">移行用トークン</h2>

        <div class="space-y-4">
            <div class="flex flex-col space-y-2">
                {#if isEditing}
                    <textarea
                        bind:value={token}
                        placeholder="新しいトークンを入力してください"
                        rows="4"
                        class="bg-gray-100/0 w-full p-2 border-2 border-indigo-500 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-y"
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
                        class="opacity-50 bg-gray-500/10 w-full p-2 border rounded-lg cursor-default resize-y"
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
                        class="w-5 h-5 shrink-0 text-green-600 mr-2"
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
    <div class="w-full max-w-3xl mx-auto space-y-4">
        <div class="border border-gray-500/40 rounded-lg shadow">
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
                                    bind:group={$selectedTheme}
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

        <div class="border border-gray-500/40 rounded-lg shadow">
            <div
                tabindex="0"
                role="button"
                onkeydown={() => {}}
                class="flex justify-between items-center p-4 cursor-pointer"
                onclick={() => toggleAccordion("background")}
            >
                <h3 class="font-bold text-lg">カスタム背景</h3>
                {#if openAccordion === "background"}
                    <ChevronDownIcon class="h-6 w-6" />
                {:else}
                    <ChevronRightIcon class="h-6 w-6" />
                {/if}
            </div>

            {#if openAccordion === "background"}
                <div class="p-4 border-t border-gray-200 space-y-4">
                    <!-- 背景画像選択 -->
                    <div class="flex items-center gap-3">
                        <input
                            type="file"
                            accept="image/*"
                            class="flex-1 min-w-0 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-500/80 file:text-sm file:font-medium cursor-pointer"
                            onchange={async (e) => {
                                const input = e.currentTarget;
                                const file = input.files?.[0];
                                if (!file) return;

                                // まず画像を読み込む
                                const img = await new Promise<HTMLImageElement>(
                                    (resolve, reject) => {
                                        const url = URL.createObjectURL(file);
                                        const image = new Image();
                                        image.onload = () => {
                                            resolve(image);
                                            URL.revokeObjectURL(url); // 不要になったら解放
                                        };
                                        image.onerror = reject;
                                        image.src = url;
                                    },
                                );

                                // Canvasに縮小して描画
                                const MAX_SIZE = 1024;
                                const scale = Math.min(
                                    1,
                                    MAX_SIZE / Math.max(img.width, img.height),
                                );
                                const canvas = document.createElement("canvas");
                                canvas.width = img.width * scale;
                                canvas.height = img.height * scale;
                                const ctx = canvas.getContext("2d")!;
                                ctx.drawImage(
                                    img,
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height,
                                );

                                // Base64化
                                $customBackgroundUrl =
                                    canvas.toDataURL("image/png");
                            }}
                        />

                        {#if $customBackgroundUrl}
                            <button
                                class="shrink-0 p-2 rounded hover:text-red-500"
                                onclick={() => {
                                    $customBackgroundUrl = "";
                                }}
                                title="背景を削除"
                            >
                                <Trash2Icon class="h-5 w-5" />
                            </button>
                        {/if}
                    </div>

                    <!-- 不透明度スライダー -->
                    {#if $customBackgroundUrl}
                        <div class="flex items-center gap-4">
                            <div class="flex-1">
                                <Slider
                                    min={0}
                                    max={100}
                                    step={1}
                                    defaultValue={customBackgroundOpacitySlider}
                                    onValueChange={(details) => {
                                        customBackgroundOpacitySlider =
                                            details.value;
                                        $customBackgroundOpacity =
                                            details.value[0] / 100;
                                    }}
                                    dir="ltr"
                                >
                                    <Slider.Label class="text-sm">
                                        不透明度
                                    </Slider.Label>

                                    <Slider.Control class="relative flex-1 h-4">
                                        <Slider.Track
                                            class="bg-gray-300 relative flex-1 h-2 rounded-full"
                                        >
                                            <Slider.Range
                                                class="absolute bg-gray-600 h-full rounded-full"
                                            />
                                        </Slider.Track>

                                        <Slider.Thumb
                                            index={0}
                                            class="block w-4 h-4 bg-white border border-gray-400 rounded-full"
                                        >
                                            <Slider.HiddenInput />
                                        </Slider.Thumb>
                                    </Slider.Control>

                                    <Slider.MarkerGroup>
                                        <Slider.Marker value={0} />
                                        <Slider.Marker value={25} />
                                        <Slider.Marker value={50} />
                                        <Slider.Marker value={75} />
                                        <Slider.Marker value={100} />
                                    </Slider.MarkerGroup>
                                </Slider>
                            </div>

                            <div class="shrink-0 text-sm tabular-nums">
                                {customBackgroundOpacitySlider[0]}%
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="border border-gray-500/40 rounded-lg shadow">
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
                                min={0}
                                max={100}
                                step={1}
                                defaultValue={soundVolumeSlider}
                                onValueChange={(details) =>
                                    (soundVolumeSlider = details.value)}
                                dir="ltr"
                            >
                                <Slider.Label>音量</Slider.Label>

                                <Slider.Control class="relative flex-1 h-4">
                                    <Slider.Track
                                        class="bg-gray-300 relative flex-1 h-2 rounded-full"
                                    >
                                        <Slider.Range
                                            class="absolute bg-blue-500 h-full rounded-full"
                                        />
                                    </Slider.Track>

                                    <Slider.Thumb
                                        index={0}
                                        class="block w-4 h-4 bg-white border border-gray-400 rounded-full"
                                    >
                                        <Slider.HiddenInput />
                                    </Slider.Thumb>
                                </Slider.Control>

                                <Slider.MarkerGroup>
                                    <Slider.Marker value={0} />
                                    <Slider.Marker value={25} />
                                    <Slider.Marker value={50} />
                                    <Slider.Marker value={75} />
                                    <Slider.Marker value={100} />
                                </Slider.MarkerGroup>
                            </Slider>
                        </div>
                        <div class="shrink-0">
                            音量：{soundVolumeSlider[0] | 0}%
                        </div>
                        <button
                            class="p-2 rounded-full hover:text-gray-500"
                            onclick={() => newResSoundHowl?.play()}
                        >
                            <Volume2Icon class="h-6 w-6" />
                        </button>
                    </div>
                </div>
            {/if}
        </div>
        <div class="border border-gray-500/40 rounded-lg shadow">
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
                                        class="p-2 rounded-full hover:text-gray-500"
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
        <div class="border border-gray-500/40 rounded-lg shadow">
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
                                        class="p-2 rounded-full hover:text-gray-500"
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
        <div class="border border-gray-500/40 rounded-lg shadow">
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
                        <div class="opacity-50 text-center space-y-2">
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
                                    <div class="flex shrink-0 space-x-2 ml-4">
                                        <button
                                            class="p-2 rounded-full hover:text-gray-500"
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

<FooterPart />

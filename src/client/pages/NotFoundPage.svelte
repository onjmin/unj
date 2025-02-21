<script lang="ts">
    import { navigate } from "svelte-routing";
    import { base } from "../mylib/env.js";
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";

    $effect(() => {
        setTimeout(() => {
            navigate(base("/"), { replace: true });
        }, 5000);
    });

    const illusts = [
        "https://lohas.nicoseiga.jp//thumb/11535917i",
        "https://lohas.nicoseiga.jp//thumb/11535907i",
        "https://lohas.nicoseiga.jp//thumb/11535911i",
        "https://lohas.nicoseiga.jp//thumb/11532522i",
        "https://lohas.nicoseiga.jp/thumb/11537788i",
        "https://lohas.nicoseiga.jp/thumb/11539312i",
    ];
    const randArray = (arr: string[]) =>
        arr[Math.floor(Math.random() * arr.length)];
    const randomIllust = randArray(illusts);
</script>

<HeaderPart menu={false} title="Not Found" />

<MainPart menu={false}>
    <p>The requested URL was not found on this server.</p>
    <p>ページは（ナイ！）</p>
    <img
        alt="random-illust"
        src={randomIllust}
        style="display: block; margin: 1em auto; max-height: 20vh; min-height: 20vh;"
    />
    <p>「すご」「これガチでいけるんちゃうか？」「あくしろ　楽しみすぎる」</p>
    <p>これ、なんだったの？</p>
</MainPart>

<FooterPart />

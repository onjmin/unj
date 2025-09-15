<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { navigate } from "svelte-routing";
    import { randArray } from "../../common/util.js";
    import { makePathname } from "../mylib/env.js";

    $effect(() => {
        const id = setTimeout(() => {
            navigate(makePathname("/"), { replace: true });
        }, 4096);
        return () => clearTimeout(id);
    });

    const illusts = [
        "https://i.imgur.com/O01c9cc.png",
        "https://lohas.nicoseiga.jp//thumb/11535907i",
        "https://lohas.nicoseiga.jp/thumb/11539312i",
    ];
    const randomIllust = randArray(illusts);
</script>

<HeaderPart menu={false} title="Not Found" />

<MainPart menu={false}>
    <p>The requested URL was not found on this server.</p>
    <p>ページは（ナイ！）</p>
    <img class="unj-img" alt="404絵" src={randomIllust} />
    <p>「すご」「これガチでいけるんちゃうか？」「あくしろ　楽しみすぎる」</p>
    <p>これ、なんだったの？</p>
</MainPart>

<FooterPart menu={false} />

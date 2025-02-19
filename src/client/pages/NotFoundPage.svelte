<script lang="ts">
    import Card, { Content } from "@smui/card";
    import { navigate } from "svelte-routing";
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";

    $effect(() => {
        setTimeout(() => {
            navigate("/", { replace: true });
            console.log(114);
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

<HeaderPart />

<main>
    <Card style="text-align:center;background-color:transparent;">
        <Content>
            <h1>Not Found</h1>
            <p>The requested URL was not found on this server.</p>
            <p>ページは（ナイ！）</p>
            <img
                alt="random-illust"
                src={randomIllust}
                style="display: block; max-height: 20vh; min-height: 20vh; : 1em auto;"
            />
            <p>
                「すご」「これガチでいけるんちゃうか？」「あくしろ　楽しみすぎる」
            </p>
            <p>これ、なんだったの？</p>
        </Content>
    </Card>
</main>

<FooterPart />

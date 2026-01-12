<script lang="ts">
    // pages共通 //
    import FooterPart from "../parts/FooterPart.svelte";
    import HeaderPart from "../parts/HeaderPart.svelte";
    import MainPart from "../parts/MainPart.svelte";
    ///////////////

    import { navigate } from "svelte-routing";
    import { makePathname } from "../mylib/env.js";

    $effect(() => {
        const id = setTimeout(() => {
            navigate(makePathname("/"), { replace: true });
        }, 4096);
        return () => clearTimeout(id);
    });
</script>

<HeaderPart menu={false} title="Not Found" />

<MainPart menu={false}>
    <p>The requested URL was not found on this server.</p>
    <p>ページは（ナイ！）</p>
    <img
        class="unj-img"
        alt="NotFound絵"
        src="https://i.imgur.com/DvKG1ey.png"
    />
    <p>「すご」「これガチでいけるんちゃうか？」「あくしろ　楽しみすぎる」</p>
    <p>これ、なんだったの？</p>
</MainPart>

<FooterPart menu={false} />

<script lang="ts">
  import Button from "@smui/button";
  import { navigate } from "svelte-routing";
  import { base } from "../mylib/env.js";
  import { load } from "../mylib/storage.js";
  import FooterPart from "../parts/FooterPart.svelte";
  import HeaderPart from "../parts/HeaderPart.svelte";
  import MainPart from "../parts/MainPart.svelte";
  import TermsConfirmPart from "../parts/TermsConfirmPart.svelte";

  const onjKeyWords = [
    "束音ロゼ",
    "曲スレ",
    "ブラウザゲーム",
    "ガーティックフォン",
    "絵チャ",
    "OSV",
  ];
  const randArray = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];
  const randomOnjKeyWord1 = randArray(onjKeyWords);
  const randomOnjKeyWord2 = randArray(
    onjKeyWords.filter((v) => v !== randomOnjKeyWord1),
  );

  let openConfirm = $state(false);
  const tryEnter = async () => {
    if ("yes" === (await load("termsAgreement"))) {
      openConfirm = false;
      navigate(base("/headline"));
    } else {
      openConfirm = true;
    }
  };

  const illusts = [
    "https://i.imgur.com/q4fuN3p.gif", // ポケモンの街風ドット絵
    "https://magma.com/shared/X1VUEp3aQw5ntceEn_0Sgj", // クリスマスパーティ
    "https://magma.com/shared/1nWjAI4USme1xjoKl2-eLj", // ホワイトクリスマス雪景色
  ];
  const randomIllust = randArray(illusts);
</script>

<HeaderPart menu={false} title="うんｊ掲示板へようこそ" />
<TermsConfirmPart {openConfirm} />

<MainPart menu={false}>
  <h1>運営と運命を共にする、うんち実況（セーラージュピター）</h1>
  <img class="img-home" alt="img-home" src={randomIllust} />
  <p>
    「{randomOnjKeyWord1}」から「{randomOnjKeyWord2}」までを手広くカバーする匿名掲示板
  </p>
  <p>『うんｊ』へようこそ！</p>
  <Button onclick={tryEnter} variant="raised">入る</Button>
  <p>しばらくしても、自動的に移動しません。</p>
</MainPart>

<FooterPart />

<style>
  .img-home {
    display: block;
    margin: 1em auto;
    max-width: 50vw;
    max-height: 50vh;
    width: auto;
    height: auto;
  }
</style>

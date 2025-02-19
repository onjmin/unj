<script lang="ts">
  import Button from "@smui/button";
  import Card, { Content } from "@smui/card";
  import { load } from "../mylib/storage.js";
  import FooterPart from "../parts/FooterPart.svelte";
  import HeaderPart from "../parts/HeaderPart.svelte";

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

  let openAttention = $state(false);
  const tryEnter = async () =>
    load("termsAgreement").then((v) => {
      openAttention = "yes" !== (v ?? "");
    });

  const illusts = [
    "https://i.imgur.com/q4fuN3p.gif", // ポケモンの街風ドット絵
    "https://magma.com/shared/X1VUEp3aQw5ntceEn_0Sgj", // クリスマスパーティ
    "https://magma.com/shared/1nWjAI4USme1xjoKl2-eLj", // ホワイトクリスマス雪景色
  ];
  const randomIllust = randArray(illusts);
</script>

<HeaderPart {openAttention} />

<main>
  <Card style="text-align:center;background-color:transparent;">
    <Content>
      <h1>運営と運命を共にする、うんち実況（セーラージュピター）</h1>
      <img
        alt="random-illust"
        src={randomIllust}
        style="display: block; max-height: 50vh; margin: 1em auto;"
      />
      <p>
        「{randomOnjKeyWord1}」から「{randomOnjKeyWord2}」までを手広くカバーする匿名掲示板
      </p>
      <p>『うんｊ』へようこそ！</p>
      <Button onclick={tryEnter} variant="raised">入る</Button>
      <p>しばらくしても、自動的に移動しません。</p>
    </Content>
  </Card>
</main>

<FooterPart />

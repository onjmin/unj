<script lang="ts">
  import Button from "@smui/button";
  import Card, { Content } from "@smui/card";
  import { load } from "../mylib/storage.js";
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
    load("isAlreadyAgreedTerms").then((v) => {
      openAttention = "yes" !== (v ?? "");
    });
</script>

<HeaderPart {openAttention} />

<main>
  <Card style="text-align:center;background-color:transparent;">
    <Content>
      <h1>運営と運命を共にする、うんち実況（セーラージュピター）</h1>
      <p>
        「{randomOnjKeyWord1}」から「{randomOnjKeyWord2}」までを手広くカバーする匿名掲示板
      </p>
      <p>『うんｊ』へようこそ！</p>
      <Button onclick={tryEnter} variant="raised">入る</Button>
      <p>しばらくしても、自動的に移動しません。</p>
    </Content>
  </Card>
</main>

<footer style="text-align:center;color:rgba(255,255,255,.2);">
  著作権AGPL：うんｊはまとめ自由/開示義務有
</footer>

<script lang="ts">
  import Banner, { Label, Icon, CloseReason } from "@smui/banner";
  import Button from "@smui/button";
  import { onMount } from "svelte";
  import HeaderPart from "./parts/HeaderPart.svelte";

  let timer: NodeJS.Timeout;

  // onMount(() => {
  //   timer = setTimeout(() => {
  //     window.location.href = "/threads";
  //   }, 5000);
  // });
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
</script>

<HeaderPart />

<main>
  <h1>運営と運命を共にする、うんち実況（セーラージュピター）</h1>
  <p>
    「{randomOnjKeyWord1}」から「{randomOnjKeyWord2}」までを手広くカバーする匿名掲示板
  </p>
  <p>『うんｊ』へようこそ！</p>

  <Button href="http://example.com" target="_blank">
    <Label>入る</Label>
  </Button>

  <p>しばらくすると、自動的に移動します。</p>
</main>

<footer>著作権AGPL：うんｊはまとめ自由/開示義務有</footer>

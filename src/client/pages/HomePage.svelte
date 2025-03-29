<script lang="ts">
  // pages共通 //
  import FooterPart from "../parts/FooterPart.svelte";
  import HeaderPart from "../parts/HeaderPart.svelte";
  import MainPart from "../parts/MainPart.svelte";
  ///////////////

  import Button from "@smui/button";
  import { navigate } from "svelte-routing";
  import { randArray } from "../../common/util.js";
  import { makePathname } from "../mylib/env.js";
  import { topIllusts } from "../mylib/top-illusts.js";

  const catchphrase = [
    "運営と運命を共にする、うんち実況（セーラージュピター）",
    "裏おんｊ、縮めてうんｊ　このネットの不思議な不思議な掲示板",
  ];

  const onjKeyWords = [
    "束音ロゼ",
    "曲スレ",
    "ブラウザゲーム",
    "ガーティックフォン",
    "絵チャ",
    "OSV",
  ];
  const randomOnjKeyWord1 = randArray(onjKeyWords);
  const randomOnjKeyWord2 = randArray(
    onjKeyWords.filter((v) => v !== randomOnjKeyWord1),
  );

  let openConfirm = $state(false);

  const randomIllust = randArray(topIllusts.map((v) => v.src));
</script>

<HeaderPart menu={false} title="うんｊ掲示板へようこそ" />

<MainPart menu={false}>
  <h1>{randArray(catchphrase)}</h1>
  <img class="unj-img" alt="TOP絵" src={randomIllust} />
  <p>
    「{randomOnjKeyWord1}」から「{randomOnjKeyWord2}」までを手広くカバーする匿名掲示板
  </p>
  <p>『うんｊ』へようこそ！</p>
  <Button
    onclick={() => {
      navigate(makePathname("/headline"));
    }}
    variant="raised">入る</Button
  >
  <p>しばらくしても、自動的に移動しません。</p>
</MainPart>

<FooterPart />

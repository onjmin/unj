<script lang="ts">
  // pages共通 //
  import FooterPart from "../parts/FooterPart.svelte";
  import HeaderPart from "../parts/HeaderPart.svelte";
  import MainPart from "../parts/MainPart.svelte";
  ///////////////

  import Button from "@smui/button";
  import { navigate } from "svelte-routing";
  import { base } from "../mylib/env.js";
  import { load } from "../mylib/storage.js";
  import { randArray, topIllusts } from "../mylib/top-illust.js";
  import TermsConfirmPart from "../parts/TermsConfirmPart.svelte";

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
  const tryEnter = async () => {
    if ("yes" === (await load("termsAgreement"))) {
      openConfirm = false;
      navigate(base("/headline"));
    } else {
      openConfirm = true;
    }
  };

  const randomIllust = randArray(topIllusts.map((v) => v.src));
</script>

<HeaderPart menu={false} title="うんｊ掲示板へようこそ" />
<TermsConfirmPart {openConfirm} />

<MainPart menu={false}>
  <h1>運営と運命を共にする、うんち実況（セーラージュピター）</h1>
  <img class="unj-img" alt="TOP絵" src={randomIllust} />
  <p>
    「{randomOnjKeyWord1}」から「{randomOnjKeyWord2}」までを手広くカバーする匿名掲示板
  </p>
  <p>『うんｊ』へようこそ！</p>
  <Button onclick={tryEnter} variant="raised">入る</Button>
  <p>しばらくしても、自動的に移動しません。</p>
</MainPart>

<FooterPart />

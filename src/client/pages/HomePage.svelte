<script lang="ts">
  // pages共通 //
  import FooterPart from "../parts/FooterPart.svelte";
  import HeaderPart from "../parts/HeaderPart.svelte";
  import MainPart from "../parts/MainPart.svelte";
  ///////////////

  import Button from "@smui/button";
  import { Link, navigate } from "svelte-routing";
  import { publicBoards } from "../../common/request/board.js";
  import { Enum } from "../../common/request/content-schema.js";
  import { randArray } from "../../common/util.js";
  import { makePathname } from "../mylib/env.js";
  import { topIllusts } from "../mylib/top-illusts.js";
  import EmbedPart from "../parts/EmbedPart.svelte";

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
  ];
  const randomOnjKeyWord1 = randArray(onjKeyWords);
  const randomOnjKeyWord2 = randArray(
    onjKeyWords.filter((v) => v !== randomOnjKeyWord1),
  );
  const randomIllust = randArray(topIllusts.map((v) => v.src));

  let open = $state(false);
</script>

<HeaderPart menu={false} title="うんｊ掲示板へようこそ" />

<MainPart menu={false}>
  <h1>{randArray(catchphrase)}</h1>
  <img class="unj-img" alt="TOP絵" src={randomIllust} />
  <p>
    「{randomOnjKeyWord1}」から「{randomOnjKeyWord2}」までを手広くカバーする匿名掲示板
  </p>
  <p>『うんｊ』へようこそ！</p>
  <div class="flex justify-center">
    <Button
      onclick={() => {
        navigate(makePathname("/unj"));
      }}
      variant="raised">入る</Button
    >
  </div>
  <div class="flex flex-col items-center">
    <div class="flex space-x-4">
      <Link
        to={makePathname("/unj/terms")}
        class="cursor-pointer hover:underline">利用規約</Link
      >
      <button
        class="text-sm text-blue-500 hover:underline bg-transparent border-none p-0 cursor-pointer"
        onclick={() => {
          open = true;
        }}
      >
        クッキーポリシー
      </button>
    </div>
    {#if open}
      <EmbedPart
        contentUrl="https://www.nicovideo.jp/watch/sm9720246"
        contentType={Enum.Video}
        auto
      />
    {/if}
  </div>
  <div class="text-center">
    <ul class="p-2 space-y-1">
      <li>板一覧</li>
      {#each publicBoards as b}
        <li>
          <Link
            to={makePathname(`/${b.key}`)}
            class="block px-3 py-1 rounded-md transition-colors"
          >
            {b.name}
          </Link>
        </li>
      {/each}
    </ul>
  </div>
</MainPart>

<FooterPart menu={false} />

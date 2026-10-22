<script lang="ts">
  // pages共通 //
  import FooterPart from "../parts/FooterPart.svelte";
  import HeaderPart from "../parts/HeaderPart.svelte";
  import MainPart from "../parts/MainPart.svelte";
  ///////////////

  import { Link, navigate } from "svelte-routing";
  import { publicBoards } from "../../common/request/board.js";
  import { Enum } from "../../common/request/content-schema.js";
  import { randArray } from "../../common/util.js";
  import { makePathname } from "../mylib/env.js";
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

  let open = $state(false);
</script>

<HeaderPart menu={false} title="うんｊ掲示板" />

<MainPart menu={false} transparent={true}>
  <div class="unj-home">
    <section class="unj-home-hero">
      <h1 class="unj-home-logo">うんｊ</h1>
      <p class="unj-home-catch">{randArray(catchphrase)}</p>
      <p class="unj-home-lead">
        「{randomOnjKeyWord1}」から「{randomOnjKeyWord2}」までを手広くカバーする匿名掲示板
      </p>
      <button
        class="unj-btn unj-btn-primary unj-home-enter"
        onclick={() => navigate(makePathname("/unj"))}>掲示板に入る</button
      >
    </section>

    <section class="unj-box">
      <h2 class="unj-box-title">板一覧</h2>
      <ul class="unj-home-boards">
        {#each publicBoards as b}
          <li>
            <Link to={makePathname(`/${b.key}`)} class="unj-home-board">
              <span class="unj-home-board-name">{b.name}</span>
              <span class="unj-home-board-desc">{b.description}</span>
            </Link>
          </li>
        {/each}
      </ul>
    </section>

    <section class="unj-box unj-home-rules">
      <h2 class="unj-box-title">はじめに</h2>
      <ul>
        <li>名前を書かなければ「名無し」になります。登録はいりません。</li>
        <li>レス番号を押すと、そのレスへの返信（安価）が書けます。</li>
        <li>メール欄の代わりに「sage」にチェックを入れると、スレを上げずに書き込めます。</li>
      </ul>
    </section>

    <div class="unj-home-links">
      <Link to={makePathname("/unj/terms")}>利用規約</Link>
      <Link to={makePathname("/unj/contact")}>お問い合わせ</Link>
      <button
        class="unj-home-linkbtn"
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
</MainPart>

<FooterPart menu={false} />

<style>
  .unj-home {
    max-width: 560px;
    margin: 0 auto;
    padding: 8px 0 24px;
    text-align: left;
  }
  .unj-home-hero {
    text-align: center;
    padding: 28px 16px 20px;
  }
  .unj-home-logo {
    margin: 0;
    font-size: 44px;
    font-weight: bold;
    letter-spacing: 0.08em;
    color: var(--unj-title);
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.12);
  }
  .unj-home-catch {
    margin: 8px 0 0;
    font-size: 14px;
    font-weight: bold;
    color: var(--unj-text);
    word-break: break-word;
  }
  .unj-home-lead {
    margin: 6px 0 0;
    font-size: 12.5px;
    color: var(--unj-text-sub);
    word-break: break-word;
  }
  .unj-home-enter {
    margin-top: 18px;
    font-size: 16px;
    padding: 10px 28px;
  }
  .unj-home-boards {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .unj-home-boards li + li {
    border-top: 1px dotted var(--unj-border);
  }
  .unj-home-boards :global(.unj-home-board) {
    display: flex;
    flex-direction: column;
    padding: 8px 2px;
    text-decoration: none;
  }
  .unj-home-board-name {
    font-size: 15px;
    font-weight: bold;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .unj-home-board-desc {
    font-size: 12px;
    color: var(--unj-text-sub);
  }
  .unj-home-rules ul {
    margin: 0;
    padding-left: 1.2em;
    list-style: disc;
    font-size: 13px;
    line-height: 1.7;
    color: var(--unj-text);
  }
  .unj-home-links {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
    font-size: 13px;
  }
  .unj-home-linkbtn {
    color: var(--unj-link);
    text-decoration: underline;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
</style>

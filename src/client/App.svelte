<script lang="ts">
  import "./global.css";
  import { Route, Router } from "svelte-routing";
  import { boardMap, undefinedBoard } from "../common/request/board.js";
  import { makePathname } from "./mylib/env.js";
  import ArtPage from "./pages/ArtPage.svelte";
  import ArticlePage from "./pages/ArticlePage.svelte";
  import BannedPage from "./pages/BannedPage.svelte";
  import ConfigPage from "./pages/ConfigPage.svelte";
  import ContactPage from "./pages/ContactPage.svelte";
  import ErrorPage from "./pages/ErrorPage.svelte";
  import HeadlinePage from "./pages/HeadlinePage.svelte";
  import HistoryPage from "./pages/HistoryPage.svelte";
  import HomePage from "./pages/HomePage.svelte";
  import LinksPage from "./pages/LinksPage.svelte";
  import MisskeyPage from "./pages/MisskeyPage.svelte";
  import NewPage from "./pages/NewPage.svelte";
  import NewsPage from "./pages/NewsPage.svelte";
  import NotFoundPage from "./pages/NotFoundPage.svelte";
  import SearchPage from "./pages/SearchPage.svelte";
  import TermsPage from "./pages/TermsPage.svelte";
  import ThreadPage from "./pages/ThreadPage.svelte";
  import UnbannedCheck from "./plugs/UnbannedCheck.svelte";

  const b = (b: string) => boardMap.get(b) ?? undefinedBoard;
</script>

<Router>
  <!-- 404ページ -->
  <Route path={makePathname("/*")}>
    <NotFoundPage />
  </Route>

  <!-- エラーページ -->
  <Route path={makePathname("/error")}>
    <ErrorPage />
  </Route>

  <!-- 直リンでは辿り着けないアク禁ページ -->
  <Route path={makePathname("/akukin")}>
    <UnbannedCheck>
      <BannedPage />
    </UnbannedCheck>
  </Route>

  <!-- エントリページ -->
  <Route path={makePathname("/")}>
    <HomePage />
  </Route>

  <!-- スレ一覧 -->
  <Route path={makePathname("/:board")} let:params>
    <HeadlinePage board={b(params.board)} />
  </Route>
  <!-- スレ個別 -->
  <Route path="{makePathname('/:board/thread')}/:threadId" let:params>
    <ThreadPage board={b(params.board)} threadId={params.threadId} />
  </Route>
  <Route path="{makePathname('/:board/thread')}/:threadId/:resNum" let:params>
    <ThreadPage
      board={b(params.board)}
      threadId={params.threadId}
      resNum={Number(params.resNum)}
    />
  </Route>
  <!-- Misskey -->
  <Route path={makePathname("/:board/misskey/:misskeyId")} let:params>
    <MisskeyPage board={b(params.board)} misskeyId={params.misskeyId} />
  </Route>

  <!-- スレ立て -->
  <Route path={makePathname("/:board/new")} let:params>
    <NewPage board={b(params.board)} />
  </Route>
  <Route path={makePathname("/:board/new/next")} let:params>
    <NewPage board={b(params.board)} isRef />
  </Route>
  <!-- 検索 -->
  <Route path={makePathname("/:board/search")} let:params>
    <SearchPage board={b(params.board)} />
  </Route>
  <!-- 履歴 -->
  <Route path={makePathname("/:board/history")} let:params>
    <HistoryPage board={b(params.board)} />
  </Route>
  <!-- 個人設定 -->
  <Route path={makePathname("/:board/config")} let:params>
    <ConfigPage board={b(params.board)} />
  </Route>

  <!-- 利用規約 -->
  <Route path={makePathname("/:board/terms")} let:params>
    <TermsPage board={b(params.board)} />
  </Route>
  <!-- お問い合わせ -->
  <Route path={makePathname("/:board/contact")} let:params>
    <ContactPage board={b(params.board)} />
  </Route>
  <!-- ブログ一覧 -->
  <Route path={makePathname("/:board/news")} let:params>
    <NewsPage board={b(params.board)} />
  </Route>
  <!-- ブログ個別 -->
  <Route path="{makePathname('/:board/news')}/:newsId" let:params>
    <ArticlePage board={b(params.board)} newsId={params.newsId} />
  </Route>
  <!-- TOP絵集 -->
  <Route path={makePathname("/:board/art")} let:params>
    <ArtPage board={b(params.board)} />
  </Route>
  <!-- リンク集 -->
  <Route path={makePathname("/:board/links")} let:params>
    <LinksPage board={b(params.board)} />
  </Route>
</Router>

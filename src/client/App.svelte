<script lang="ts">
  import "./global.css";
  import { Route, Router } from "svelte-routing";
  import { makePathname } from "./mylib/env.js";
  import ArtPage from "./pages/ArtPage.svelte";
  import ArticlePage from "./pages/ArticlePage.svelte";
  import BannedPage from "./pages/BannedPage.svelte";
  import BookmarkPage from "./pages/BookmarkPage.svelte";
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
  import TermsPage from "./pages/TermsPage.svelte";
  import ThreadPage from "./pages/ThreadPage.svelte";
  import UnbannedCheck from "./plugs/UnbannedCheck.svelte";
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

  <!-- エントリページ -->
  <Route path={makePathname("/")}>
    <HomePage />
  </Route>

  <!-- スレ一覧 -->
  <Route path={makePathname("/headline")}>
    <HeadlinePage />
  </Route>
  <!-- スレ個別 -->
  <Route path="{makePathname('/thread')}/:threadId" let:params>
    <ThreadPage threadId={params.threadId} />
  </Route>
  <Route path="{makePathname('/thread')}/:threadId/:cursor" let:params>
    <ThreadPage threadId={params.threadId} cursor={params.cursor} />
  </Route>
  <Route path="{makePathname('/thread')}/:threadId/:cursor/:desc" let:params>
    <ThreadPage
      threadId={params.threadId}
      cursor={params.cursor}
      desc={!!params.desc}
    />
  </Route>
  <!-- Misskey -->
  <Route path={makePathname("/misskey/inmusky")} let:params>
    <MisskeyPage misskeyId="inmusky" />
  </Route>
  <Route path={makePathname("/misskey/nukumori")} let:params>
    <MisskeyPage misskeyId="nukumori" />
  </Route>

  <!-- スレ立て -->
  <Route path={makePathname("/new")}>
    <NewPage />
  </Route>
  <Route path={makePathname("/new/next")}>
    <NewPage isRef />
  </Route>
  <!-- 履歴 -->
  <Route path={makePathname("/history")}>
    <HistoryPage />
  </Route>
  <!-- #後で見る -->
  <Route path={makePathname("/bookmark")}>
    <BookmarkPage />
  </Route>
  <!-- 個人設定 -->
  <Route path={makePathname("/config")}>
    <ConfigPage />
  </Route>

  <!-- 利用規約 -->
  <Route path={makePathname("/terms")}>
    <TermsPage />
  </Route>
  <!-- お問い合わせ -->
  <Route path={makePathname("/contact")}>
    <ContactPage />
  </Route>
  <!-- ブログ一覧 -->
  <Route path={makePathname("/news")}>
    <NewsPage />
  </Route>
  <!-- ブログ個別 -->
  <Route path="{makePathname('/news')}/:newsId" let:params>
    <ArticlePage newsId={params.newsId} />
  </Route>
  <!-- TOP絵集 -->
  <Route path={makePathname("/art")}>
    <ArtPage />
  </Route>
  <!-- リンク集 -->
  <Route path={makePathname("/links")}>
    <LinksPage />
  </Route>

  <!-- 直リンでは辿り着けない -->
  <Route path={makePathname("/akukin")}>
    <UnbannedCheck>
      <BannedPage />
    </UnbannedCheck>
  </Route>
</Router>

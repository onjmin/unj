<script lang="ts">
  import "./global.css";
  import { Route, Router } from "svelte-routing";
  import { base } from "./mylib/env.js";
  import ArtPage from "./pages/ArtPage.svelte";
  import BanCodeVerifyPage from "./pages/BanCodeVerifyPage.svelte";
  import BannedPage from "./pages/BannedPage.svelte";
  import BookmarkPage from "./pages/BookmarkPage.svelte";
  import ConfigPage from "./pages/ConfigPage.svelte";
  import ContactPage from "./pages/ContactPage.svelte";
  import ErrorPage from "./pages/ErrorPage.svelte";
  import HeadlinePage from "./pages/HeadlinePage.svelte";
  import HistoryPage from "./pages/HistoryPage.svelte";
  import HomePage from "./pages/HomePage.svelte";
  import LinksPage from "./pages/LinksPage.svelte";
  import NewPage from "./pages/NewPage.svelte";
  import NotFoundPage from "./pages/NotFoundPage.svelte";
  import TermsPage from "./pages/TermsPage.svelte";
  import ThreadPage from "./pages/ThreadPage.svelte";
  import UpdatePage from "./pages/UpdatePage.svelte";
  import BannedCheck from "./plugs/BannedCheck.svelte";
  import TraversalCheck from "./plugs/TraversalCheck.svelte";
  import UnbannedCheck from "./plugs/UnbannedCheck.svelte";
</script>

<Router>
  <!-- 404ページ -->
  <Route path={base("/*")}>
    <BannedCheck>
      <TraversalCheck>
        <NotFoundPage />
      </TraversalCheck>
    </BannedCheck>
  </Route>

  <!-- エラーページ -->
  <Route path={base("/error")}>
    <BannedCheck>
      <ErrorPage />
    </BannedCheck>
  </Route>

  <!-- エントリページ -->
  <Route path={base("/")}>
    <BannedCheck>
      <HomePage />
    </BannedCheck>
  </Route>

  <!-- ヘッドライン -->
  <Route path={base("/headline")}>
    <BannedCheck>
      <HeadlinePage />
    </BannedCheck>
  </Route>
  <!-- スレッド -->
  <Route path="{base('/thread')}/:threadId" let:params>
    <BannedCheck>
      <ThreadPage threadId={params.threadId} />
    </BannedCheck>
  </Route>
  <Route path="{base('/thread')}/:threadId/:resNum" let:params>
    <BannedCheck>
      <ThreadPage threadId={params.threadId} resNum={params.resNum} />
    </BannedCheck>
  </Route>

  <!-- スレ立て -->
  <Route path={base("/new")}>
    <BannedCheck>
      <NewPage />
    </BannedCheck>
  </Route>
  <Route path={base("/new/next")}>
    <BannedCheck>
      <NewPage isRef />
    </BannedCheck>
  </Route>
  <!-- 閲覧履歴 -->
  <Route path={base("/history")}>
    <BannedCheck>
      <HistoryPage />
    </BannedCheck>
  </Route>
  <!-- #後で見る -->
  <Route path={base("/bookmark")}>
    <BannedCheck>
      <BookmarkPage />
    </BannedCheck>
  </Route>
  <!-- 個人設定 -->
  <Route path={base("/config")}>
    <BannedCheck>
      <ConfigPage />
    </BannedCheck>
  </Route>

  <!-- 利用規約 -->
  <Route path={base("/terms")}>
    <BannedCheck>
      <TermsPage />
    </BannedCheck>
  </Route>
  <!-- お問い合わせ -->
  <Route path={base("/contact")}>
    <BannedCheck>
      <ContactPage />
    </BannedCheck>
  </Route>
  <!-- 新機能のお知らせ -->
  <Route path={base("/update")}>
    <BannedCheck>
      <UpdatePage />
    </BannedCheck>
  </Route>
  <!-- TOP絵集 -->
  <Route path={base("/art")}>
    <BannedCheck>
      <ArtPage />
    </BannedCheck>
  </Route>
  <!-- リンク集 -->
  <Route path={base("/links")}>
    <BannedCheck>
      <LinksPage />
    </BannedCheck>
  </Route>

  <!-- 直リンでは辿り着けない -->
  <Route path={base("/akukin")}>
    <UnbannedCheck>
      <BannedPage />
    </UnbannedCheck>
  </Route>
  <Route path={base("/akukin/kaijo")}>
    <UnbannedCheck>
      <BanCodeVerifyPage />
    </UnbannedCheck>
  </Route>
</Router>

<script lang="ts">
  import "./global.css";
  import { Route, Router } from "svelte-routing";
  import { makePathname } from "./mylib/env.js";
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
  import Preload from "./plugs/Preload.svelte";
  import TraversalCheck from "./plugs/TraversalCheck.svelte";
  import UnbannedCheck from "./plugs/UnbannedCheck.svelte";
</script>

<Preload>
  <Router>
    <!-- 404ページ -->
    <Route path={makePathname("/*")}>
      <BannedCheck>
        <TraversalCheck>
          <NotFoundPage />
        </TraversalCheck>
      </BannedCheck>
    </Route>

    <!-- エラーページ -->
    <Route path={makePathname("/error")}>
      <BannedCheck>
        <ErrorPage />
      </BannedCheck>
    </Route>

    <!-- エントリページ -->
    <Route path={makePathname("/")}>
      <BannedCheck>
        <HomePage />
      </BannedCheck>
    </Route>

    <!-- ヘッドライン -->
    <Route path={makePathname("/headline")}>
      <BannedCheck>
        <HeadlinePage />
      </BannedCheck>
    </Route>
    <!-- スレッド -->
    <Route path="{makePathname('/thread')}/:threadId" let:params>
      <BannedCheck>
        <ThreadPage threadId={params.threadId} />
      </BannedCheck>
    </Route>
    <Route path="{makePathname('/thread')}/:threadId/:cursor" let:params>
      <BannedCheck>
        <ThreadPage threadId={params.threadId} cursor={params.cursor} />
      </BannedCheck>
    </Route>
    <Route path="{makePathname('/thread')}/:threadId/:cursor/:desc" let:params>
      <BannedCheck>
        <ThreadPage
          threadId={params.threadId}
          cursor={params.cursor}
          desc={!!params.desc}
        />
      </BannedCheck>
    </Route>

    <!-- スレ立て -->
    <Route path={makePathname("/new")}>
      <BannedCheck>
        <NewPage />
      </BannedCheck>
    </Route>
    <Route path={makePathname("/new/next")}>
      <BannedCheck>
        <NewPage isRef />
      </BannedCheck>
    </Route>
    <!-- 閲覧履歴 -->
    <Route path={makePathname("/history")}>
      <BannedCheck>
        <HistoryPage />
      </BannedCheck>
    </Route>
    <!-- #後で見る -->
    <Route path={makePathname("/bookmark")}>
      <BannedCheck>
        <BookmarkPage />
      </BannedCheck>
    </Route>
    <!-- 個人設定 -->
    <Route path={makePathname("/config")}>
      <BannedCheck>
        <ConfigPage />
      </BannedCheck>
    </Route>

    <!-- 利用規約 -->
    <Route path={makePathname("/terms")}>
      <BannedCheck>
        <TermsPage />
      </BannedCheck>
    </Route>
    <!-- お問い合わせ -->
    <Route path={makePathname("/contact")}>
      <BannedCheck>
        <ContactPage />
      </BannedCheck>
    </Route>
    <!-- 新機能のお知らせ -->
    <Route path={makePathname("/update")}>
      <BannedCheck>
        <UpdatePage />
      </BannedCheck>
    </Route>
    <!-- TOP絵集 -->
    <Route path={makePathname("/art")}>
      <BannedCheck>
        <ArtPage />
      </BannedCheck>
    </Route>
    <!-- リンク集 -->
    <Route path={makePathname("/links")}>
      <BannedCheck>
        <LinksPage />
      </BannedCheck>
    </Route>

    <!-- 直リンでは辿り着けない -->
    <Route path={makePathname("/akukin")}>
      <UnbannedCheck>
        <BannedPage />
      </UnbannedCheck>
    </Route>
    <Route path={makePathname("/akukin/kaijo")}>
      <UnbannedCheck>
        <BanCodeVerifyPage />
      </UnbannedCheck>
    </Route>
  </Router>
</Preload>

<script lang="ts">
  import { Route, Router } from "svelte-routing";
  import BanCodeVerifyPage from "./pages/BanCodeVerifyPage.svelte";
  import BannedPage from "./pages/BannedPage.svelte";
  import BannerExhibitionPage from "./pages/BannerExhibitionPage.svelte";
  import BookmarkPage from "./pages/BookmarkPage.svelte";
  import ConfigPage from "./pages/ConfigPage.svelte";
  import ContactPage from "./pages/ContactPage.svelte";
  import HeadlinePage from "./pages/HeadlinePage.svelte";
  import HistoryPage from "./pages/HistoryPage.svelte";
  import HomePage from "./pages/HomePage.svelte";
  import NewPage from "./pages/NewPage.svelte";
  import NotFoundPage from "./pages/NotFoundPage.svelte";
  import ThreadPage from "./pages/ThreadPage.svelte";
  import UpdatePage from "./pages/UpdatePage.svelte";
  import BannedCheck from "./plugs/BannedCheck.svelte";
  import TraversalCheck from "./plugs/TraversalCheck.svelte";
  import UnbannedCheck from "./plugs/UnbannedCheck.svelte";
</script>

<Router>
  <Route path="/*">
    <BannedCheck>
      <TraversalCheck>
        <NotFoundPage />
      </TraversalCheck>
    </BannedCheck>
  </Route>

  <!-- エントリページ -->
  <Route path="/">
    <BannedCheck>
      <HomePage />
    </BannedCheck>
  </Route>
  <!-- ヘッドライン -->
  <Route path="/headline">
    <BannedCheck>
      <HeadlinePage />
    </BannedCheck>
  </Route>
  <!-- スレッド -->
  <Route path="/thread/:threadId">
    <BannedCheck>
      <ThreadPage />
    </BannedCheck>
  </Route>

  <!-- 右のハンバーガーボタンから遷移可能 -->
  <!-- スレ立て -->
  <Route path="/new">
    <BannedCheck>
      <NewPage />
    </BannedCheck>
  </Route>
  <!-- 履歴 -->
  <Route path="/history">
    <BannedCheck>
      <HistoryPage />
    </BannedCheck>
  </Route>
  <!-- 後で見る -->
  <Route path="/bookmark">
    <BannedCheck>
      <BookmarkPage />
    </BannedCheck>
  </Route>
  <!-- ユーザー設定 -->
  <Route path="/config">
    <BannedCheck>
      <ConfigPage />
    </BannedCheck>
  </Route>

  <!-- 左のハンバーガーボタンから遷移可能 -->
  <!-- 新機能のお知らせ -->
  <Route path="/update">
    <BannedCheck>
      <UpdatePage />
    </BannedCheck>
  </Route>
  <!-- 問い合わせ -->
  <Route path="/contact">
    <BannedCheck>
      <ContactPage />
    </BannedCheck>
  </Route>
  <!-- バナー展示場 -->
  <Route path="/banner">
    <BannedCheck>
      <BannerExhibitionPage />
    </BannedCheck>
  </Route>

  <!-- 直リンでは辿り着けない -->
  <Route path="/akukin">
    <UnbannedCheck>
      <BannedPage />
    </UnbannedCheck>
  </Route>
  <Route path="/akukin/kaijo">
    <UnbannedCheck>
      <BanCodeVerifyPage />
    </UnbannedCheck>
  </Route>
</Router>

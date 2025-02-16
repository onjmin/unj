<script lang="ts">
  import { Route, Router } from "svelte-routing";
  import BannedPage from "./pages/BannedPage.svelte";
  import BannerExhibitionPage from "./pages/BannerExhibitionPage.svelte";
  import HeadlinePage from "./pages/HeadlinePage.svelte";
  import HistoryPage from "./pages/HistoryPage.svelte";
  import HomePage from "./pages/HomePage.svelte";
  import NotFoundPage from "./pages/NotFoundPage.svelte";
  import ThreadPage from "./pages/ThreadPage.svelte";
</script>

<Router>
  <Route path="/*">
    <NotFoundPage />
  </Route>

  <Route path="/">
    <HomePage />
  </Route>
  <Route path="/headline">
    <HeadlinePage />
  </Route>
  <Route path="/thread/:threadId">
    <ThreadPage />
  </Route>
  <Route path="/history">
    <HistoryPage />
  </Route>
  <Route path="/banner">
    <BannerExhibitionPage />
  </Route>

  <!-- 直リンでは辿り着けない -->
  <Route path="/akukin">
    <BannedPage />
  </Route>

  <!-- 直リン攻撃対策 -->
  <Route path="/admin">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/login">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/wp-admin">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/wp-login">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/wp-json/wp/v2/users">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/administrator">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/joomla/administrator">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/user/login">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/drupal/node">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/typo3">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/vendor">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/public">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/dashboard">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/controlpanel">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/cms">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/cpanel">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
  <Route path="/auth">
    <BannedPage isReportPathnameScanAtack={true} />
  </Route>
</Router>

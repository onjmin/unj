<script lang="ts">
  import { Route, Router } from "svelte-routing";
  import BannedPage from "./pages/BannedPage.svelte";
  import BannerExhibitionPage from "./pages/BannerExhibitionPage.svelte";
  import Guard from "./pages/Guard.svelte";
  import HeadlinePage from "./pages/HeadlinePage.svelte";
  import HistoryPage from "./pages/HistoryPage.svelte";
  import HomePage from "./pages/HomePage.svelte";
  import NotFoundPage from "./pages/NotFoundPage.svelte";
  import ThreadPage from "./pages/ThreadPage.svelte";
</script>

<Guard>
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
  </Router>
</Guard>

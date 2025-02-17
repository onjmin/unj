<script lang="ts">
  import { Route, Router } from "svelte-routing";
  import BanCodeVerifyPage from "./pages/BanCodeVerifyPage.svelte";
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
      <Guard>
        <NotFoundPage />
      </Guard>
    </Route>

    <Route path="/">
      <Guard>
        <HomePage />
      </Guard>
    </Route>
    <Route path="/headline">
      <Guard>
        <HeadlinePage />
      </Guard>
    </Route>
    <Route path="/thread/:threadId">
      <Guard>
        <ThreadPage />
      </Guard>
    </Route>
    <Route path="/history">
      <Guard>
        <HistoryPage />
      </Guard>
    </Route>
    <Route path="/banner">
      <Guard>
        <BannerExhibitionPage />
      </Guard>
    </Route>

    <!-- 直リンでは辿り着けない -->
    <Route path="/akukin">
      <BannedPage />
    </Route>
    <Route path="/akukin/kaijo">
      <BanCodeVerifyPage />
    </Route>
  </Router>
</Guard>

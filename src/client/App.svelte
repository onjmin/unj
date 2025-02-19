<script lang="ts">
  import { Route, Router } from "svelte-routing";
  import BanCodeVerifyPage from "./pages/BanCodeVerifyPage.svelte";
  import BannedCheck from "./pages/BannedCheck.svelte";
  import BannedPage from "./pages/BannedPage.svelte";
  import BannerExhibitionPage from "./pages/BannerExhibitionPage.svelte";
  import HeadlinePage from "./pages/HeadlinePage.svelte";
  import HistoryPage from "./pages/HistoryPage.svelte";
  import HomePage from "./pages/HomePage.svelte";
  import NotFoundPage from "./pages/NotFoundPage.svelte";
  import ThreadPage from "./pages/ThreadPage.svelte";
  import TraversalCheck from "./pages/TraversalCheck.svelte";
  import UnbannedCheck from "./pages/UnbannedCheck.svelte";
</script>

<Router>
  <Route path="/*">
    <BannedCheck>
      <TraversalCheck>
        <NotFoundPage />
      </TraversalCheck>
    </BannedCheck>
  </Route>

  <Route path="/">
    <BannedCheck>
      <HomePage />
    </BannedCheck>
  </Route>
  <Route path="/headline">
    <BannedCheck>
      <HeadlinePage />
    </BannedCheck>
  </Route>
  <Route path="/thread/:threadId">
    <BannedCheck>
      <ThreadPage />
    </BannedCheck>
  </Route>
  <Route path="/history">
    <BannedCheck>
      <HistoryPage />
    </BannedCheck>
  </Route>
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

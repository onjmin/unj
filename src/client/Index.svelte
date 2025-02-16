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
  <Route path="/">
    <HomePage />
  </Route>
  <Route path="/akukin">
    <BannedPage />
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
  <Route path="/*">
    <NotFoundPage />
  </Route>
</Router>

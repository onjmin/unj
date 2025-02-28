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

  const NotFoundPagePath = base("/*");
  const HomePagePath = base("/");
  const HeadlinePagePath = base("/headline");
  const ThreadPagePath = base("/thread");
  const NewPagePath = base("/new");
  const HistoryPagePath = base("/history");
  const BookmarkPagePath = base("/bookmark");
  const ConfigPagePath = base("/config");
  const TermsPagePath = base("/terms");
  const ContactPagePath = base("/contact");
  const UpdatePagePath = base("/update");
  const ArtPagePath = base("/art");
  const LinksPagePath = base("/links");
  const AkukinPagePath = base("/akukin");
  const AkukinKaijoPagePath = base("/akukin/kaijo");
</script>

<Router>
  <Route path={NotFoundPagePath}>
    <BannedCheck>
      <TraversalCheck>
        <NotFoundPage />
      </TraversalCheck>
    </BannedCheck>
  </Route>

  <!-- エントリページ -->
  <Route path={HomePagePath}>
    <BannedCheck>
      <HomePage />
    </BannedCheck>
  </Route>

  <!-- ヘッドライン -->
  <Route path={HeadlinePagePath}>
    <BannedCheck>
      <HeadlinePage />
    </BannedCheck>
  </Route>
  <!-- スレッド -->
  <Route path="{ThreadPagePath}/:threadId" let:params>
    <BannedCheck>
      <ThreadPage threadId={params.threadId} />
    </BannedCheck>
  </Route>
  <Route path="{ThreadPagePath}/:threadId/:resNum" let:params>
    <BannedCheck>
      <ThreadPage threadId={params.threadId} resNum={params.resNum} />
    </BannedCheck>
  </Route>

  <!-- スレ立て -->
  <Route path={NewPagePath}>
    <BannedCheck>
      <NewPage />
    </BannedCheck>
  </Route>
  <Route path="{NewPagePath}/:refThreadId" let:params>
    <BannedCheck>
      <NewPage refThreadId={params.refThreadId} />
    </BannedCheck>
  </Route>
  <!-- 閲覧履歴 -->
  <Route path={HistoryPagePath}>
    <BannedCheck>
      <HistoryPage />
    </BannedCheck>
  </Route>
  <!-- #後で見る -->
  <Route path={BookmarkPagePath}>
    <BannedCheck>
      <BookmarkPage />
    </BannedCheck>
  </Route>
  <!-- 個人設定 -->
  <Route path={ConfigPagePath}>
    <BannedCheck>
      <ConfigPage />
    </BannedCheck>
  </Route>

  <!-- 利用規約 -->
  <Route path={TermsPagePath}>
    <BannedCheck>
      <TermsPage />
    </BannedCheck>
  </Route>
  <!-- お問い合わせ -->
  <Route path={ContactPagePath}>
    <BannedCheck>
      <ContactPage />
    </BannedCheck>
  </Route>
  <!-- 新機能のお知らせ -->
  <Route path={UpdatePagePath}>
    <BannedCheck>
      <UpdatePage />
    </BannedCheck>
  </Route>
  <!-- バナー展示場 -->
  <Route path={ArtPagePath}>
    <BannedCheck>
      <ArtPage />
    </BannedCheck>
  </Route>
  <!-- リンク集 -->
  <Route path={LinksPagePath}>
    <BannedCheck>
      <LinksPage />
    </BannedCheck>
  </Route>

  <!-- 直リンでは辿り着けない -->
  <Route path={AkukinPagePath}>
    <UnbannedCheck>
      <BannedPage />
    </UnbannedCheck>
  </Route>
  <Route path={AkukinKaijoPagePath}>
    <UnbannedCheck>
      <BanCodeVerifyPage />
    </UnbannedCheck>
  </Route>
</Router>

import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import NewsletterFooter from "./components/NewsletterFooter";

const CommandPalette = lazy(() => import("./components/CommandPalette"));
const TrendingPage = lazy(() => import("./pages/TrendingPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const RepoDetailPage = lazy(() => import("./pages/RepoDetailPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const AiFinderPage = lazy(() => import("./pages/AiFinderPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const AlternativesPage = lazy(() => import("./pages/AlternativesPage"));
const PaidToolPage = lazy(() => import("./pages/PaidToolPage"));
const SubmitPage = lazy(() => import("./pages/SubmitPage"));
const AdvertisePage = lazy(() => import("./pages/AdvertisePage"));
const McpPage = lazy(() => import("./pages/McpPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const StacksPage = lazy(() => import("./pages/StacksPage"));
const LicensesPage = lazy(() => import("./pages/LicensesPage"));
const ReleasesFeedPage = lazy(() => import("./pages/ReleasesFeedPage"));
const StackBuilderPage = lazy(() => import("./pages/StackBuilderPage"));
const AdminQueuePage = lazy(() => import("./pages/AdminQueuePage"));
const AuditsPage = lazy(() => import("./pages/AuditsPage"));
const StackAuditPage = lazy(() => import("./pages/StackAuditPage"));
const ListsIndexPage = lazy(() => import("./pages/ListsPage").then((m) => ({ default: m.ListsIndexPage })));
const ListDetailPage = lazy(() => import("./pages/ListsPage").then((m) => ({ default: m.ListDetailPage })));
const LearnListPage = lazy(() => import("./pages/LearnPages").then((m) => ({ default: m.LearnListPage })));
const LearnArticlePage = lazy(() => import("./pages/LearnPages").then((m) => ({ default: m.LearnArticlePage })));
const BlogListPage = lazy(() => import("./pages/BlogPages").then((m) => ({ default: m.BlogListPage })));
const BlogPostPage = lazy(() => import("./pages/BlogPages").then((m) => ({ default: m.BlogPostPage })));

function HeaderWithPalette() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const openPalette = () => setOpen(true);
    // Global Ctrl/Cmd+K — lives HERE because the palette is only mounted while
    // open; a listener inside CommandPalette could never open a closed palette.
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("osh:open-palette", openPalette);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("osh:open-palette", openPalette);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <Header />
      {open && (
        <Suspense fallback={null}>
          <CommandPalette open={open} onOpenChange={setOpen} key={location.pathname} />
        </Suspense>
      )}
    </>
  );
}

function RouteFallback() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-16">
      <div className="skeleton h-8 w-48 mb-4" />
      <div className="skeleton h-4 w-full max-w-xl" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-base">
        <HeaderWithPalette />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<TrendingPage />} />
            <Route path="/find" element={<AiFinderPage />} />
            <Route path="/audits" element={<AuditsPage />} />
            <Route path="/stack-audit" element={<StackAuditPage />} />
            <Route path="/lists" element={<ListsIndexPage />} />
            <Route path="/lists/:slug" element={<ListDetailPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/learn" element={<LearnListPage />} />
            <Route path="/tools" element={<Navigate to="/learn" replace />} />
            <Route path="/resources" element={<Navigate to="/learn" replace />} />
            <Route path="/learn/:slug" element={<LearnArticlePage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/mcp" element={<McpPage />} />
            <Route path="/releases" element={<ReleasesFeedPage />} />
            <Route path="/stacks" element={<StacksPage />} />
            <Route path="/stacks/builder" element={<StackBuilderPage />} />
            <Route path="/stacks/share" element={<StackBuilderPage />} />
            <Route path="/licenses" element={<LicensesPage />} />
            <Route path="/alternatives" element={<AlternativesPage />} />
            <Route path="/alternatives/:slug" element={<PaidToolPage />} />
            <Route path="/compare/:a/vs/:b" element={<ComparePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/repo/:owner/:name" element={<RepoDetailPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/advertise" element={<AdvertisePage />} />
            <Route path="/admin" element={<AdminQueuePage />} />
            <Route
              path="*"
              element={
                <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
                  <p className="font-display text-display-lg">Lost in space</p>
                  <p className="text-dim mt-2">That page doesn't exist.</p>
                </div>
              }
            />
          </Routes>
        </Suspense>
        <NewsletterFooter />
        <footer className="border-t border-line mt-4">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-[12px] text-faint">
            <p>
              OpenSource Hub — runs entirely on your machine. Data refreshed daily from public GitHub sources.
            </p>
            <p className="tnum">v0.1.0 · MIT</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

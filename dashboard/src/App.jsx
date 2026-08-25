import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import CommandPalette from "./components/CommandPalette";
import TrendingPage from "./pages/TrendingPage";
import FavoritesPage from "./pages/FavoritesPage";
import RepoDetailPage from "./pages/RepoDetailPage";
import AiFinderPage from "./pages/AiFinderPage";
import AuditsPage from "./pages/AuditsPage";
import StackAuditPage from "./pages/StackAuditPage";
import { ListsIndexPage, ListDetailPage } from "./pages/ListsPage";
import { LearnListPage, LearnArticlePage } from "./pages/LearnPages";

function HeaderWithPalette() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const openPalette = () => setOpen(true);
    window.addEventListener("osh:open-palette", openPalette);
    return () => window.removeEventListener("osh:open-palette", openPalette);
  }, []);

  return (
    <>
      <Header onSearch={() => setOpen(true)} />
      <CommandPalette open={open} onOpenChange={setOpen} key={location.pathname} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-base mesh-glow-bg">
        <HeaderWithPalette />
        <Routes>
          <Route path="/" element={<TrendingPage />} />
          <Route path="/find" element={<AiFinderPage />} />
          <Route path="/audits" element={<AuditsPage />} />
          <Route path="/stack-audit" element={<StackAuditPage />} />
          <Route path="/lists" element={<ListsIndexPage />} />
          <Route path="/lists/:slug" element={<ListDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/learn" element={<LearnListPage />} />
          <Route path="/learn/:slug" element={<LearnArticlePage />} />
          <Route path="/repo/:owner/:name" element={<RepoDetailPage />} />
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
        <footer className="border-t border-line mt-8">
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

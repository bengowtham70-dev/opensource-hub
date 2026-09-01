import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
  Flame,
  Star,
  Server,
  Bot,
  Shield,
  Send,
  BookOpen,
  Sparkles,
  Layers,
  FileCode,
  Bell,
  Newspaper,
  Cpu,
  Scale,
  ListChecks,
  Key,
  Lightbulb,
} from "lucide-react";
import { paletteKeyLabel } from "../lib/platform";
import { api } from "../lib/api";
import ApiKeyModal from "./ApiKeyModal";

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("osh-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="btn-tactile grid place-items-center size-9 rounded-full border border-line bg-surface text-dim hover:text-ink hover:border-line-strong transition-all duration-200"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <span className="relative block size-[16px]">
        <Sun
          size={16}
          className={`absolute inset-0 transition-all duration-200 ease-out ${
            dark ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <Moon
          size={16}
          className={`absolute inset-0 transition-all duration-200 ease-out ${
            dark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
          }`}
        />
      </span>
    </button>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [ghStatus, setGhStatus] = useState(null);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const q = params.get("q") || "";

  const collectionsRef = useRef(null);
  const resourcesRef = useRef(null);

  const refreshGhStatus = () => {
    api.githubStatus().then(setGhStatus).catch(() => {});
  };

  useEffect(() => {
    refreshGhStatus();
    const handleOpen = () => setApiKeyModalOpen(true);
    window.addEventListener("osh:open-github-key", handleOpen);
    return () => window.removeEventListener("osh:open-github-key", handleOpen);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (collectionsRef.current && !collectionsRef.current.contains(e.target)) {
        setCollectionsOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(e.target)) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMenuOpen(false);
    setCollectionsOpen(false);
    setResourcesOpen(false);
  }, [location.pathname]);

  const onSearchInput = (e) => {
    const v = e.target.value;
    const next = new URLSearchParams(params);
    if (v) next.set("q", v);
    else next.delete("q");
    if (location.pathname !== "/") navigate(`/?${next.toString()}`, { replace: true });
    else setParams(next, { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-base/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 h-[68px] flex items-center justify-between gap-4">
        {/* 1. Left: Official Raccoon Mascot Logo + Title */}
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="OpenSource Hub home">
            <img
              src="/logo.png"
              alt="OpenSource Hub Logo"
              className="size-8 rounded-lg object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              OpenSource Hub
            </span>
          </NavLink>

          {/* 2. Center: Navigation Links matching OpenAlternative */}
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
            <NavLink
              to="/alternatives"
              className={({ isActive }) =>
                `btn-tactile px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-ink" : "text-dim hover:text-ink hover:bg-elevated"
                }`
              }
            >
              Alternatives
            </NavLink>

            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `btn-tactile px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-ink" : "text-dim hover:text-ink hover:bg-elevated"
                }`
              }
            >
              Categories
            </NavLink>

            <NavLink
              to="/releases"
              className={({ isActive }) =>
                `btn-tactile px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-ink" : "text-dim hover:text-ink hover:bg-elevated"
                }`
              }
            >
              Releases
            </NavLink>

            {/* Collections Dropdown */}
            <div className="relative" ref={collectionsRef}>
              <button
                type="button"
                onClick={() => {
                  setCollectionsOpen((v) => !v);
                  setResourcesOpen(false);
                }}
                className={`btn-tactile inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  collectionsOpen ? "bg-primary/10 text-ink" : "text-dim hover:text-ink hover:bg-elevated"
                }`}
              >
                <span>Collections</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-150 ${collectionsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {collectionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 p-1.5 rounded-2xl border border-line bg-surface shadow-float animate-card-in z-50">
                  <NavLink
                    to="/lists"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                  >
                    <ListChecks size={15} className="text-ink shrink-0" />
                    <span>Curated Lists</span>
                  </NavLink>
                  <NavLink
                    to="/watchlist"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                  >
                    <Bell size={15} className="text-accent shrink-0" />
                    <span>Your Watchlist</span>
                  </NavLink>
                  <NavLink
                    to="/?sort=trending"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                  >
                    <Flame size={15} className="text-ink shrink-0" />
                    <span>Trending Repositories</span>
                  </NavLink>
                  <NavLink
                    to="/?sort=stars"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                  >
                    <Star size={15} className="text-ink shrink-0" />
                    <span>Top Starred Projects</span>
                  </NavLink>
                  <NavLink
                    to="/?platform=self-host"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                  >
                    <Server size={15} className="text-ink shrink-0" />
                    <span>Self-Hosted Stacks</span>
                  </NavLink>
                  <NavLink
                    to="/?category=ai"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                  >
                    <Bot size={15} className="text-ink shrink-0" />
                    <span>AI & Agents</span>
                  </NavLink>
                  <NavLink
                    to="/audits"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                  >
                    <Shield size={15} className="text-ink shrink-0" />
                    <span>Security & Trust Audits</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Tools Dropdown */}
            <div className="relative" ref={resourcesRef}>
              <button
                type="button"
                onClick={() => {
                  setResourcesOpen((v) => !v);
                  setCollectionsOpen(false);
                }}
                className={`btn-tactile inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  resourcesOpen ? "bg-primary/10 text-ink" : "text-dim hover:text-ink hover:bg-elevated"
                }`}
              >
                <span>Tools</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-150 ${resourcesOpen ? "rotate-180" : ""}`}
                />
              </button>

              {resourcesOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl border border-line bg-surface shadow-float animate-card-in z-50 space-y-2">
                  <div className="space-y-1">
                    <div className="px-3 pt-1.5 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-faint">
                      Problem & Decision Tools
                    </div>
                    <NavLink
                      to="/learn"
                      className="flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors group"
                    >
                      <Lightbulb size={16} className="text-trust shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-ink group-hover:text-ember transition-colors">
                          Grasp the Problem
                        </div>
                        <div className="text-[11px] text-faint">Why SaaS is expensive & how to escape</div>
                      </div>
                    </NavLink>
                    <NavLink
                      to="/find"
                      className="flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors group"
                    >
                      <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-ink group-hover:text-ember transition-colors">
                          AI Alternative Finder
                        </div>
                        <div className="text-[11px] text-faint">Describe needs in plain language</div>
                      </div>
                    </NavLink>
                    <NavLink
                      to="/stack-audit"
                      className="flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors group"
                    >
                      <Layers size={16} className="text-ink shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-ink group-hover:text-ember transition-colors">
                          Stack Cost Audit
                        </div>
                        <div className="text-[11px] text-faint">Calculate 5-year savings on your stack</div>
                      </div>
                    </NavLink>
                    <NavLink
                      to="/stacks/builder"
                      className="flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors group"
                    >
                      <Sparkles size={16} className="text-ember shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-ink group-hover:text-ember transition-colors">
                          Stack Builder &amp; Share
                        </div>
                        <div className="text-[11px] text-faint">Build custom stack + Docker Compose</div>
                      </div>
                    </NavLink>
                  </div>

                  <div className="pt-1.5 border-t border-line space-y-1">
                    <div className="px-3 pt-1 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-faint">
                      Directories & Guides
                    </div>
                    <NavLink
                      to="/stacks"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                    >
                      <Layers size={14} className="text-dim shrink-0" />
                      <span>Tech Stacks Directory</span>
                    </NavLink>
                    <NavLink
                      to="/licenses"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                    >
                      <Scale size={14} className="text-dim shrink-0" />
                      <span>License Safety Guide</span>
                    </NavLink>
                    <NavLink
                      to="/mcp"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                    >
                      <Cpu size={14} className="text-accent shrink-0" />
                      <span>MCP AI Server Hub</span>
                    </NavLink>
                    <NavLink
                      to="/blog"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                    >
                      <Newspaper size={14} className="text-dim shrink-0" />
                      <span>Editorial Blog</span>
                    </NavLink>
                    <NavLink
                      to="/submit"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                    >
                      <Send size={14} className="text-dim shrink-0" />
                      <span>Submit Open Source Tool</span>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/advertise"
              className={({ isActive }) =>
                `btn-tactile px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-ink" : "text-dim hover:text-ink hover:bg-elevated"
                }`
              }
            >
              Advertise
            </NavLink>
          </nav>
        </div>

        {/* 3. Right: Search Input + GitHub Key / Sign In + Theme Toggle + Submit Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Box */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-line bg-base/60 px-3 py-1.5 text-sm w-36 lg:w-44 xl:w-52 focus-within:border-line-strong focus-within:bg-surface transition-colors shrink">
            <Search size={14} className="text-faint shrink-0" />
            <input
              type="search"
              value={q}
              onChange={onSearchInput}
              placeholder="Search tools..."
              aria-label="Search tools by keyword or paid name"
              className="w-full bg-transparent outline-none text-dim placeholder:text-faint focus:text-ink text-xs md:text-sm"
            />
            <kbd className="shrink-0 tnum text-[10px] px-1.5 py-0.5 rounded-sm border border-line bg-surface text-faint">
              {paletteKeyLabel()}
            </kbd>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("osh:focus-hero-search"))}
            aria-label="Search alternatives"
            className="btn-tactile md:hidden grid place-items-center size-9 rounded-full border border-line bg-surface text-dim hover:text-ink hover:border-line-strong shrink-0"
          >
            <Search size={16} />
          </button>

          {/* GitHub Key / Rate Limit Pill (shown if connected without full user profile) */}
          {ghStatus?.hasToken && !ghStatus?.user?.login && (
            <button
              type="button"
              onClick={() => setApiKeyModalOpen(true)}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500/50 text-xs font-medium transition-colors"
              title={`GitHub Connected: ${ghStatus.rateLimit.remaining}/${ghStatus.rateLimit.limit} req/hr`}
            >
              <Key size={13} className="text-emerald-500" />
              <span className="hidden sm:inline">
                <span className="tnum font-semibold">{ghStatus.rateLimit.remaining}</span>
                <span className="text-[11px] opacity-75">/{ghStatus.rateLimit.limit}</span>
              </span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Submit Pill Button */}
          <NavLink
            to="/submit"
            className="btn-tactile hidden sm:inline-flex items-center px-3 py-1.5 rounded-full border border-line bg-surface hover:border-line-strong hover:bg-elevated text-xs md:text-sm font-medium text-ink transition-colors"
          >
            Submit
          </NavLink>

          {/* Sign In / GitHub Profile Pill */}
          {ghStatus?.user?.login ? (
            <NavLink
              to="/favorites"
              className="btn-tactile inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-ink text-surface hover:opacity-90 text-xs md:text-sm font-medium whitespace-nowrap shrink-0 transition-opacity shadow-xs"
              title={`Signed in as @${ghStatus.user.login} (${ghStatus.rateLimit?.remaining ?? 0}/${ghStatus.rateLimit?.limit ?? 5000} req/hr)`}
            >
              {ghStatus.user.avatar_url && (
                <img
                  src={ghStatus.user.avatar_url}
                  alt={ghStatus.user.login}
                  className="size-4 rounded-full border border-white/30 shrink-0"
                />
              )}
              <span className="whitespace-nowrap">@{ghStatus.user.login}</span>
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={() => setApiKeyModalOpen(true)}
              className="btn-tactile inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-ink text-surface hover:opacity-90 text-xs md:text-sm font-medium whitespace-nowrap shrink-0 transition-opacity shadow-xs cursor-pointer"
              aria-label="Sign In with GitHub"
            >
              <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span className="whitespace-nowrap">Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="btn-tactile lg:hidden grid place-items-center size-9 rounded-full border border-line bg-surface text-dim hover:text-ink hover:border-line-strong"
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Sheet */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="lg:hidden border-b border-line bg-surface shadow-float"
        >
          <div className="mx-auto max-w-[1400px] px-4 py-3 flex flex-col gap-1 text-sm">
            <NavLink
              to="/alternatives"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Alternatives
            </NavLink>
            <NavLink
              to="/categories"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Categories
            </NavLink>
            <NavLink
              to="/lists"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Curated Lists
            </NavLink>
            <NavLink
              to="/watchlist"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Your Watchlist
            </NavLink>
            <NavLink
              to="/blog"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Editorial Blog
            </NavLink>
            <NavLink
              to="/mcp"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              MCP AI Hub
            </NavLink>
            <NavLink
              to="/stacks"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Tech Stacks
            </NavLink>
            <NavLink
              to="/licenses"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              License Compliance
            </NavLink>
            <NavLink
              to="/find"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              AI Finder
            </NavLink>
            <NavLink
              to="/stack-audit"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Stack Audit
            </NavLink>
            <NavLink
              to="/learn"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Tools & Decision Guides
            </NavLink>
            <NavLink
              to="/advertise"
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Advertise
            </NavLink>
            <div className="pt-2 border-t border-line flex flex-col sm:flex-row gap-2">
              <NavLink
                to="/submit"
                className="w-full text-center py-2 rounded-xl border border-line text-ink font-medium text-xs md:text-sm hover:bg-elevated transition-colors"
              >
                Submit Tool
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setApiKeyModalOpen(true);
                }}
                className="w-full text-center py-2 rounded-xl bg-ink text-surface font-medium text-xs md:text-sm hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>{ghStatus?.user?.login ? `@${ghStatus.user.login}` : "Sign In with GitHub"}</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* GitHub API Key Modal */}
      <ApiKeyModal
        open={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onStatusChange={setGhStatus}
      />
    </header>
  );
}
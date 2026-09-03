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
  Globe,
  Check,
  Code2,
} from "lucide-react";
import { paletteKeyLabel } from "../lib/platform";
import { api } from "../lib/api";
import { formatStars } from "../lib/format";
import ApiKeyModal from "./ApiKeyModal";
import { useI18n, SUPPORTED_LANGUAGES } from "../lib/i18n";

function LanguagePicker() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-line bg-surface text-dim hover:text-ink text-xs font-medium cursor-pointer"
      >
        <Globe size={13} className="text-dim shrink-0" />
        <span className="uppercase text-[11px] font-semibold">{current.code}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-line bg-surface shadow-float p-1.5 z-50 text-xs space-y-0.5">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLocale(lang.code);
                setOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                locale === lang.code ? "bg-ember/10 text-ember font-semibold" : "text-dim hover:text-ink hover:bg-elevated"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-elevated text-faint uppercase font-bold">{lang.country || lang.code}</span>
                <span>{lang.label}</span>
              </span>
              {locale === lang.code && <Check size={12} className="text-ember shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  const toggle = () => {
    if (typeof document === "undefined") return;
    const nextDark = !dark;
    const root = document.documentElement;

    // Fast-path: synchronously toggle theme without multi-card reflow transition lag
    root.classList.add("disable-transitions");
    root.classList.toggle("dark", nextDark);
    setDark(nextDark);

    try {
      localStorage.setItem("osh-theme", nextDark ? "dark" : "light");
    } catch {}

    // Restore standard hover interactions on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove("disable-transitions");
      });
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-tactile grid place-items-center size-9 rounded-full border border-line bg-surface text-dim hover:text-ink hover:border-line-strong transition-colors duration-150 cursor-pointer"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <span className="relative block size-[16px]">
        <Sun
          size={16}
          className={`absolute inset-0 transition-all duration-150 ease-out ${
            dark ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <Moon
          size={16}
          className={`absolute inset-0 transition-all duration-150 ease-out ${
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

  const [searchTerm, setSearchTerm] = useState(q);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const searchContainerRef = useRef(null);
  const searchDebounce = useRef(null);

  // Sync searchTerm when URL q param changes externally
  useEffect(() => {
    setSearchTerm(q);
  }, [q]);

  // Debounced live 26k+ catalog autocomplete
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setAutocompleteResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      try {
        const data = await api.catalog({ q: trimmed, limit: 6, sort: "stars" });
        setAutocompleteResults(data.results || []);
      } catch {
        setAutocompleteResults([]);
      } finally {
        setSearching(false);
      }
    }, 120);

    return () => clearTimeout(searchDebounce.current);
  }, [searchTerm]);

  // Close autocomplete on click outside
  useEffect(() => {
    function handleSearchClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setAutocompleteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleSearchClickOutside);
    return () => document.removeEventListener("mousedown", handleSearchClickOutside);
  }, []);

  const onSearchInput = (e) => {
    const v = e.target.value;
    setSearchTerm(v);
    setSelectedIndex(-1);
    if (v.trim()) setAutocompleteOpen(true);
    else setAutocompleteOpen(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setAutocompleteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!autocompleteOpen && autocompleteResults.length > 0) {
        setAutocompleteOpen(true);
        setSelectedIndex(0);
      } else if (autocompleteResults.length > 0) {
        setSelectedIndex((idx) => (idx + 1 < autocompleteResults.length ? idx + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (autocompleteResults.length > 0) {
        setSelectedIndex((idx) => (idx - 1 >= 0 ? idx - 1 : autocompleteResults.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (autocompleteOpen && selectedIndex >= 0 && autocompleteResults[selectedIndex]) {
        const sel = autocompleteResults[selectedIndex];
        const targetRepo = sel.alternative?.repo || sel.repo;
        setAutocompleteOpen(false);
        navigate(`/repo/${targetRepo}`);
      } else {
        setAutocompleteOpen(false);
        const next = new URLSearchParams(params);
        if (searchTerm.trim()) next.set("q", searchTerm.trim());
        else next.delete("q");
        if (location.pathname !== "/") navigate(`/?${next.toString()}`);
        else setParams(next, { replace: true });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md transition-colors duration-200">
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
          <nav aria-label="Primary" className="hidden xl:flex items-center gap-1 shrink-0">
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

                    <NavLink
                      to="/advertise"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-dim hover:text-ink hover:bg-elevated transition-colors"
                    >
                      <Sparkles size={14} className="text-dim shrink-0" />
                      <span>Advertise with Us</span>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/advertise"
              className={({ isActive }) =>
                `btn-tactile hidden 2xl:inline-flex px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
          {/* Search Box with Live 26,000+ Catalog Autocomplete */}
          <div
            ref={searchContainerRef}
            className="relative hidden lg:block"
          >
            <div className="flex items-center gap-2 rounded-full border border-line bg-canvas/60 px-3 py-1.5 text-sm w-36 xl:w-52 focus-within:border-line-strong focus-within:bg-surface transition-colors">
              <Search size={14} className="text-faint shrink-0" />
              <input
                type="search"
                value={searchTerm}
                onChange={onSearchInput}
                onFocus={() => {
                  if (searchTerm.trim()) setAutocompleteOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search tools..."
                aria-label="Search tools by keyword or paid name"
                className="w-full bg-transparent outline-none text-dim placeholder:text-faint focus:text-ink text-xs md:text-sm"
              />
              <kbd className="shrink-0 tnum text-[10px] px-1.5 py-0.5 rounded-sm border border-line bg-surface text-faint">
                {paletteKeyLabel()}
              </kbd>
            </div>

            {/* Floating Autocomplete Dropdown */}
            {autocompleteOpen && searchTerm.trim() && (
              <div className="absolute top-full right-0 mt-2.5 w-88 sm:w-96 rounded-2xl border border-line bg-surface shadow-2xl p-2 z-50 animate-card-in">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-line text-[11px] font-semibold text-faint uppercase tracking-wider">
                  <span>Top Matches (26,000+ Catalog)</span>
                  {searching && <span className="size-3 rounded-full border-2 border-line border-t-ink animate-spin" />}
                </div>

                {autocompleteResults.length === 0 && !searching ? (
                  <div className="px-3 py-4 text-center text-xs text-dim">
                    No direct matches found for <strong className="text-ink">"{searchTerm}"</strong>. Press <kbd className="px-1 py-0.5 rounded border border-line bg-elevated font-sans">Enter</kbd> to search everything.
                  </div>
                ) : (
                  <div className="py-1 space-y-0.5 max-h-80 overflow-y-auto">
                    {autocompleteResults.map((item, idx) => {
                      const a = item.alternative || {};
                      const targetRepo = a.repo || item.repo;
                      const starsCount = a.stars ?? item.stars ?? 0;
                      const isSelected = selectedIndex === idx;

                      return (
                        <button
                          key={targetRepo}
                          type="button"
                          onClick={() => {
                            setAutocompleteOpen(false);
                            navigate(`/repo/${targetRepo}`);
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-ink text-surface dark:bg-surface dark:text-ink shadow-xs"
                              : "hover:bg-elevated text-dim hover:text-ink"
                          }`}
                        >
                          <div className="size-7 rounded-lg bg-elevated border border-line grid place-items-center text-ink shrink-0">
                            <Code2 size={13} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs truncate text-ink">{a.name || item.name}</span>
                              {a.language && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-elevated border border-line text-dim font-medium shrink-0">
                                  {a.language}
                                </span>
                              )}
                              {starsCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold tnum text-ink shrink-0 ml-auto">
                                  <Star size={10} className="text-amber-400 fill-amber-400" />
                                  {formatStars(starsCount)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-faint truncate mt-0.5">{a.description || targetRepo}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-line mt-1 pt-2 px-3 pb-1 flex items-center justify-between text-[11px] text-faint">
                  <span>Explore on Trending</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    Press <kbd className="px-1 py-0.5 rounded border border-line bg-elevated font-sans">↵ Enter</kbd>
                  </span>
                </div>
              </div>
            )}
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

          {/* Language Picker */}
          <LanguagePicker />

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
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Alternatives
            </NavLink>
            <NavLink
              to="/categories"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Categories
            </NavLink>
            <NavLink
              to="/lists"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Curated Lists
            </NavLink>
            <NavLink
              to="/watchlist"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Your Watchlist
            </NavLink>
            <NavLink
              to="/blog"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Editorial Blog
            </NavLink>
            <NavLink
              to="/mcp"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              MCP AI Hub
            </NavLink>
            <NavLink
              to="/stacks"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Tech Stacks
            </NavLink>
            <NavLink
              to="/licenses"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              License Compliance
            </NavLink>
            <NavLink
              to="/find"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              AI Finder
            </NavLink>
            <NavLink
              to="/stack-audit"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Stack Audit
            </NavLink>
            <NavLink
              to="/learn"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Tools & Decision Guides
            </NavLink>
            <NavLink
              to="/advertise"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-dim hover:text-ink hover:bg-elevated"
            >
              Advertise
            </NavLink>
            <div className="pt-2 border-t border-line flex flex-col sm:flex-row gap-2">
              <NavLink
                to="/submit"
                onClick={() => setMenuOpen(false)}
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
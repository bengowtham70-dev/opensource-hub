import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Trophy,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  ArrowUpDown,
  Target,
  Globe,
  Zap,
  Loader2,
  Sparkles,
} from "lucide-react";
import { api } from "../lib/api";
import { getPairings } from "../lib/seed";
import RepoCard from "../components/RepoCard";
import InstallPill from "../components/InstallPill";
import FilterDrawer from "../components/FilterDrawer";
import AlertsBanner from "../components/AlertsBanner";
import HistoryStrip from "../components/HistoryStrip";
import { GridSkeleton, EmptyState, ErrorState } from "../components/states";

function useDebounced(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function openGlobalPalette() {
  window.dispatchEvent(new CustomEvent("osh:open-palette"));
}

const SORT_OPTIONS = [
  { id: "trending", label: "Trending / Velocity" },
  { id: "stars", label: "Most Stars" },
  { id: "latest", label: "Latest Added" },
  { id: "commit", label: "Last Commit" },
  { id: "name-asc", label: "Name (A to Z)" },
  { id: "name-desc", label: "Name (Z to A)" },
  { id: "forks", label: "Most Popular" },
];

const TIMEFRAME_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
  { id: "all-time", label: "All Time" },
  { id: "least", label: "Hidden Gems" },
];

export default function TrendingPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") || "today";
  const sort = params.get("sort") || "trending";
  const mode = params.get("mode") || "all"; // "all" | "curated" | "live"
  const q = params.get("q") || "";
  const language = params.get("language") || "";
  const platform = params.get("platform") || "";
  const license = params.get("license") || "";
  const goal = params.get("goal") || "";
  const alternative = params.get("alternative") || "";
  const category = params.get("category") || "";

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [liveRows, setLiveRows] = useState([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [livePage, setLivePage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [pairings, setPairings] = useState([]);
  const [goalsList, setGoalsList] = useState([]);
  const [ghStatus, setGhStatus] = useState(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    getPairings().then(setPairings).catch(() => {});
    api.goals().then((data) => setGoalsList(data.goals || [])).catch(() => {});
    api.githubStatus().then(setGhStatus).catch(() => {});
  }, []);

  // Multi-selection list helpers
  const altList = useMemo(() => alternative.split(",").map((s) => s.trim()).filter(Boolean), [alternative]);
  const catList = useMemo(() => category.split(",").map((s) => s.trim()).filter(Boolean), [category]);
  const langList = useMemo(() => language.split(",").map((s) => s.trim()).filter(Boolean), [language]);
  const licList = useMemo(() => license.split(",").map((s) => s.trim()).filter(Boolean), [license]);

  const altSet = useMemo(() => new Set(altList.map((s) => s.toLowerCase())), [altList]);
  const catSet = useMemo(() => new Set(catList.map((s) => s.toLowerCase())), [catList]);
  const langSet = useMemo(() => new Set(langList.map((s) => s.toLowerCase())), [langList]);
  const licSet = useMemo(() => new Set(licList.map((s) => s.toLowerCase())), [licList]);

  const isFiltered = Boolean(q || language || platform || license || goal || alternative || category);
  const activeFilterCount = altList.length + catList.length + langList.length + licList.length + (goal ? 1 : 0);

  const debouncedQ = useDebounced(q, 300);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const onFocusRequest = () => document.getElementById("hero-search-input")?.focus();
    window.addEventListener("osh:focus-hero-search", onFocusRequest);
    return () => window.removeEventListener("osh:focus-hero-search", onFocusRequest);
  }, []);

  // 10-Minute Automated Daily Trending Sync Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setRefresh((n) => n + 1);
    }, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial Data Fetching when filters or view changes
  useEffect(() => {
    let alive = true;
    setRows(null);
    setLiveRows([]);
    setLivePage(1);
    setHasMore(true);
    setIsLoadingMore(false);
    setError(null);

    const ghSort = sort === "stars" ? "stars" : sort === "commit" ? "updated" : sort === "forks" ? "forks" : "stars";

    const getGitHubQuery = () => {
      if (debouncedQ) return debouncedQ;
      if (catList.length > 0) return `topic:${catList[0].toLowerCase().replace(/\s+/g, "-")}`;
      if (goal) {
        const cleanGoal = goal.replace(/^replace-/, "").replace(/-/g, " ");
        return `${cleanGoal} alternative`;
      }
      const tf = String(view || "today").toLowerCase();
      const now = new Date();
      let sinceDate;
      if (tf === "today") {
        sinceDate = new Date(now.getTime() - 48 * 3600 * 1000).toISOString().split("T")[0];
      } else if (tf.includes("week")) {
        sinceDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
      } else if (tf.includes("month")) {
        sinceDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
      } else {
        sinceDate = new Date(now.getTime() - 365 * 24 * 3600 * 1000).toISOString().split("T")[0];
      }
      if (sort === "stars") return "stars:>5000";
      return `pushed:>${sinceDate} stars:>50`;
    };

    // 1. If Mode is specifically "live"
    if (mode === "live") {
      const queryStr = getGitHubQuery();

      api
        .githubSearch({
          q: queryStr,
          language: langList[0] || "",
          license: licList[0] || "",
          sort: ghSort,
          page: 1,
          perPage: 24,
        })
        .then((data) => {
          if (!alive) return;
          setRows([]);
          setLiveRows(data.items || []);
          setLiveTotal(data.total || 0);
          setLivePage(1);
          setHasMore((data.items || []).length >= 24);
        })
        .catch((e) => alive && setError(e.message));
      return () => {
        alive = false;
      };
    }

    // 2. Real Timeframe Trending with Search & Live Integration
    const loadTrending = api.trending(view, refresh > 0);
    const loadSearch = debouncedQ
      ? api.search({ q: debouncedQ, language: langList[0] || "", platform, license: licList[0] || "", goal })
      : null;

    Promise.all([loadTrending, loadSearch].filter(Boolean))
      .then(async (results) => {
        if (!alive) return;
        const trendingData = results[0];
        const searchData = results.length > 1 ? results[1] : null;

        const trendRepos = trendingData?.repos || [];
        let combined = trendRepos;

        if (searchData?.results && searchData.results.length > 0) {
          const trendReposSet = new Set(trendRepos.map((r) => String(r.repo || r.fullName || "").toLowerCase()));
          const searchMatches = searchData.results.filter(
            (r) => !trendReposSet.has(String(r.alternative?.repo || "").toLowerCase())
          );
          combined = [...searchMatches, ...trendRepos];
        }

        setRows(combined);

        // Preload live GitHub items matching current query / sort / timeframe
        try {
          const queryStr = getGitHubQuery();

          const ghRes = await api.githubSearch({
            q: queryStr,
            language: langList[0] || "",
            license: licList[0] || "",
            sort: ghSort,
            page: 1,
            perPage: 24,
          });

          if (alive) {
            setLiveRows(ghRes.items || []);
            setLiveTotal(ghRes.total || 0);
            setLivePage(1);
            setHasMore((ghRes.items || []).length > 0);
          }
        } catch {
          if (alive) {
            setLiveRows([]);
            setLiveTotal(0);
          }
        }
      })
      .catch((e) => alive && setError(e.message));

    return () => {
      alive = false;
    };
  }, [view, debouncedQ, langList, platform, licList, goal, category, alternative, isFiltered, refresh, mode, sort]);

  // Continuous Infinite Scroll Stream Loader
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || rows === null) return;
    setIsLoadingMore(true);

    try {
      const nextPage = livePage + 1;
      const ghSort = sort === "stars" ? "stars" : sort === "commit" ? "updated" : sort === "forks" ? "forks" : "stars";

      let queryStr = debouncedQ;
      if (!queryStr) {
        if (catList.length > 0) queryStr = `topic:${catList[0].toLowerCase().replace(/\s+/g, "-")}`;
        else if (goal) {
          const cleanGoal = goal.replace(/^replace-/, "").replace(/-/g, " ");
          queryStr = `${cleanGoal} alternative`;
        } else if (sort === "stars") {
          queryStr = "stars:>5000";
        } else {
          queryStr = "stars:>50";
        }
      }

      const res = await api.githubSearch({
        q: queryStr,
        language: langList[0] || "",
        license: licList[0] || "",
        sort: ghSort,
        page: nextPage,
        perPage: 24,
      });

      const newItems = res.items || [];
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setLiveRows((prev) => {
          const existingKeys = new Set(prev.map((i) => (i.fullName || "").toLowerCase()));
          const uniqueNew = newItems.filter((i) => !existingKeys.has((i.fullName || "").toLowerCase()));
          return [...prev, ...uniqueNew];
        });
        setLivePage(nextPage);
        if (nextPage >= 40 || (res.total && nextPage * 24 >= res.total)) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Infinite scroll GitHub error:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, rows, livePage, sort, debouncedQ, catList, goal, langList, licList]);

  // IntersectionObserver for bottom sentinel trigger
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && rows !== null) {
          loadMore();
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, rows]);

  const pairingByRepo = useMemo(
    () => new Map(pairings.map((p) => [p.alternative.repo.toLowerCase(), p])),
    [pairings]
  );

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const removeFilterItem = (paramKey, currentStr, itemToRemove) => {
    const list = currentStr.split(",").map((s) => s.trim()).filter(Boolean);
    const updated = list.filter((s) => s.toLowerCase() !== itemToRemove.toLowerCase());
    setParam(paramKey, updated.join(","));
  };

  const clearAllFilters = () => {
    setParams({}, { replace: true });
    setFilterDrawerOpen(false);
  };

  // Process, Filter & Sort Cards with Multi-Selection Support
  const cards = useMemo(() => {
    let list = [];

    // 1. Process Curated Rows
    if (mode !== "live") {
      const curatedCards = (rows || [])
        .map((r) => {
          const pairing =
            r.pairing ||
            pairingByRepo.get(String(r.repo || "").toLowerCase()) ||
            pairingByRepo.get(String(r.alternative?.repo || "").toLowerCase());
          if (!pairing) return null;
          return {
            key: pairing.alternative.repo,
            isLive: false,
            pairing,
            stars30d: r.stars30d ?? {
              history: r.history,
              stars: r.stars,
              change: r.change,
              changePct: r.changePct,
              timeframeDelta: r.timeframeDelta,
              timeframeLabel: r.timeframeLabel,
            },
            freshness: r.freshness ?? null,
            maintenance: r.maintenance ?? null,
            downloads: r.downloads ?? null,
            forks: r.forks || pairing.alternative.forks || 0,
          };
        })
        .filter(Boolean);
      list.push(...curatedCards);
    }

    // 2. Process Live GitHub Rows
    if (liveRows.length > 0) {
      const existingRepos = new Set(list.map((c) => c.key.toLowerCase()));
      const liveCards = liveRows
        .filter((item) => !existingRepos.has(item.fullName.toLowerCase()))
        .map((item) => {
          const cat = item.topics?.[0] ? item.topics[0].replace(/-/g, " ") : (item.language || "Open Source");
          const pairing = {
            paidTool: {
              name: item.name,
              slug: item.name.toLowerCase(),
              category: cat.charAt(0).toUpperCase() + cat.slice(1),
              pricePerMonth: 0,
              tags: item.topics || [],
            },
            alternative: {
              name: item.name,
              repo: item.fullName,
              description: item.description || "Live GitHub Open Source Repository",
              language: item.language || "Open Source",
              stars: item.stars,
              license: item.license || { spdx: "Open Source", type: "permissive" },
              tags: item.topics || [],
              platforms: ["self-hosted"],
              selfHosted: true,
            },
            relationship: "direct",
            parity: 90,
            features: [
              { name: "Live GitHub Project", parity: true },
              { name: "Public Open Source Codebase", parity: true },
              { name: "Active Community & Commits", parity: true },
            ],
            savings: { yearly: 0, formula: "Community Open Source" },
            tradeoffs: [],
          };

          return {
            key: item.fullName,
            isLive: true,
            pairing,
            stars30d: {
              history: [],
              stars: item.stars,
              change: item.timeframeDelta || 0,
              changePct: item.timeframeDelta ? Math.round((item.timeframeDelta / Math.max(item.stars - item.timeframeDelta, 1)) * 100) : 10,
              timeframeDelta: item.timeframeDelta || 0,
              timeframeLabel: item.timeframeLabel || view,
            },
            freshness: item.pushedAt ? { pushedAt: item.pushedAt } : null,
            maintenance: null,
            downloads: null,
            forks: item.forks || 0,
          };
        });
      list.push(...liveCards);
    }

    // 1. Multi-Select Alternative Filter
    if (altSet.size > 0) {
      list = list.filter((c) => altSet.has(c.pairing.paidTool?.slug?.toLowerCase()));
    }

    // 2. Multi-Select Category Filter
    if (catSet.size > 0) {
      list = list.filter((c) => catSet.has(c.pairing.paidTool?.category?.toLowerCase()));
    }

    // 3. Multi-Select Tech Stack / Language Filter
    if (langSet.size > 0) {
      list = list.filter((c) => {
        const l = c.pairing.alternative?.language?.toLowerCase();
        const tags = (c.pairing.alternative?.tags || []).map((t) => t.toLowerCase());
        return (l && langSet.has(l)) || tags.some((t) => langSet.has(t));
      });
    }

    // 4. Multi-Select License Filter
    if (licSet.size > 0) {
      list = list.filter((c) => licSet.has(c.pairing.alternative?.license?.spdx?.toLowerCase()));
    }

    // 5. Apply Sorting (All Options Handled)
    if (sort === "stars") {
      list.sort((a, b) => (b.stars30d?.stars ?? b.pairing?.alternative?.stars ?? 0) - (a.stars30d?.stars ?? a.pairing?.alternative?.stars ?? 0));
    } else if (sort === "name-asc") {
      list.sort((a, b) => a.pairing.alternative.name.localeCompare(b.pairing.alternative.name));
    } else if (sort === "name-desc") {
      list.sort((a, b) => b.pairing.alternative.name.localeCompare(a.pairing.alternative.name));
    } else if (sort === "commit" || sort === "latest") {
      list.sort((a, b) => {
        const da = a.freshness?.pushedAt ? new Date(a.freshness.pushedAt).getTime() : 0;
        const db = b.freshness?.pushedAt ? new Date(b.freshness.pushedAt).getTime() : 0;
        return db - da;
      });
    } else if (sort === "forks") {
      list.sort((a, b) => (b.forks || b.pairing?.alternative?.forks || 0) - (a.forks || a.pairing?.alternative?.forks || 0));
    } else if (sort === "trending") {
      list.sort((a, b) => {
        const da = a.stars30d?.timeframeDelta || a.stars30d?.change || a.stars30d?.changePct || 0;
        const db = b.stars30d?.timeframeDelta || b.stars30d?.change || b.stars30d?.changePct || 0;
        return db - da;
      });
    }

    return list;
  }, [rows, liveRows, pairingByRepo, altSet, catSet, langSet, licSet, sort, mode]);

  return (
    <>
      {/* 1. Hero Section matching OpenAlternative */}
      <section className="hero-wash-bg pt-10 pb-6">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs">
            <span>Built with OpenSource Hub</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
            Open Source Alternatives <br className="hidden sm:inline" />
            <span className="text-dim font-normal italic">to Popular Software</span>
          </h1>

          <p className="text-sm md:text-base text-dim leading-relaxed max-w-xl mx-auto font-normal">
            Find verified open-source replacements for the paid software you rely on — every listing pairs popularity with live maintenance and trust signals, so you can switch with confidence.
          </p>

          <div className="pt-2">
            <InstallPill />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 space-y-6">
        {/* Search, 4-Column Filters Toggle & Order By Dropdown Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              id="hero-search-input"
              type="search"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
              placeholder={
                mode === "live"
                  ? "Search millions of live GitHub repos (e.g. rust vector database, react table)..."
                  : "Search alternatives, SaaS names (Figma, Notion, Slack), or live GitHub repos..."
              }
              aria-label="Search tools by keyword or paid name"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs transition-colors"
            />
            {q && (
              <button
                type="button"
                onClick={() => setParam("q", "")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Timeframe Switcher: Today | This Week | This Month | This Year */}
          <div className="inline-flex items-center p-1 rounded-xl border border-line bg-surface shadow-2xs shrink-0 self-start md:self-auto overflow-x-auto">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setParam("view", tf.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  view === tf.id
                    ? "bg-elevated text-ink dark:text-white font-semibold shadow-xs border border-line/60"
                    : "text-dim hover:text-ink hover:bg-elevated/50"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Filters Toggle Button with Multi-Select Badge */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen((v) => !v)}
            aria-expanded={filterDrawerOpen}
            className={`btn-tactile inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              filterDrawerOpen || activeFilterCount > 0
                ? "border border-accent/40 bg-accent/10 text-accent font-semibold shadow-xs"
                : "border-line bg-surface text-dim hover:text-ink hover:border-line-strong"
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="size-5 rounded-full bg-accent text-white text-[11px] font-bold grid place-items-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Order By Multi-Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen((v) => !v)}
              className="w-full md:w-auto btn-tactile inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface text-sm font-medium text-dim hover:text-ink hover:border-line-strong transition-colors min-w-[160px]"
            >
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={14} className="text-faint" />
                <span>
                  {SORT_OPTIONS.find((s) => s.id === sort)?.label || "Order by"}
                </span>
              </div>
              <ChevronDown size={14} className={sortDropdownOpen ? "rotate-180" : ""} />
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 p-1.5 rounded-2xl border border-line bg-surface shadow-float animate-card-in z-50">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setParam("sort", opt.id);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      sort === opt.id
                        ? "bg-accent/15 text-accent font-semibold"
                        : "text-dim hover:text-ink hover:bg-elevated"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. 4-Column Searchable Multi-Select Filter Drawer */}
        {filterDrawerOpen && (
          <FilterDrawer
            pairings={pairings}
            selectedAlternative={alternative}
            selectedCategory={category}
            selectedLanguage={language}
            selectedLicense={license}
            onSelectAlternative={(val) => setParam("alternative", val)}
            onSelectCategory={(val) => setParam("category", val)}
            onSelectLanguage={(val) => setParam("language", val)}
            onSelectLicense={(val) => setParam("license", val)}
            onClearAll={clearAllFilters}
          />
        )}

        {/* Goal-First Quick-Filter Pills (PRD §38) */}
        {goalsList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5" aria-label="Browse by goal">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-faint uppercase tracking-wider shrink-0 pr-1">
              <Target size={12} className="text-accent" /> Goals:
            </span>
            {goalsList.slice(0, 8).map((g) => {
              const active = goal === g.tag;
              return (
                <button
                  key={g.tag}
                  type="button"
                  onClick={() => setParam("goal", active ? "" : g.tag)}
                  className={`btn-tactile inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                    active
                      ? "border border-accent/40 bg-accent/10 text-accent font-semibold shadow-xs"
                      : "border border-line bg-surface text-dim hover:text-ink hover:border-line-strong"
                  }`}
                >
                  <span>{g.label}</span>
                  <span className={`text-[10px] tnum ${active ? "text-accent font-semibold" : "text-faint"}`}>
                    {g.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Filters Pill Bar with Individual Tag Dismiss */}
        {isFiltered && activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-faint">Active filters ({activeFilterCount}):</span>
            {goal && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-surface text-xs text-ink font-medium shadow-2xs animate-card-in">
                <span>Goal: <strong>{goalsList.find((g) => g.tag === goal)?.label || goal}</strong></span>
                <button
                  type="button"
                  onClick={() => setParam("goal", "")}
                  className="text-faint hover:text-ink transition-colors"
                  aria-label="Remove goal filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {altList.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-surface text-xs text-ink font-medium shadow-2xs animate-card-in"
              >
                <span>Alternative: <strong>{item}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterItem("alternative", alternative, item)}
                  className="text-faint hover:text-ink transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {catList.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-surface text-xs text-ink font-medium shadow-2xs animate-card-in"
              >
                <span>Category: <strong>{item}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterItem("category", category, item)}
                  className="text-faint hover:text-ink transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {langList.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-surface text-xs text-ink font-medium shadow-2xs animate-card-in"
              >
                <span>Stack: <strong>{item}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterItem("language", language, item)}
                  className="text-faint hover:text-ink transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {licList.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-surface text-xs text-ink font-medium shadow-2xs animate-card-in"
              >
                <span>License: <strong>{item}</strong></span>
                <button
                  type="button"
                  onClick={() => removeFilterItem("license", license, item)}
                  className="text-faint hover:text-ink transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-accent hover:underline font-medium ml-1"
            >
              Reset all
            </button>
          </div>
        )}

        {/* Alerts and history */}
        <AlertsBanner />
        {!q && !platform && !license && <HistoryStrip />}

        {/* 4. Repository Grid Section */}
        {error && <ErrorState message={error} onRetry={() => setRefresh((n) => n + 1)} />}

        {!error && rows === null && <GridSkeleton count={8} />}

        {!error && rows !== null && cards.length === 0 && (
          <div className="card-elevated p-8 sm:p-12 text-center max-w-xl mx-auto rounded-3xl border border-line bg-surface space-y-5 animate-fade-in shadow-sm">
            <div className="size-12 rounded-2xl bg-elevated border border-line text-dim grid place-items-center mx-auto">
              <Search size={22} className="text-faint" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-lg sm:text-xl font-bold text-ink">
                {q ? `No open-source alternatives found for "${q}"` : "No matches found"}
              </h3>
              <p className="text-xs sm:text-sm text-dim">
                Try unchecking filters, searching for a category, or picking one of the trending alternatives below.
              </p>
            </div>

            {/* Popular Search Suggestions */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-faint font-medium">Popular:</span>
              {["Airtable", "Slack", "Notion", "Figma", "Postman", "Supabase", "Datadog"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setParam("q", term)}
                  className="btn-tactile px-3 py-1.5 rounded-full border border-line bg-elevated hover:bg-surface text-xs font-medium text-dim hover:text-ink hover:border-line-strong transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn-tactile px-5 py-2.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
              >
                Reset all filters &amp; search
              </button>
            </div>
          </div>
        )}

        {!error && cards.length > 0 && (
          <>
            <p role="status" className="sr-only">
              {cards.length} alternatives match your filters
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {cards.map((c, i) => (
                <RepoCard
                  key={c.key}
                  pairing={c.pairing}
                  stars30d={c.stars30d}
                  freshness={c.freshness}
                  maintenance={c.maintenance}
                  downloads={c.downloads}
                  index={i}
                />
              ))}
            </div>

            {/* Continuous Stream Sentinel & Infinite Loader */}
            <div ref={sentinelRef} className="h-6 w-full pointer-events-none" aria-hidden="true" />

            {isLoadingMore && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 animate-card-in">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-line bg-surface shadow-xs text-xs font-medium text-dim">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-accent"></span>
                  </span>
                  <span>Streaming more open-source repositories from GitHub...</span>
                </div>
              </div>
            )}

            {!hasMore && cards.length >= 10 && (
              <div className="text-center py-8 text-xs text-faint flex items-center justify-center gap-2">
                <Sparkles size={14} className="text-accent shrink-0" />
                <span>You've explored all trending open-source projects for this query.</span>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

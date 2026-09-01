import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Layers, Sparkles, X, ArrowRight } from "lucide-react";
import { getPairings } from "../lib/seed";
import { api } from "../lib/api";
import RepoCard from "../components/RepoCard";
import Breadcrumbs from "../components/Breadcrumbs";

export default function AlternativesPage() {
  const [pairings, setPairings] = useState([]);
  const [starsMap, setStarsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [liveRows, setLiveRows] = useState([]);
  const [livePage, setLivePage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getPairings(),
      api.search({ q: "", language: "", platform: "", license: "" }).catch(() => ({ results: [] })),
    ])
      .then(([seedPairings, searchData]) => {
        setPairings(seedPairings || []);
        const map = {};
        for (const r of searchData.results || []) {
          if (r.alternative?.repo) {
            map[r.alternative.repo.toLowerCase()] = r;
          }
        }
        setStarsMap(map);
        setLoading(false);
      })
      .catch(() => {
        setPairings([]);
        setLoading(false);
      });
  }, []);

  // Reset live rows when search or category changes
  useEffect(() => {
    setLiveRows([]);
    setLivePage(1);
    setHasMore(true);
    setIsLoadingMore(false);
  }, [search, selectedCategory]);

  // Load more GitHub repos continuously on scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || loading) return;
    setIsLoadingMore(true);

    try {
      const nextPage = livePage + 1;
      let queryStr = search.trim();
      if (!queryStr) {
        if (selectedCategory !== "all") {
          queryStr = `topic:${selectedCategory.toLowerCase().replace(/\s+/g, "-")}`;
        } else {
          queryStr = "stars:>100";
        }
      }

      const res = await api.githubSearch({
        q: queryStr,
        sort: "stars",
        page: nextPage,
        perPage: 24,
      });

      const newItems = res.items || [];
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setLiveRows((prev) => {
          const existing = new Set(prev.map((i) => (i.fullName || "").toLowerCase()));
          const unique = newItems.filter((i) => !existing.has((i.fullName || "").toLowerCase()));
          return [...prev, ...unique];
        });
        setLivePage(nextPage);
        if (nextPage >= 40 || (res.total && nextPage * 24 >= res.total)) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Alternatives infinite scroll error:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, loading, livePage, search, selectedCategory]);

  // IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, loading]);

  // Categories list derived from pairings
  const categories = useMemo(() => {
    const set = new Set();
    for (const p of pairings) {
      if (p.paidTool?.category) set.add(p.paidTool.category);
    }
    return ["all", ...Array.from(set).sort()];
  }, [pairings]);

  // Filtered list of open source alternative pairings merged with live stream
  const allCards = useMemo(() => {
    const curatedFiltered = pairings.filter((p) => {
      const cat = p.paidTool?.category || "";
      const matchesCat =
        selectedCategory === "all" ||
        cat.toLowerCase() === selectedCategory.toLowerCase();

      const q = search.trim().toLowerCase();
      if (!q) return matchesCat;

      const altName = p.alternative?.name?.toLowerCase() || "";
      const altRepo = p.alternative?.repo?.toLowerCase() || "";
      const altDesc = p.alternative?.description?.toLowerCase() || "";
      const paidName = p.paidTool?.name?.toLowerCase() || "";
      const paidCat = p.paidTool?.category?.toLowerCase() || "";
      const tags = (p.alternative?.tags || []).join(" ").toLowerCase();

      const matchesQuery =
        altName.includes(q) ||
        altRepo.includes(q) ||
        altDesc.includes(q) ||
        paidName.includes(q) ||
        paidCat.includes(q) ||
        tags.includes(q);

      return matchesCat && matchesQuery;
    }).map((p, idx) => {
      const liveData = starsMap[p.alternative.repo.toLowerCase()];
      return {
        key: p.alternative.repo,
        pairing: p,
        stars30d: liveData?.stars30d,
        freshness: liveData?.freshness,
        maintenance: liveData?.maintenance,
        downloads: liveData?.downloads,
        index: idx,
      };
    });

    const curatedRepos = new Set(curatedFiltered.map((c) => c.key.toLowerCase()));

    const liveCards = liveRows
      .filter((item) => !curatedRepos.has(item.fullName.toLowerCase()))
      .map((item, idx) => {
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
          pairing,
          stars30d: { history: [], stars: item.stars, change: 0, changePct: 0 },
          freshness: item.pushedAt ? { pushedAt: item.pushedAt } : null,
          maintenance: null,
          downloads: null,
          index: curatedFiltered.length + idx,
        };
      });

    return [...curatedFiltered, ...liveCards];
  }, [pairings, selectedCategory, search, starsMap, liveRows]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10">
      <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Alternatives" }]} />

      <header className="mt-4 mb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs">
          <Sparkles size={13} className="text-accent" />
          <span>Curated Open Source Directory</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Open Source Alternatives <br className="hidden sm:inline" />
          <span className="text-accent">to Commercial & Paid Software</span>
        </h1>

        <p className="text-sm md:text-base text-dim leading-relaxed max-w-2xl">
          Browse verified open-source replacements for proprietary tools like Slack, Notion, Figma, and 1Password. Every card includes verified feature breakdowns, live GitHub signals, and estimated annual cost savings.
        </p>
      </header>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by paid software (e.g. Notion, Slack, Figma) or open-source name..."
            aria-label="Search by paid software"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`btn-tactile shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-ink text-surface shadow-2xs font-semibold"
                  : "border border-line bg-surface text-dim hover:text-ink hover:border-line-strong"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Result Count Banner */}
      {!loading && (
        <div className="flex items-center justify-between text-xs text-dim mb-4 px-1">
          <span>
            Showing <strong className="text-ink font-semibold">{allCards.length}</strong> open-source {allCards.length === 1 ? "alternative" : "alternatives"}
          </span>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="text-accent hover:underline font-medium"
            >
              Clear category filter
            </button>
          )}
        </div>
      )}

      {/* Loading Skeletons matching Home Page */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card-elevated p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-elevated" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-elevated rounded w-1/2" />
                  <div className="h-3 bg-elevated rounded w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-elevated rounded-lg" />
              <div className="space-y-2 pt-2 border-t border-line/60">
                <div className="h-3 bg-elevated rounded w-full" />
                <div className="h-3 bg-elevated rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && allCards.length === 0 && (
        <div className="card-elevated p-12 text-center space-y-3">
          <Layers size={40} className="mx-auto text-faint" />
          <h2 className="font-display text-xl font-bold text-ink">No alternatives found</h2>
          <p className="text-sm text-dim max-w-md mx-auto">
            No open source alternatives matched "{search}". Try searching for another paid software name or reset your category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
            className="btn-tactile inline-flex px-4 py-2 rounded-full bg-ink text-surface text-xs font-medium"
          >
            Reset search & filters
          </button>
        </div>
      )}

      {/* Main Full-Size 3-Column Grid Matching Home Page */}
      {!loading && allCards.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCards.map((c) => (
              <RepoCard
                key={c.key}
                pairing={c.pairing}
                stars30d={c.stars30d}
                freshness={c.freshness}
                maintenance={c.maintenance}
                downloads={c.downloads}
                index={c.index}
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
                <span>Streaming more open-source projects from GitHub...</span>
              </div>
            </div>
          )}

          {!hasMore && allCards.length >= 10 && (
            <div className="text-center py-8 text-xs text-faint flex items-center justify-center gap-2">
              <span>✨ You've explored all trending open-source alternatives.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

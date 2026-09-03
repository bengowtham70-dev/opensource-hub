import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Layers, Sparkles, X, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { getPairings } from "../lib/seed";
import { api } from "../lib/api";
import RepoCard from "../components/RepoCard";
import Breadcrumbs from "../components/Breadcrumbs";

export default function AlternativesPage() {
  const [params, setParams] = useSearchParams();
  const [pairings, setPairings] = useState([]);
  const [starsMap, setStarsMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  const search = params.get("q") || "";
  const selectedCategory = params.get("category") || "all";

  const [liveRows, setLiveRows] = useState([]);
  const [livePage, setLivePage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const scrollTrackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const setSearch = (newSearch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSearch && newSearch.trim()) {
        next.set("q", newSearch);
      } else {
        next.delete("q");
      }
      return next;
    }, { replace: true });
  };

  const setSelectedCategory = (newCat) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newCat && newCat !== "all") {
        next.set("category", newCat);
      } else {
        next.delete("category");
      }
      return next;
    }, { replace: true });
  };

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

  // Update scroll track arrows
  const checkScroll = useCallback(() => {
    if (!scrollTrackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollTrackRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollTrackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, pairings]);

  const scrollByAmount = (offset) => {
    if (scrollTrackRef.current) {
      scrollTrackRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Reset live rows when search or category changes
  useEffect(() => {
    setLiveRows([]);
    setLivePage(1);
    setHasMore(true);
    setIsLoadingMore(false);
  }, [search, selectedCategory]);

  // Load more repos continuously on scroll from the 26,000+ SQLite catalog with GitHub fallback
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || loading) return;
    setIsLoadingMore(true);

    try {
      const nextPage = livePage + 1;
      let queryStr = search.trim();
      if (!queryStr && selectedCategory !== "all") {
        queryStr = selectedCategory.toLowerCase();
      }

      // 1. Query local 26,000+ SQLite catalog first (instant, 0 rate limits)
      const catRes = await api.catalog({
        q: queryStr,
        page: nextPage,
        limit: 24,
        sort: "stars",
      }).catch(() => null);

      const newItems = catRes?.results || [];
      if (newItems.length > 0) {
        setLiveRows((prev) => {
          const existing = new Set(prev.map((i) => (i.fullName || i.alternative?.repo || "").toLowerCase()));
          const unique = newItems.filter((i) => !existing.has((i.fullName || i.alternative?.repo || "").toLowerCase()));
          return [...prev, ...unique];
        });
        setLivePage(nextPage);
        if (nextPage >= (catRes.totalPages || 40)) {
          setHasMore(false);
        }
      } else {
        // Fallback to GitHub Search only if catalog has no more pages and query is set
        if (queryStr) {
          const ghRes = await api.githubSearch({
            q: queryStr,
            sort: "stars",
            page: nextPage,
            perPage: 24,
          }).catch(() => ({ items: [] }));
          if (ghRes.items && ghRes.items.length > 0) {
            setLiveRows((prev) => {
              const existing = new Set(prev.map((i) => (i.fullName || i.alternative?.repo || "").toLowerCase()));
              const unique = ghRes.items.filter((i) => !existing.has((i.fullName || "").toLowerCase()));
              return [...prev, ...unique];
            });
            setLivePage(nextPage);
            return;
          }
        }
        setHasMore(false);
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

  // Categories list derived from pairings + count maps
  const { categories, categoryCounts } = useMemo(() => {
    const counts = { all: pairings.length };
    const set = new Set();
    for (const p of pairings) {
      const cat = p.paidTool?.category;
      if (cat) {
        set.add(cat);
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return {
      categories: ["all", ...Array.from(set).sort()],
      categoryCounts: counts,
    };
  }, [pairings]);

  // Combined Cards
  const allCards = useMemo(() => {
    const qLower = search.trim().toLowerCase();

    const curatedFiltered = pairings.filter((p) => {
      const matchesCat = selectedCategory === "all" || p.paidTool?.category?.toLowerCase() === selectedCategory.toLowerCase();
      if (!qLower) return matchesCat;
      const matchesQuery =
        p.paidTool.name.toLowerCase().includes(qLower) ||
        p.alternative.name.toLowerCase().includes(qLower) ||
        p.alternative.repo.toLowerCase().includes(qLower) ||
        p.alternative.description.toLowerCase().includes(qLower) ||
        (p.alternative.tags || []).some((t) => t.toLowerCase().includes(qLower));
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
      .filter((item) => {
        const repoKey = (item.fullName || item.alternative?.repo || "").toLowerCase();
        return !curatedRepos.has(repoKey);
      })
      .map((item, idx) => {
        if (item.alternative) {
          return {
            key: item.alternative.repo,
            pairing: item,
            stars30d: item.stars30d || { history: [], stars: item.alternative.stars, change: 0, changePct: 0 },
            freshness: item.freshness || null,
            maintenance: item.maintenance || null,
            downloads: item.downloads || null,
            index: curatedFiltered.length + idx,
          };
        }
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
          <span className="text-ember">to Commercial & Paid Software</span>
        </h1>

        <p className="text-sm md:text-base text-dim leading-relaxed max-w-2xl">
          Browse verified open-source replacements for proprietary tools like Slack, Notion, Figma, and 1Password. Every card includes verified feature breakdowns, live GitHub signals, and estimated annual cost savings.
        </p>
      </header>

      {/* Full-Width Search Bar & Swipeable Category Rail */}
      <section className="mb-8 space-y-3" aria-label="Search and category filters">
        {/* Generous Full-Width Search Input */}
        <div className="relative w-full max-w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by paid software (e.g. Notion, Slack, Figma, Jira) or open-source name..."
            aria-label="Search open-source alternatives by commercial or open-source name"
            className="w-full pl-11 pr-24 py-3 sm:py-3.5 rounded-2xl border border-line bg-surface text-sm md:text-base text-ink placeholder:text-faint outline-none focus:border-line-strong focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search query"
                className="p-1 rounded-full text-faint hover:text-ink hover:bg-elevated transition-colors"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md border border-line bg-canvas text-[11px] text-faint tnum font-sans shadow-2xs">
              /
            </kbd>
          </div>
        </div>

        {/* Dedicated Swipeable Category Rail with Navigation Controls */}
        <div className="relative group/rail">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByAmount(-240)}
              aria-label="Scroll categories left"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full border border-line bg-surface/95 backdrop-blur-xs shadow-md grid place-items-center text-dim hover:text-ink hover:border-line-strong transition-all"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Swipeable Pills Track */}
          <div
            ref={scrollTrackRef}
            tabIndex={0}
            aria-label="Filter alternatives by category"
            className="flex items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth py-1.5 px-0.5 focus:outline-none"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn-tactile shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs transition-all select-none cursor-pointer ${
                    isSelected
                      ? "border border-accent/40 bg-accent/10 text-ember font-semibold shadow-xs"
                      : "border border-line bg-surface text-dim hover:text-ink hover:border-line-strong hover:bg-elevated"
                  }`}
                >
                  <span>{cat === "all" ? "All Categories" : cat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10.5px] tnum font-semibold ${
                      isSelected ? "bg-accent/20 text-ember" : "bg-elevated text-faint"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByAmount(240)}
              aria-label="Scroll categories right"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full border border-line bg-surface/95 backdrop-blur-xs shadow-md grid place-items-center text-dim hover:text-ink hover:border-line-strong transition-all"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Result Stats & Active Filter Notice */}
        {!loading && (
          <div className="flex items-center justify-between text-xs text-dim pt-1 px-1">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-faint shrink-0" />
              <span>
                Showing <strong className="text-ink font-semibold">{allCards.length}</strong> {allCards.length === 1 ? "alternative" : "alternatives"}
                {selectedCategory !== "all" && (
                  <span> in <strong className="text-ink">{selectedCategory}</strong></span>
                )}
                {search && (
                  <span> matching "<strong className="text-ink">{search}</strong>"</span>
                )}
              </span>
            </span>

            {(selectedCategory !== "all" || search) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="text-ember hover:underline font-medium text-xs cursor-pointer shrink-0"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </section>

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
              <Sparkles size={14} className="text-accent shrink-0" />
              <span>You've explored all trending open-source alternatives.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

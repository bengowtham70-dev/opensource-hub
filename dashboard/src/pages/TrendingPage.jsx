import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Flame, TrendingUp, TrendingDown, Trophy, Search, Replace } from "lucide-react";
import { api } from "../lib/api";
import { getPairings, getLanguages, getGoals } from "../lib/seed";
import RepoCard from "../components/RepoCard";
import InstallPill from "../components/InstallPill";
import FilterRail from "../components/FilterRail";
import AlertsBanner from "../components/AlertsBanner";
import HistoryStrip from "../components/HistoryStrip";
import { GridSkeleton, EmptyState, ErrorState } from "../components/states";

// AGENTS §5.1 — tiny debounce so the hero search fires one request per pause,
// not per keystroke.
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

const TABS = [
  { id: "today", label: "Today", icon: Flame },
  { id: "yesterday", label: "Yesterday", icon: TrendingUp },
  { id: "least", label: "Least trending", icon: TrendingDown },
  { id: "all-time", label: "All-time", icon: Trophy },
];

export default function TrendingPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") || "today";
  const q = params.get("q") || "";
  const language = params.get("language") || "";
  const platform = params.get("platform") || "";
  const license = params.get("license") || "";
  // PRD §38 goal-first browsing: ?goal=replace-notion opens the pre-filtered view
  // behind each "I want to replace…" entry-grid tile.
  const goal = params.get("goal") || "";

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [pairings, setPairings] = useState([]);

  useEffect(() => {
    getPairings().then(setPairings).catch(() => {});
  }, []);

  // Phase 2: any active facet (q/language/platform/license/goal) routes to /api/search;
  // a clean URL keeps using the snapshot-backed trending views.
  const isFiltered = Boolean(q || language || platform || license || goal);

  // AGENTS §5.1 — debounced search: keystrokes must not fire a request each.
  const debouncedQ = useDebounced(q, 250);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setError(null);
    const load = isFiltered
      ? api.search({ q: debouncedQ, language, platform, license, goal })
      : api.trending(view);
    load
      .then((data) => {
        if (!alive) return;
        setRows(isFiltered ? data.results : data.repos);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
    // `refresh` intentionally retriggers: it is the ErrorState retry handle.
  }, [view, debouncedQ, language, platform, license, goal, isFiltered, refresh]);

  const pairingByRepo = useMemo(
    () => new Map(pairings.map((p) => [p.alternative.repo.toLowerCase(), p])),
    [pairings]
  );
  const languages = useMemo(getLanguages, []);
  // PRD §38 entry grid — top goals from the bundled seed (instant render).
  const goals = useMemo(getGoals, []);
  const goalMeta = useMemo(
    () => new Map(goals.map((g) => [g.tag, g])),
    [goals]
  );

  const cards = (rows || [])
    .map((r) => {
      const pairing =
        r.pairing ||
        pairingByRepo.get(String(r.repo || "").toLowerCase()) ||
        pairingByRepo.get(String(r.alternative?.repo || "").toLowerCase());
      if (!pairing) return null;
      return {
        key: pairing.alternative.repo,
        pairing,
        stars30d: r.stars30d ?? {
          history: r.history,
          stars: r.stars,
          change: r.change,
          changePct: r.changePct,
        },
        freshness: r.freshness ?? null,
        maintenance: r.maintenance ?? null,
        downloads: r.downloads ?? null,
      };
    })
    .filter(Boolean);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // WAI-ARIA tablist pattern: Left/Right cycle, Home/End jump.
  const onTabKeyDown = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const tabs = [...e.currentTarget.querySelectorAll('[role="tab"]')];
    const current = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    let next;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    else next = (current - 1 + tabs.length) % tabs.length;
    e.preventDefault();
    setParam("view", TABS[next].id);
    tabs[next]?.focus();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 pb-16">
      {/* Hero — 4 elements max per design-taste-frontend §4.7. */}
      <section className="mesh-glow-bg rounded-b-3xl pt-10 pb-8 -mx-4 md:-mx-6 px-4 md:px-6 mb-6">
        <h1 className="font-display text-display-lg max-w-[22ch]">
          Stop renting software. <span className="text-primary">Own it free.</span>
        </h1>
        {/* PRD section 19 Phase-1 — copy-able install pill lives in the first-run hero. */}
        <div className="mt-4">
          <InstallPill />
        </div>
        <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-[520px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
              placeholder='Search the paid tool you use — "Notion", "Postman"…'
              aria-label="Search alternatives by paid tool or keyword"
              className="w-full card-glass !bg-elevated pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="button"
            onClick={openGlobalPalette}
            className="shimmer-button btn-tactile px-4 py-2.5 text-sm text-dim hover:text-ink"
          >
            Or press <kbd className="tnum text-[11px] ml-1 px-1.5 rounded border border-line-strong">⌘K</kbd>
          </button>
        </div>
      </section>

      {/* PRD §38 goal-first entry grid — "I want to replace…" (Phase 7).
          Shown on a clean landing only; each tile opens the pre-filtered view. */}
      {!isFiltered && goals.length > 0 && (
        <section aria-label="Browse by replacement goal" className="mb-6">
          <p className="flex items-center gap-1.5 text-[12px] tnum uppercase tracking-wider text-faint mb-2.5">
            <Replace size={13} className="text-primary" /> I want to replace…
          </p>
          <div className="flex flex-wrap gap-2">
            {goals.map((g, i) => (
              <button
                key={g.tag}
                type="button"
                onClick={() => setParam("goal", g.tag)}
                style={{ animationDelay: `${Math.min(i, 11) * 40}ms`, opacity: 0 }}
                className="animate-card-in btn-tactile card-glass inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm text-dim hover:text-ink hover:border-primary/40"
              >
                {g.label}
                <span className="tnum text-[11px] text-faint tabular-nums">{g.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Active-goal banner — mirrors the clear-filters pill pattern (PRD §38). */}
      {goal && (
        <div className="mb-5 flex items-center justify-between gap-3 card-glass !rounded-2xl px-4 py-3 border-l-2 !border-l-primary/60">
          <p className="text-sm text-dim min-w-0">
            Showing free alternatives to{" "}
            <span className="font-display font-semibold text-ink">
              {goalMeta.get(goal)?.label || goal.replace(/^replace-/, "").replace(/-/g, " ")}
            </span>
          </p>
          <button
            onClick={() => setParam("goal", "")}
            className="btn-tactile shrink-0 px-2.5 py-1 rounded-full text-[12px] bg-caution/10 border border-caution/30 text-caution"
          >
            Clear goal ✕
          </button>
        </div>
      )}

      {/* F6 — watchlist trust-drop alerts (amber banner, dismiss resets baseline) */}
      <AlertsBanner />

      {/* F12 — recently viewed strip (local history) */}
      {!q && !platform && !license && <HistoryStrip />}

      {/* Tabs + language filter chips */}
      <div
        className="flex flex-wrap items-center gap-2 mb-5"
        role="tablist"
        aria-label="Trending views"
        onKeyDown={onTabKeyDown}
      >
        {!q && !platform && !license &&
          TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view === t.id}
              tabIndex={view === t.id ? 0 : -1}
              onClick={() => setParam("view", t.id)}
              className={`btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                view === t.id
                  ? "bg-primary/20 text-ink border-primary/40"
                  : "border-line text-dim hover:text-ink hover:border-line-strong"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        {(q || platform || license || goal) && (
          <button
            onClick={() => setParams({}, { replace: true })}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm bg-caution/10 border border-caution/30 text-caution"
          >
            Clear filters ✕
          </button>
        )}
        <span className="ml-auto hidden lg:flex items-center gap-1.5" aria-label="Filter by language">
          {languages.slice(0, 7).map((lang) => (
            <button
              key={lang}
              onClick={() => setParam("language", language === lang ? "" : lang)}
              className={`btn-tactile px-2.5 py-1 rounded-full tnum text-[11px] border transition-colors ${
                language === lang
                  ? "bg-tech/15 text-tech border-tech/40"
                  : "border-line text-faint hover:text-dim"
              }`}
            >
              {lang}
            </button>
          ))}
        </span>
      </div>

      {/* Phase 2 filter rail — platform + license facets (PRD §19 item 1). */}
      <div className="mb-5 card-glass !rounded-2xl px-4 py-3">
        <FilterRail
          pairings={pairings}
          platform={platform}
          license={license}
          onChange={(key, value) => setParam(key, value)}
        />
      </div>

        {error && (
          <ErrorState
            message={error}
            onRetry={() => setRefresh((n) => n + 1)}
          />
        )}

      {!error && rows === null && <GridSkeleton count={8} />}

      {!error && rows !== null && cards.length === 0 && (
        <EmptyState
          title="No matches here yet"
          body={
            q
              ? `Nothing pairs with “${q}” in the catalog yet. Try a different tool name — or clear the filters to browse everything.`
              : platform || license || language
                ? "No alternatives match this combination of filters yet — the catalog grows with every sync."
                : "This view has no repositories right now. The daily sync will fill it up."
          }
          action={
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className="shimmer-button btn-tactile px-4 py-2 text-sm text-ink"
            >
              Browse trending instead
            </button>
          }
        />
      )}

      {!error && cards.length > 0 && (
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
      )}

    </div>
  );
}

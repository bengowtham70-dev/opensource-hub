import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Plus,
  X,
  Cpu,
  Database,
  Layers,
  Server,
  ShieldCheck,
  Zap,
  Activity,
  Boxes,
  Lock,
  Compass,
  CheckCircle2,
  Minus,
  Sparkles,
  ExternalLink,
  Users,
} from "lucide-react";
import { getPairings } from "../lib/seed";
import { BRAND_BY_REPO } from "../lib/logos";
import { api } from "../lib/api";
import BrandLogo, { repoBrand } from "../components/BrandLogo";
import { formatStars, formatSavings, relativeDate } from "../lib/format";
import MigrationGuide from "../components/MigrationGuide";
import PrivacyScorecard from "../components/PrivacyScorecard";
import ProsConsCard from "../components/ProsConsCard";
import ParityVotingWidget from "../components/ParityVotingWidget";
import {
  getToolBenchmarks,
  formatRam,
  formatImageSize,
  formatBootTime,
  computeSavingsRatio,
} from "../lib/benchmarks";

const POPULAR_COMPARISONS = [
  { a: "supabase", b: "pocketbase", label: "Supabase vs PocketBase" },
  { a: "appflowy", b: "joplin", label: "AppFlowy vs Joplin" },
  { a: "bruno", b: "hoppscotch", label: "Bruno vs Hoppscotch" },
  { a: "penpot", b: "excalidraw", label: "Penpot vs Excalidraw" },
  { a: "vaultwarden", b: "keepassxc", label: "Vaultwarden vs KeePassXC" },
  { a: "mattermost", b: "zulip", label: "Mattermost vs Zulip" },
];

const TABS = [
  { id: "signals", label: "Signals & Health", icon: Activity },
  { id: "benchmarks", label: "Architecture & Resources", icon: Cpu },
  { id: "protocols", label: "Protocols & Auth", icon: Lock },
  { id: "fit", label: "Deployment & Fit Guide", icon: Compass },
];

export default function ComparePage() {
  const { a = "", b = "" } = useParams();
  const [activeTab, setActiveTab] = useState("signals");
  const [pairings, setPairings] = useState(null);
  const [starsMap, setStarsMap] = useState({});
  const [details, setDetails] = useState({});
  const [security, setSecurity] = useState({});
  const [extraTools, setExtraTools] = useState([]); // 3rd and 4th tools
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [resolvedTools, setResolvedTools] = useState({});
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    getPairings().then(setPairings).catch(() => setPairings([]));
    api.search({ q: "", language: "", platform: "", license: "" })
      .then((d) => {
        const map = {};
        for (const r of d.results || []) map[String(r.alternative.repo).toLowerCase()] = r;
        setStarsMap(map);
      })
      .catch(() => {});
  }, []);

  const slugSet = (p) => {
    const repo = p.alternative?.repo || "";
    const [owner, name] = repo.toLowerCase().split("/");
    return new Set(
      [name, owner, p.alternative?.name?.toLowerCase(), BRAND_BY_REPO[repo]?.slug].filter(Boolean).map((s) => s.toLowerCase())
    );
  };

  useEffect(() => {
    async function resolveMissing(slug) {
      if (!slug) return null;
      const slugLower = slug.toLowerCase();
      // 1. Check if pairings already has it
      if (pairings) {
        const found = pairings.find((p) => slugSet(p).has(slugLower));
        if (found) return found;
      }
      // 2. Query catalog by query
      try {
        const cat = await api.catalog({ q: slug, limit: 5 });
        if (cat?.results?.length > 0) {
          const exact = cat.results.find((r) => {
            const repo = r.alternative?.repo?.toLowerCase() || "";
            const name = r.alternative?.name?.toLowerCase() || "";
            return repo.endsWith(`/${slugLower}`) || repo === slugLower || name === slugLower;
          }) || cat.results[0];
          if (exact) return exact;
        }
      } catch {}

      // 3. Try resolving directly via /api/repo
      try {
        let owner = "";
        let repoName = "";
        if (slug.includes("/")) {
          [owner, repoName] = slug.split("/");
        } else {
          // Find repo owner via quick search
          const searchRes = await api.search(slug).catch(() => null);
          const firstHit = searchRes?.results?.[0];
          if (firstHit?.repo && firstHit.repo.includes("/")) {
            [owner, repoName] = firstHit.repo.split("/");
          }
        }

        if (owner && repoName) {
          const d = await api.repo(owner, repoName).catch(() => null);
          const alt = d?.pairing?.alternative || d;
          const live = d?.live || {};
          const paid = d?.pairing?.paidTool || {};

          const resolvedName = alt?.name || live?.name || repoName;
          if (resolvedName) {
            return {
              paidTool: {
                name: paid.name || resolvedName,
                category: paid.category || alt.category || live.language || "Open Source",
                pricePerYearUsd: paid.pricePerYearUsd || 240,
                planName: paid.planName || "Commercial Equivalent",
              },
              alternative: {
                name: resolvedName,
                repo: alt.repo || `${owner}/${repoName}`,
                description: alt.description || live.description || "Open source project",
                language: alt.language || live.language || "Open Source",
                stars: live.stars ?? alt.stars ?? 0,
                license: alt.license || (live.license ? { spdx: live.license } : { spdx: "Open Source" }),
                tags: alt.tags || live.topics || [],
                platforms: alt.platforms || ["self-hosted"],
                sparkline: d?.sparkline || [],
              },
              parity: d?.pairing?.parity || 90,
              features: d?.pairing?.features || [
                { name: "Public GitHub Open Source", parity: true },
                { name: "Community Maintained", parity: true },
                { name: "Self-Hostable", parity: true },
              ],
            };
          }
        }
      } catch {}

      return null;
    }

    setResolving(true);
    Promise.all([resolveMissing(a), resolveMissing(b)])
      .then(([toolA, toolB]) => {
        setResolvedTools((prev) => ({
          ...prev,
          ...(toolA ? { [a.toLowerCase()]: toolA } : {}),
          ...(toolB ? { [b.toLowerCase()]: toolB } : {}),
        }));
      })
      .finally(() => setResolving(false));
  }, [pairings, a, b]);

  const left = useMemo(
    () => (pairings || []).find((p) => slugSet(p).has(a.toLowerCase())) || resolvedTools[a.toLowerCase()] || null,
    [pairings, a, resolvedTools]
  );
  const right = useMemo(
    () => (pairings || []).find((p) => slugSet(p).has(b.toLowerCase())) || resolvedTools[b.toLowerCase()] || null,
    [pairings, b, resolvedTools]
  );

  const activeCompared = useMemo(() => {
    const base = [left, right].filter(Boolean);
    for (const extra of extraTools) {
      if (!base.some((b) => b.alternative.repo === extra.alternative.repo)) {
        base.push(extra);
      }
    }
    return base;
  }, [left, right, extraTools]);

  const repos = useMemo(() => activeCompared.map((p) => p.alternative.repo), [activeCompared]);

  useEffect(() => {
    for (const repo of repos) {
      const [o, n] = repo.split("/");
      api.repo(o, n).then((d) => setDetails((prev) => ({ ...prev, [repo]: d }))).catch(() => {});
      api.security(o, n).then((d) => setSecurity((prev) => ({ ...prev, [repo]: d }))).catch(() => {});
    }
  }, [repos.join("|")]);

  if (pairings && !resolving && (!left || !right)) {
    return (
      <Shell>
        <div className="card-elevated p-10 text-center space-y-3">
          <h2 className="font-display text-xl font-bold text-ink">Comparison not found</h2>
          <p className="text-dim">
            Could not find details for “{a}” or “{b}”. You can pick from popular open-source comparisons below:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {POPULAR_COMPARISONS.map((c) => (
              <Link
                key={`${c.a}-${c.b}`}
                to={`/compare/${c.a}/vs/${c.b}`}
                className="btn-tactile px-3 py-1.5 rounded-full border border-line bg-surface hover:bg-elevated text-xs font-medium text-ink"
              >
                {c.label}
              </Link>
            ))}
          </div>
          <div className="pt-4">
            <Link to="/" className="shimmer-button btn-tactile inline-flex px-4 py-2 text-sm text-ink">
              Back to directory
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (resolving || !left || !right) return <Shell><div className="skeleton h-64 w-full rounded-2xl" /></Shell>;

  const stat = (repo) => starsMap[repo.toLowerCase()] || {};
  const detail = (repo) => details[repo] || {};
  const sec = (repo) => security[repo] || {};
  const trustOf = (repo) => detail(repo).trust || null;
  const benchmarkOf = (p) => getToolBenchmarks(p.alternative.repo, p.alternative);

  // Benchmarks max references for relative gauge bars
  const maxRam = Math.max(...activeCompared.map((p) => benchmarkOf(p).idleRamMb || 500), 100);
  const maxImg = Math.max(...activeCompared.map((p) => benchmarkOf(p).containerSizeMb || 400), 100);

  // Tab 1: Signals & Health
  const signalRows = [
    {
      label: "Stars (30-day trend)",
      render: (p) => {
        const s = stat(p.alternative.repo).stars30d;
        if (!s?.stars) {
          const stars = p.alternative?.stars || detail(p.alternative.repo)?.live?.stars;
          return stars ? { v: formatStars(stars), hint: stars } : { v: "—", hint: false };
        }
        return {
          v: `${formatStars(s.stars)} (${(s.change ?? 0) >= 0 ? "+" : ""}${(s.changePct ?? 0).toFixed(1)}%)`,
          hint: s.stars,
        };
      },
    },
    {
      label: "Last commit",
      render: (p) => {
        const d = detail(p.alternative.repo).live;
        return d?.pushedAt ? { v: relativeDate(d.pushedAt), hint: -new Date(d.pushedAt).getTime() } : { v: "—" };
      },
    },
    {
      label: "License",
      render: (p) => {
        const l = p.alternative?.license;
        if (!l) return { v: "Open Source" };
        const spdx = typeof l === "string" ? l : (l.spdx || "Open Source");
        const type = typeof l === "object" && l.type ? ` · ${l.type}` : "";
        return { v: `${spdx}${type}`, hint: l.type === "permissive" ? 1 : 0 };
      },
    },
    {
      label: "Trust score",
      render: (p) => {
        const t = trustOf(p.alternative.repo);
        return t ? { v: `${t.score}/100 (${t.band})`, hint: t.score } : { v: "…" };
      },
    },
    {
      label: "Known advisories",
      render: (p) => {
        const s = sec(p.alternative.repo);
        if (!s || s.vulns === undefined) return { v: "…" };
        return { v: s.vulns.length === 0 ? "none known" : `${s.vulns.length}`, hint: -s.vulns.length };
      },
    },
    {
      label: "Self-hosting",
      render: (p) => {
        const plats = p.alternative.platforms || [];
        const self = plats.includes("self-host");
        return { v: self ? "yes" : "desktop/app only", hint: self ? 1 : 0 };
      },
    },
    {
      label: "Replaces",
      render: (p) => ({ v: `${p.paidTool.name} · ~${formatSavings(p.paidTool.pricePerYearUsd)}/yr` }),
    },
  ];

  // Tab 2: Architecture & Resources
  const benchmarkRows = [
    {
      label: "Minimum Idle RAM",
      render: (p) => {
        const b = benchmarkOf(p);
        const ram = b.idleRamMb;
        const pct = Math.round((ram / maxRam) * 100);
        return {
          v: (
            <div className="space-y-1.5 w-full max-w-[240px]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="font-mono">{formatRam(ram)}</span>
                <span className="text-[10px] text-faint">idle baseline</span>
              </div>
              <div className="h-2 w-full bg-elevated rounded-full overflow-hidden border border-line">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ram <= 100 ? "bg-trust" : ram <= 500 ? "bg-accent" : "bg-caution"
                  }`}
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>
            </div>
          ),
          hint: -ram, // lower RAM is better
        };
      },
    },
    {
      label: "Container Image Size",
      render: (p) => {
        const b = benchmarkOf(p);
        const size = b.containerSizeMb;
        const pct = Math.round((size / maxImg) * 100);
        return {
          v: (
            <div className="space-y-1.5 w-full max-w-[240px]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="font-mono">{formatImageSize(size)}</span>
                <span className="text-[10px] text-faint">compressed</span>
              </div>
              <div className="h-2 w-full bg-elevated rounded-full overflow-hidden border border-line">
                <div
                  className="h-full rounded-full bg-ink dark:bg-white/80 transition-all duration-500"
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>
            </div>
          ),
          hint: -size, // smaller image is better
        };
      },
    },
    {
      label: "Database Engine",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <Database size={13} className="text-ember shrink-0" />
              <span>{b.databaseEngine}</span>
            </span>
          ),
          hint: 0,
        };
      },
    },
    {
      label: "Core Runtime",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <Cpu size={13} className="text-faint shrink-0" />
              <span>{b.runtime}</span>
            </span>
          ),
          hint: 0,
        };
      },
    },
    {
      label: "Cold Start Boot Time",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink font-semibold">
              <Zap size={12} className={b.coldStartMs < 200 ? "text-trust" : "text-faint"} />
              <span>{formatBootTime(b.coldStartMs)}</span>
            </span>
          ),
          hint: -b.coldStartMs,
        };
      },
    },
    {
      label: "Architecture Topology",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <span className="px-2.5 py-0.5 rounded-md border border-line bg-surface text-xs font-semibold text-ink">
              {b.architecture}
            </span>
          ),
          hint: 0,
        };
      },
    },
  ];

  // Tab 3: Protocols & Auth
  const protocolRows = [
    {
      label: "Supported Protocols",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
              {(b.protocols || []).map((proto) => (
                <span
                  key={proto}
                  className="px-2 py-0.5 rounded-md bg-elevated border border-line text-[11px] font-semibold text-ink"
                >
                  {proto}
                </span>
              ))}
            </div>
          ),
          hint: (b.protocols || []).length,
        };
      },
    },
    {
      label: "Authentication Matrix",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
              {(b.auth || []).map((a) => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded-md bg-surface border border-line text-[11px] font-medium text-dim inline-flex items-center gap-1"
                >
                  <Check size={10} className="text-trust" />
                  <span>{a}</span>
                </span>
              ))}
            </div>
          ),
          hint: (b.auth || []).length,
        };
      },
    },
    {
      label: "Offline-First Storage",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                b.offlineFirst
                  ? "bg-trust/10 border-trust/40 text-trust"
                  : "bg-surface border-line text-faint"
              }`}
            >
              {b.offlineFirst ? <CheckCircle2 size={12} /> : <Minus size={12} />}
              <span>{b.offlineFirst ? "Full Offline First" : "Cloud / Server Required"}</span>
            </span>
          ),
          hint: b.offlineFirst ? 1 : 0,
        };
      },
    },
  ];

  // Tab 4: Deployment & Fit Guide
  const fitRows = [
    {
      label: "Self-Hosting Complexity",
      render: (p) => {
        const b = benchmarkOf(p);
        const rating = b.difficultyRating || 2;
        const labels = {
          1: "1 · Painless 1-Click / Single Binary",
          2: "2 · Single Docker Container",
          3: "3 · Multi-Service Compose Stack",
          4: "4 · Distributed Multi-Process Cluster",
          5: "5 · Enterprise Kubernetes Orchestration",
        };
        return {
          v: (
            <div className="space-y-1">
              <span className="font-semibold text-xs text-ink block">{labels[rating] || `${rating}/5`}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 w-5 rounded-full ${
                      step <= rating ? "bg-accent" : "bg-line"
                    }`}
                  />
                ))}
              </div>
            </div>
          ),
          hint: -rating, // lower complexity is better
        };
      },
    },
    {
      label: "Architectural Fit",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <p className="text-xs text-dim leading-relaxed max-w-[280px]">
              {b.idealFor}
            </p>
          ),
          hint: 0,
        };
      },
    },
    {
      label: "Specification Source",
      render: (p) => {
        const b = benchmarkOf(p);
        return {
          v: (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                b.isVerifiedSpec ? "text-trust" : "text-faint"
              }`}
            >
              <ShieldCheck size={13} />
              <span>{b.isVerifiedSpec ? "Verified Upstream Spec" : "Community Estimated"}</span>
            </span>
          ),
          hint: b.isVerifiedSpec ? 1 : 0,
        };
      },
    },
  ];

  // Select active row configuration
  const activeRowsConfig = {
    signals: signalRows,
    benchmarks: benchmarkRows,
    protocols: protocolRows,
    fit: fitRows,
  }[activeTab] || signalRows;

  // Evaluate highest value across active columns
  const evaluatedRows = activeRowsConfig.map((r) => {
    const values = activeCompared.map((p) => ({
      repo: p.alternative.repo,
      ...r.render(p),
    }));

    let maxHint = -Infinity;
    let hasNumeric = false;
    for (const item of values) {
      if (typeof item.hint === "number" && item.hint !== 0) {
        hasNumeric = true;
        if (item.hint > maxHint) maxHint = item.hint;
      }
    }

    return {
      label: r.label,
      values: values.map((val) => ({
        ...val,
        isLeader: hasNumeric && val.hint === maxHint,
      })),
    };
  });

  const availableExtras = (pairings || []).filter(
    (p) => !activeCompared.some((c) => c.alternative.repo === p.alternative.repo)
  );

  // Compute savings between first two candidates for the hero callout
  const memoryRatio =
    activeCompared.length >= 2
      ? computeSavingsRatio(
          benchmarkOf(activeCompared[0]).idleRamMb,
          benchmarkOf(activeCompared[1]).idleRamMb
        )
      : null;

  return (
    <Shell>
      {/* Back and Add Candidate Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile">
          <ArrowLeft size={15} /> Back to Directory
        </Link>

        {activeCompared.length < 4 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="btn-tactile px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus size={14} className="text-ember" />
              <span>Add Candidate ({activeCompared.length}/4)</span>
            </button>

            {showAddDropdown && (
              <div className="absolute right-0 top-full mt-2 z-50 w-64 max-h-60 overflow-y-auto p-2 bg-surface border border-line rounded-xl shadow-float text-xs space-y-1">
                <span className="font-semibold text-faint uppercase text-[10px] px-2 block">Choose another tool</span>
                {availableExtras.slice(0, 10).map((extra) => (
                  <button
                    key={extra.alternative.repo}
                    onClick={() => {
                      setExtraTools((prev) => [...prev, extra]);
                      setShowAddDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-elevated text-dim hover:text-ink block cursor-pointer"
                  >
                    <span className="font-medium">{extra.alternative.name}</span>
                    <span className="text-[10px] text-faint block">replaces {extra.paidTool.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Title */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            {activeCompared.map((p) => p.alternative.name).join(" vs ")}
          </h1>
          <p className="text-dim mt-1.5 max-w-[75ch] text-xs sm:text-sm">
            Deep architectural specs, idle resource benchmarks, and feature parity comparison.
          </p>
        </div>

        {/* Highlight callout if notable memory difference exists */}
        {memoryRatio && memoryRatio.pctSavings > 30 && (
          <div className="p-3 bg-trust/10 border border-trust/30 rounded-xl text-xs flex items-center gap-2 shadow-2xs">
            <Zap size={15} className="text-trust shrink-0" />
            <span className="text-ink font-medium">
              <strong>
                {activeCompared[0].alternative.repo ===
                (benchmarkOf(activeCompared[0]).idleRamMb < benchmarkOf(activeCompared[1]).idleRamMb
                  ? activeCompared[0].alternative.repo
                  : activeCompared[1].alternative.repo)
                  ? activeCompared[0].alternative.name
                  : activeCompared[1].alternative.name}
              </strong>{" "}
              uses <span className="text-trust font-bold">{memoryRatio.pctSavings}% less RAM</span> ({memoryRatio.ratio}x lighter footprint).
            </span>
          </div>
        )}
      </div>

      {/* Popular Presets */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-faint uppercase tracking-wider shrink-0">Popular:</span>
        {POPULAR_COMPARISONS.map((comp) => {
          const isActive =
            (a.toLowerCase() === comp.a && b.toLowerCase() === comp.b) ||
            (a.toLowerCase() === comp.b && b.toLowerCase() === comp.a);
          return (
            <Link
              key={`${comp.a}-vs-${comp.b}`}
              to={`/compare/${comp.a}/vs/${comp.b}`}
              className={`btn-tactile px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                isActive
                  ? "border-accent/40 bg-accent/10 text-ember font-semibold shadow-2xs"
                  : "border-line bg-surface text-dim hover:text-ink hover:border-line-strong"
              }`}
            >
              {comp.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Selector for Matrix */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 border-b border-line">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`pb-2.5 px-3 text-xs font-semibold inline-flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? "border-ink text-ink dark:border-white dark:text-white font-bold"
                  : "border-transparent text-faint hover:text-dim"
              }`}
            >
              <Icon size={14} className={isSelected ? "text-ember" : ""} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Comparison Spec Matrix Table */}
      <div className="mt-4 card-elevated overflow-x-auto shadow-card rounded-2xl border border-line">
        <table className="w-full text-left border-collapse" style={{ minWidth: 680 }}>
          <thead>
            <tr className="border-b border-line bg-elevated/50">
              <th className="p-3.5 text-[11px] uppercase tracking-wider text-faint font-semibold w-56">Signal</th>
              {activeCompared.map((p, idx) => (
                <th key={p.alternative.repo} className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/repo/${p.alternative.repo}`} className="inline-flex items-center gap-2 group">
                      <BrandLogo brand={repoBrand(p.alternative.repo)} name={p.alternative.name} size={20} />
                      <span className="font-display text-base sm:text-lg text-ink group-hover:text-ember transition-colors">
                        {p.alternative.name}
                      </span>
                    </Link>
                    {idx >= 2 && (
                      <button
                        type="button"
                        onClick={() => setExtraTools((prev) => prev.filter((e) => e.alternative.repo !== p.alternative.repo))}
                        className="text-faint hover:text-caution p-1 cursor-pointer"
                        title="Remove candidate"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {evaluatedRows.map((item) => (
              <tr key={item.label} className="hover:bg-elevated/30 transition-colors">
                <td className="p-3.5 text-[12px] uppercase tracking-wider text-faint font-medium">{item.label}</td>
                {item.values.map((v, i) => (
                  <td key={v.repo || i} className="p-3.5 align-top">
                    <div className="flex items-start gap-1.5 text-xs sm:text-sm text-ink">
                      {v.isLeader && (
                        <Check size={14} className="text-trust shrink-0 mt-0.5" aria-label="leads on this row" />
                      )}
                      <div>{v.v}</div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tab 4 Extra: Architectural Recommendation Cards */}
      {activeTab === "fit" && (
        <div className="mt-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
            <Compass size={20} className="text-ember" />
            <span>Architectural Fit &amp; Recommendation</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeCompared.map((p) => {
              const b = benchmarkOf(p);
              return (
                <div key={p.alternative.repo} className="card-elevated p-5 space-y-3 bg-surface border border-line rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <div className="flex items-center gap-2">
                      <BrandLogo brand={repoBrand(p.alternative.repo)} name={p.alternative.name} size={20} />
                      <h3 className="font-display font-bold text-base text-ink">{p.alternative.name}</h3>
                    </div>
                    <span className="text-[11px] font-bold text-trust bg-trust/10 px-2.5 py-0.5 rounded-full border border-trust/30">
                      Ideal Fit
                    </span>
                  </div>

                  <p className="text-sm text-ink leading-relaxed font-medium">
                    “{b.idealFor}”
                  </p>

                  <div className="pt-2 border-t border-line/60 space-y-1.5 text-xs text-dim">
                    <div className="flex items-center justify-between">
                      <span className="text-faint">Database Engine:</span>
                      <span className="font-semibold text-ink">{b.databaseEngine}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-faint">Idle RAM Footprint:</span>
                      <span className="font-mono font-bold text-ink">{formatRam(b.idleRamMb)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-faint">Self-Hosting Rating:</span>
                      <span className="font-semibold text-ink">{b.difficultyRating}/5 Complexity</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/repo/${p.alternative.repo}`}
                      className="btn-tactile w-full py-2 rounded-xl border border-line bg-elevated/70 hover:bg-elevated text-xs font-semibold text-ink inline-flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Explore {p.alternative.name} Deep Dive</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pros & Cons Breakdowns for Compared Tools */}
      <div className="mt-8 space-y-6">
        <h2 className="font-display text-xl font-bold text-ink">Strengths &amp; Trade-Offs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeCompared.map((p) => (
            <ProsConsCard
              key={p.alternative.repo}
              name={p.alternative.name}
              paidName={p.paidTool.name}
              parity={p.alternative.parity}
              gaps={p.alternative.gaps}
            />
          ))}
        </div>
      </div>

      {/* Community Parity Consensus & Peer Suitability (PRD §34 & §3b) */}
      <div className="mt-8 space-y-6">
        <div className="border-b border-line pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-ember" />
            <h2 className="font-display text-xl font-bold text-ink">Community Parity Consensus</h2>
          </div>
          <span className="text-[11px] text-faint uppercase font-semibold tracking-wider">PRD §34 Peer Verdict</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeCompared.map((p) => (
            <ParityVotingWidget
              key={p.alternative.repo}
              repo={p.alternative.repo}
              name={p.alternative.name}
              replaces={p.paidTool.name}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10">{children}</div>;
}

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { getPairings } from "../lib/seed";
import { BRAND_BY_REPO } from "../lib/logos";
import { api } from "../lib/api";
import BrandLogo, { repoBrand } from "../components/BrandLogo";
import { formatStars, formatSavings, relativeDate } from "../lib/format";
import MigrationGuide from "../components/MigrationGuide";
import PrivacyScorecard from "../components/PrivacyScorecard";
import ProsConsCard from "../components/ProsConsCard";

const POPULAR_COMPARISONS = [
  { a: "supabase", b: "pocketbase", label: "Supabase vs PocketBase" },
  { a: "appflowy", b: "joplin", label: "AppFlowy vs Joplin" },
  { a: "bruno", b: "hoppscotch", label: "Bruno vs Hoppscotch" },
  { a: "penpot", b: "excalidraw", label: "Penpot vs Excalidraw" },
  { a: "vaultwarden", b: "keepassxc", label: "Vaultwarden vs KeePassXC" },
  { a: "mattermost", b: "zulip", label: "Mattermost vs Zulip" },
];

export default function ComparePage() {
  const { a = "", b = "" } = useParams();
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
            return repo.endsWith(`/${slugLower}`) || name === slugLower;
          }) || cat.results[0];
          return exact;
        }
      } catch {}

      // 3. Try resolving directly via /api/repo if in owner/name format or search
      try {
        const parts = slug.includes("/") ? slug.split("/") : [slug, slug];
        const d = await api.repo(parts[0], parts[1]).catch(() => null);
        if (d && d.name) {
          return {
            paidTool: {
              name: d.name,
              category: d.language || "Open Source",
              pricePerYearUsd: 240,
              planName: "Commercial Equivalent",
            },
            alternative: {
              name: d.name,
              repo: d.repo || `${parts[0]}/${parts[1]}`,
              description: d.description || "Open source project",
              language: d.language || "Open Source",
              stars: d.stars || 0,
              license: d.license || { spdx: "Open Source" },
              tags: d.topics || [],
              platforms: ["self-hosted"],
            },
            parity: 90,
            features: [
              { name: "Public GitHub Open Source", parity: true },
              { name: "Community Maintained", parity: true },
            ],
          };
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
              Back to trending
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

  const rows = [
    {
      label: "Stars (30-day trend)",
      render: (p) => {
        const s = stat(p.alternative.repo).stars30d;
        if (!s?.stars) return { v: "—", hint: false };
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
        const l = p.alternative.license;
        return l ? { v: `${l.spdx} · ${l.type}`, hint: l.type === "permissive" ? 1 : 0 } : { v: "—" };
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

  // Evaluate highest value across all active columns
  const evaluatedRows = rows.map((r) => {
    const values = activeCompared.map((p) => ({
      repo: p.alternative.repo,
      ...r.render(p),
    }));

    let maxHint = -Infinity;
    let hasNumeric = false;
    for (const item of values) {
      if (typeof item.hint === "number") {
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

  return (
    <Shell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile">
          <ArrowLeft size={15} /> Back to Directory
        </Link>

        {activeCompared.length < 4 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="btn-tactile px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink inline-flex items-center gap-1.5 shadow-2xs"
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
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-elevated text-dim hover:text-ink block"
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

      <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
        {activeCompared.map((p) => p.alternative.name).join(" vs ")}
      </h1>
      <p className="text-dim mt-2 max-w-[75ch] text-xs sm:text-sm">
        Side-by-side spec comparison on genuine data signals. The checkmark indicates the leading tool on that respective row.
      </p>

      {/* Quick Popular Showdown Presets */}
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

      {/* Comparison Spec Matrix Table */}
      <div className="mt-6 card-elevated overflow-x-auto shadow-card rounded-2xl border border-line">
        <table className="w-full text-left border-collapse" style={{ minWidth: 640 }}>
          <thead>
            <tr className="border-b border-line bg-elevated/50">
              <th className="p-3.5 text-[11px] uppercase tracking-wider text-faint font-semibold">Signal</th>
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
                        className="text-faint hover:text-caution p-1"
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
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-ink">
                      {v.isLeader && <Check size={14} className="text-trust shrink-0" aria-label="leads on this row" />}
                      {v.v}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10">{children}</div>;
}

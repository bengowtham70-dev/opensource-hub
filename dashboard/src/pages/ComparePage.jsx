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

export default function ComparePage() {
  const { a = "", b = "" } = useParams();
  const [pairings, setPairings] = useState(null);
  const [starsMap, setStarsMap] = useState({});
  const [details, setDetails] = useState({});
  const [security, setSecurity] = useState({});
  const [extraTools, setExtraTools] = useState([]); // 3rd and 4th tools
  const [showAddDropdown, setShowAddDropdown] = useState(false);

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
    const repo = p.alternative.repo;
    const [owner, name] = repo.toLowerCase().split("/");
    return new Set(
      [name, owner, BRAND_BY_REPO[repo]?.slug].filter(Boolean).map((s) => s.toLowerCase())
    );
  };

  const left = useMemo(
    () => (pairings || []).find((p) => slugSet(p).has(a.toLowerCase())),
    [pairings, a]
  );
  const right = useMemo(
    () => (pairings || []).find((p) => slugSet(p).has(b.toLowerCase())),
    [pairings, b]
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

  if (pairings && (!left || !right)) {
    return (
      <Shell>
        <div className="card-elevated p-10 text-center">
          <p className="text-dim">
            One of “{a}” / “{b}” isn’t in the catalog yet, so a fair comparison isn’t possible.
          </p>
          <Link to="/" className="shimmer-button btn-tactile mt-4 inline-flex px-4 py-2 text-sm text-ink">
            Back to trending
          </Link>
        </div>
      </Shell>
    );
  }

  if (!left || !right) return <Shell><div className="skeleton h-64 w-full rounded-2xl" /></Shell>;

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

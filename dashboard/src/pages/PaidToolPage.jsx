import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getPairings } from "../lib/seed";
import { api } from "../lib/api";
import { paidBrand } from "../components/BrandLogo";
import BrandLogo from "../components/BrandLogo";
import RepoCard from "../components/RepoCard";
import Byte from "../components/Byte";
import Breadcrumbs from "../components/Breadcrumbs";
import SuggestModal from "../components/SuggestModal";
import { groupForCategory } from "../lib/categories";
import { formatSavings } from "../lib/format";

// Parity P3 (plans/PLAN_PARITY.md) — reverse alternatives page:
// "N free alternatives to X" with honest aggregate savings if every switch happened.
export default function PaidToolPage() {
  const { slug } = useParams();
  const [pairings, setPairings] = useState(null);
  const [catalogMatches, setCatalogMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuggest, setShowSuggest] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getPairings().catch(() => []),
      api.catalog({ alternativeTo: slug, limit: 30 }).catch(() => null),
      api.catalog({ q: slug, limit: 30 }).catch(() => null),
    ])
      .then(([seedPairings, altRes, qRes]) => {
        setPairings(seedPairings || []);
        const items = [];
        const seen = new Set();

        for (const r of altRes?.results || []) {
          const repo = r.alternative?.repo?.toLowerCase();
          if (repo && !seen.has(repo)) {
            seen.add(repo);
            items.push(r);
          }
        }
        for (const r of qRes?.results || []) {
          const repo = r.alternative?.repo?.toLowerCase();
          if (repo && !seen.has(repo)) {
            seen.add(repo);
            items.push(r);
          }
        }
        setCatalogMatches(items);
        setLoading(false);
      })
      .catch(() => {
        setPairings([]);
        setLoading(false);
      });
  }, [slug]);

  const matches = useMemo(() => {
    const slugLower = (slug || "").toLowerCase();
    const seedMatches = (pairings || []).filter(
      (p) =>
        p.paidTool?.slug?.toLowerCase() === slugLower ||
        p.paidTool?.name?.toLowerCase() === slugLower
    );
    const seen = new Set(seedMatches.map((p) => p.alternative.repo.toLowerCase()));
    const additional = catalogMatches.filter(
      (p) => !seen.has(p.alternative.repo.toLowerCase())
    );
    return [...seedMatches, ...additional];
  }, [pairings, catalogMatches, slug]);

  const prettyName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ") : "Software";
  const paid = matches[0]?.paidTool || (matches.length > 0 ? {
    name: prettyName,
    slug,
    category: "Software Tool",
    pricePerYearUsd: 240,
    planName: "Standard SaaS Tier",
  } : null);

  const totalSaving = matches.reduce((sum, p) => sum + (p.paidTool?.pricePerYearUsd || 0), 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile">
        <ArrowLeft size={15} /> Trending
      </Link>

      {loading && (
        <div className="mt-6 skeleton h-24 w-full rounded-2xl" />
      )}

      {!loading && matches.length === 0 && (
        <div className="mt-6 card-elevated p-10 text-center space-y-4">
          <Byte size={64} />
          <p className="mt-4 text-dim">
            Nothing pairs with “{slug}” in the catalog yet — the weekly sync may add it.
          </p>
          <button
            type="button"
            onClick={() => setShowSuggest(true)}
            className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Sparkles size={14} className="text-accent" />
            <span>Suggest an alternative for {slug}</span>
          </button>
        </div>
      )}

      {!loading && matches.length > 0 && paid && (
        <>
          <Breadcrumbs
            trail={[
              { label: "Home", to: "/" },
              ...(groupForCategory(paid.category)
                ? [{ label: groupForCategory(paid.category).label, to: "/categories" }]
                : []),
              { label: paid.category, to: "/categories" },
              { label: `Alternatives to ${paid.name}` },
            ]}
          />
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-card-in border-b border-line pb-6">
            <div className="flex items-start gap-4">
              <div className="grid place-items-center size-14 shrink-0 rounded-xl border border-line bg-elevated shadow-sm">
                <BrandLogo brand={paidBrand(paid.slug)} paidSlug={paid.slug} name={paid.name} size={32} />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-display-lg tracking-tight">
                  {matches.length} free {matches.length === 1 ? "alternative" : "alternatives"} to{" "}
                  {paid.name}
                </h1>
                <p className="text-dim mt-1">
                  {paid.category} ·{" "}
                  <span className="line-through decoration-caution/70">
                    ~{formatSavings(paid.pricePerYearUsd)}/yr
                  </span>{" "}
                  ({paid.planName})
                  {matches.length > 1 && (
                    <>
                      {" · "}
                      <span className="text-accent font-semibold">
                        up to {formatSavings(totalSaving)}/yr saved if you switched all {matches.length}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSuggest(true)}
              className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink shadow-xs cursor-pointer shrink-0"
              title={`Suggest another open-source alternative to ${paid.name}`}
            >
              <Sparkles size={14} className="text-accent" />
              <span>+ Suggest Alternative</span>
            </button>
          </header>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {matches.map((p, i) => (
              <RepoCard key={p.alternative.repo} pairing={p} stars30d={null} index={i} />
            ))}
          </div>

          <SuggestModal
            open={showSuggest}
            onClose={() => setShowSuggest(false)}
            prefilledReplaces={paid.name}
            prefilledCategory={paid.category}
          />
        </>
      )}

      {!paid && (
        <SuggestModal
          open={showSuggest}
          onClose={() => setShowSuggest(false)}
          prefilledReplaces={slug}
          prefilledCategory="Developer Tools"
        />
      )}
    </div>
  );
}

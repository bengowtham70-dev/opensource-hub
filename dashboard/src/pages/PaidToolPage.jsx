import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getPairings } from "../lib/seed";
import { paidBrand } from "../components/BrandLogo";
import BrandLogo from "../components/BrandLogo";
import RepoCard from "../components/RepoCard";
import Byte from "../components/Byte";
import Breadcrumbs from "../components/Breadcrumbs";
import { groupForCategory } from "../lib/categories";
import { formatSavings } from "../lib/format";

// Parity P3 (plans/PLAN_PARITY.md) — reverse alternatives page:
// "N free alternatives to X" with honest aggregate savings if every switch happened.
export default function PaidToolPage() {
  const { slug } = useParams();
  const [pairings, setPairings] = useState(null);

  useEffect(() => {
    getPairings().then(setPairings).catch(() => setPairings([]));
  }, []);

  const matches = useMemo(
    () => (pairings || []).filter((p) => p.paidTool.slug === slug),
    [pairings, slug]
  );
  const paid = matches[0]?.paidTool || null;
  const totalSaving = matches.reduce((sum, p) => sum + (p.paidTool.pricePerYearUsd || 0), 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile">
        <ArrowLeft size={15} /> Trending
      </Link>

      {!pairings && (
        <div className="mt-6 skeleton h-24 w-full rounded-2xl" />
      )}

      {pairings && matches.length === 0 && (
        <div className="mt-6 card-elevated p-10 text-center">
          <Byte size={64} />
          <p className="mt-4 text-dim">
            Nothing pairs with “{slug}” in the catalog yet — the weekly sync may add it.
          </p>
        </div>
      )}

      {paid && (
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
          <header className="flex items-start gap-4 animate-card-in">
            <div className="grid place-items-center size-14 shrink-0 rounded-xl border border-line bg-elevated">
              <BrandLogo brand={paidBrand(paid.slug)} name={paid.name} size={26} />
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
          </header>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {matches.map((p, i) => (
              <RepoCard key={p.alternative.repo} pairing={p} stars30d={null} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

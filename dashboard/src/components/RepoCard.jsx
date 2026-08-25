import { useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowRight, Star, GitCommitHorizontal } from "lucide-react";
import Sparkline from "./Sparkline";
import LicenseBadge from "./LicenseBadge";
import { formatStars, formatSavings, formatCompact, relativeDate } from "../lib/format";
import { useFavorites } from "../stores/favorites";

// Comparison card per DESIGN.md §6.2 — paid tool → open-source alternative,
// with savings pill, sparkline, staggered entrance and mouse light sweep.
// `freshness` (PRD Phase-2 item 6): {pushedAt,days,tone} from snapshot meta —
// omitted entirely on seed data so we never show a fabricated freshness state.
// `maintenance` (PRD section 2.2 mandate): {status} Active/Slowing/Abandoned —
// color-coded pill on every card; hidden until snapshot meta exists.
// `downloads` (PRD section 35): latest weekly {npm,pypi,docker,sampledAt}
// sample from the snapshot sync — hidden until the cron populates it.
export default function RepoCard({ pairing, stars30d, freshness = null, maintenance = null, downloads = null, index = 0 }) {
  const ref = useRef(null);
  const fav = useFavorites();
  const a = pairing.alternative;
  const paid = pairing.paidTool;
  // PRD §38 relationship typing (enrichPairing defaults legacy entries to "direct").
  const rel = a.relationship || "direct";
  const isFav = fav.has(a.repo);

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <article
      ref={ref}
      onMouseMove={onMouseMove}
      className="card-glass group p-5 flex flex-col gap-3.5 animate-card-in"
      style={{ animationDelay: `${Math.min(index, 11) * 40}ms`, opacity: 0 }}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/repo/${a.repo}`}
            className="font-display text-display-md text-ink tracking-tight hover:text-primary transition-colors"
          >
            {a.name}
          </Link>
          <p className="text-[12px] text-faint tnum mt-0.5">{a.repo}</p>
        </div>
        <button
          type="button"
          aria-label={isFav ? `Remove ${a.name} from favorites` : `Add ${a.name} to favorites`}
          aria-pressed={isFav}
          onClick={() => fav.toggle(a.repo)}
          className={`btn-tactile shrink-0 grid place-items-center size-9 rounded-full border transition-colors ${
            isFav
              ? "bg-trust/15 border-trust/40 text-trust"
              : "border-line text-faint hover:text-dim hover:border-line-strong"
          }`}
        >
          <Heart size={16} fill={isFav ? "currentColor" : "none"} />
        </button>
      </header>

      <p className="text-sm text-dim leading-relaxed line-clamp-2">{a.description}</p>

      <div className="flex items-center gap-2.5">
        <Sparkline history={stars30d?.history || []} positive={(stars30d?.change ?? 0) >= 0} />
        <div className="flex flex-col">
          <span
            className={`tnum text-[13px] font-medium ${(stars30d?.change ?? 0) >= 0 ? "text-trust" : "text-caution"}`}
          >
            {(stars30d?.change ?? 0) >= 0 ? "+" : ""}
            {(stars30d?.changePct ?? 0).toFixed(1)}% · 30d
          </span>
          <span className="tnum text-[12px] text-faint inline-flex items-center gap-1">
            <Star size={11} className="text-caution" fill="currentColor" />
            {formatStars(stars30d?.stars ?? 0)}
            {/* PRD Phase-2 item 6 freshness pill — green <90d / amber >180d. */}
            {freshness && (
              <span
                title={`last push ${freshness.pushedAt?.slice(0, 10) || "unknown"} (${freshness.days}d ago)`}
                className={`inline-flex items-center gap-0.5 ml-1 px-1.5 rounded-full border ${
                  freshness.tone === "trust"
                    ? "border-trust/30 text-trust"
                    : freshness.tone === "caution"
                      ? "border-caution/30 text-caution"
                      : "border-line text-faint"
                }`}
              >
                <GitCommitHorizontal size={11} />
                {relativeDate(freshness.pushedAt)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* PRD section 35 — popularity beyond stars, mono metrics row. Hidden
          until the weekly snapshot lands a sample; never rendered as zeros. */}
      {downloads && (
        <div
          title={`Package activity — weekly sample ${downloads.sampledAt || ""}`.trim()}
          className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 tnum text-[12px] text-faint"
        >
          {downloads.npm != null && (
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-caution" aria-hidden="true" />
              {formatCompact(downloads.npm)} npm/mo
            </span>
          )}
          {downloads.pypi != null && (
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-tech" aria-hidden="true" />
              {formatCompact(downloads.pypi)} pypi/mo
            </span>
          )}
          {downloads.docker != null && (
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {formatCompact(downloads.docker)} pulls
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {/* PRD section 2.2 — maintenance pill on every comparison card. Red is
            the TrustMeter "high-risk" precedent (#dc2626); no new token added. */}
        {maintenance?.status && (
          <span
            title={`Maintenance status: ${maintenance.status}`}
            className="px-2 py-0.5 rounded-full border text-[11px] tnum inline-flex items-center gap-1"
            style={
              maintenance.status === "active"
                ? { color: "var(--color-trust)", borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }
                : maintenance.status === "slowing"
                  ? { color: "var(--color-caution)", borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)" }
                  : { color: "#dc2626", borderColor: "rgba(220,38,38,0.30)", background: "rgba(220,38,38,0.06)" }
            }
          >
            <span className="size-1.5 rounded-full" style={{ background: "currentColor" }} aria-hidden="true" />
            {maintenance.status}
          </span>
        )}
        {/* PRD §38 relationship typing pill — Direct=emerald / Partial=indigo / Fork=cyan. */}
        <span
          title={
            a.relationship === "direct"
              ? "Drop-in replacement covering the paid tool's core workflows"
              : a.relationship === "fork"
                ? "Forked from another project — lineage matters here"
                : "Covers part of the paid tool's feature set — check the parity list"
          }
          className={`px-2 py-0.5 rounded-full border text-[11px] tnum ${
            rel === "direct"
              ? "border-trust/25 bg-trust/10 text-trust"
              : rel === "fork"
                ? "border-tech/25 bg-tech/10 text-tech"
                : "border-primary/25 bg-primary/10 text-primary"
          }`}
        >
          {rel.charAt(0).toUpperCase() + rel.slice(1)}
        </span>
        <span className="px-2 py-0.5 rounded-full border border-tech/25 bg-tech/10 text-tech text-[11px] tnum">
          {a.language}
        </span>
        {/* PRD §3/§3a license compliance flag (F2). */}
        <LicenseBadge license={a.license} />
        {a.tags.slice(0, 3).map((t) => (
          <span key={t} className="px-2 py-0.5 rounded-full border border-line text-dim text-[11px]">
            {t}
          </span>
        ))}
      </div>

      {/* Paid tool → alternative transition with savings pill (DESIGN.md §6.2). */}
      <footer className="mt-auto pt-1 flex items-center justify-between gap-2 border-t border-line">
        <div className="min-w-0" title={`${paid.name} ${paid.planName}`}>
          <span className="tnum text-[12px] text-faint line-through decoration-caution/70">
            {formatSavings(paid.pricePerYearUsd)}/yr
          </span>
          <span className="ml-1.5 text-[12px] text-faint truncate">{paid.name}</span>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-trust/10 border border-trust/30 text-trust text-[12px] font-semibold whitespace-nowrap">
          <ArrowRight size={12} /> Save {formatSavings(paid.pricePerYearUsd)}/yr
        </span>
      </footer>
    </article>
  );
}

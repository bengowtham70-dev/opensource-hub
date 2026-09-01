import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Star,
  Clock,
  Scale,
  ShieldCheck,
  Zap,
  Flame,
  GitCommitHorizontal,
  TrendingUp,
} from "lucide-react";
import BrandLogo, { repoBrand, paidBrand } from "./BrandLogo";
import { formatStars, formatSavings, formatCompact, relativeDate } from "../lib/format";
import { useFavorites } from "../stores/favorites";

export default function RepoCard({
  pairing,
  stars30d,
  freshness = null,
  maintenance = null,
  downloads = null,
  index = 0,
}) {
  const navigate = useNavigate();
  const fav = useFavorites();
  const a = pairing.alternative;
  const paid = pairing.paidTool;
  const isFav = fav.has(a.repo);

  const starsCount = stars30d?.stars ?? a.stars ?? 0;
  const isHot = (typeof stars30d?.delta === "number" && stars30d.delta >= 300) || (typeof stars30d?.growthPct === "number" && stars30d.growthPct >= 8);
  const licenseSpdx = a.license?.spdx || "Open Source";
  const commitDate = freshness?.pushedAt || a.pushedAt || a.lastPushedAt || pairing?.pushedAt || null;

  return (
    <article
      onClick={() => navigate(`/repo/${a.repo}`)}
      className="card-elevated group p-5 flex flex-col justify-between gap-3 animate-card-in relative cursor-pointer select-none transition-all duration-300 hover:shadow-card hover:border-line-strong bg-surface overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 11) * 40}ms`, opacity: 0 }}
    >
      {/* Smooth Background Raccoon Mascot Watermark (Zero color/orange, clean monochrome outline) */}
      <div
        className="pointer-events-none absolute -bottom-8 -right-8 w-48 h-48 sm:w-56 sm:h-56 opacity-0 group-hover:opacity-15 group-active:opacity-30 transition-all duration-500 ease-out transform translate-y-4 group-hover:translate-y-0 group-active:scale-105 select-none z-0"
        aria-hidden="true"
      >
        <img
          src="/mascot-transparent.png"
          alt=""
          className="w-full h-full object-contain filter grayscale dark:invert contrast-125 pointer-events-none"
        />
      </div>

      {/* 1. Header: Raw Clean Logo, Tool Name, Category / Verified, Red Hot badge, Favorite */}
      <div className="flex flex-col gap-3 relative z-10">
        <header className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo brand={repoBrand(a.repo)} repo={a.repo} avatarUrl={a.ownerAvatar} name={a.name} size={36} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to={`/repo/${a.repo}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-display text-xl font-bold text-ink tracking-tight hover:text-ember transition-colors truncate"
                >
                  {a.name}
                </Link>
                <span className="text-trust shrink-0" title="Verified Open Source Project" aria-label="Verified">
                  <ShieldCheck size={16} />
                </span>
                {/* Hot badge in vivid red */}
                {isHot && (
                  <span
                    title="Fast-rising high momentum repository"
                    className="px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[11px] inline-flex items-center gap-1"
                  >
                    <Flame size={12} className="text-red-500 fill-red-500" /> Hot
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full border border-line bg-surface text-[11px] font-medium text-dim">
                  {paid.category}
                </span>
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
              </div>
              <p className="text-[12px] text-faint tnum truncate mt-0.5">{a.repo}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label={isFav ? `Remove ${a.name} from favorites` : `Add ${a.name} to favorites`}
            aria-pressed={isFav}
            onClick={(e) => {
              e.stopPropagation();
              fav.toggle(a.repo);
            }}
            className={`btn-tactile shrink-0 grid place-items-center size-8 rounded-full border transition-colors ${
              isFav
                ? "bg-trust/15 border-trust/40 text-trust"
                : "border-line text-faint hover:text-dim hover:border-line-strong"
            }`}
          >
            <Heart size={15} fill={isFav ? "currentColor" : "none"} />
          </button>
        </header>

        {/* 2. Tagline: Concise 2-line description */}
        <p className="text-xs text-dim leading-relaxed line-clamp-2 min-h-[36px]" title={a.description}>
          {a.description}
        </p>

        {/* 3. Specs Area: Dotted Specs on Rest -> Expanded Definition on Hover */}
        <div className="relative min-h-[72px]">
          {/* Resting State: Dotted Specs (visible by default, hidden on hover) */}
          <div className="space-y-1.5 text-xs group-hover:hidden transition-all">
            {/* Stars row */}
            <div className="card-spec-row">
              <span className="inline-flex items-center gap-1 text-dim">
                <Star size={12} className="text-caution" aria-hidden /> Stars
              </span>
              <span className="card-spec-leader" aria-hidden />
              <span className="font-semibold text-ink tnum inline-flex items-center gap-1">
                {typeof stars30d?.delta === "number" && stars30d.delta > 0 && (
                  <span className="text-trust text-[11px] inline-flex items-center gap-0.5">
                    <TrendingUp size={11} className="shrink-0" />
                    <span>+{stars30d.delta.toLocaleString()}</span>
                  </span>
                )}
                <span>{formatStars(starsCount)}</span>
              </span>
            </div>

            {/* Last commit row */}
            <div className="card-spec-row">
              <span className="inline-flex items-center gap-1 text-dim">
                <Clock size={12} className="text-faint" aria-hidden /> Last commit
              </span>
              <span className="card-spec-leader" aria-hidden />
              <span className="font-medium text-ink tnum inline-flex items-center gap-1">
                {freshness && (
                  <span
                    title={`last push ${freshness.pushedAt?.slice(0, 10) || "unknown"} (${freshness.days}d ago)`}
                    className={`inline-flex items-center gap-0.5 px-1.5 rounded-full border text-[11px] ${
                      freshness.tone === "trust"
                        ? "border-trust/30 text-trust"
                        : freshness.tone === "caution"
                          ? "border-caution/30 text-caution"
                          : "border-line text-faint"
                    }`}
                  >
                    <GitCommitHorizontal size={11} />
                    {freshness.days}d ago
                  </span>
                )}
                {!freshness && (commitDate ? relativeDate(commitDate) : "Recent")}
              </span>
            </div>

            {/* License row */}
            <div className="card-spec-row">
              <span className="inline-flex items-center gap-1 text-dim">
                <Scale size={12} className="text-faint" aria-hidden /> License
              </span>
              <span className="card-spec-leader" aria-hidden />
              <span className="font-medium text-ink truncate max-w-[120px]" title={licenseSpdx}>
                {licenseSpdx}
              </span>
            </div>
          </div>

          {/* Hover State: Expanded Definition / Value Prop */}
          <div className="hidden group-hover:block text-[11.5px] text-dim leading-relaxed p-2 rounded-lg bg-elevated border border-line animate-card-in">
            <span className="font-semibold text-ink">Open Source Alternative: </span>
            {a.description} Governed by the <span className="font-semibold text-ink">{licenseSpdx}</span> license.
          </div>
        </div>

        {/* Package downloads if sampled */}
        {downloads && (
          <div
            title={`Package activity — weekly sample ${downloads.sampledAt || ""}`.trim()}
            className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 tnum text-[11.5px] text-faint"
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
      </div>

      {/* 4. Saving Option Under It (Alternative To + Save $XXX/yr) */}
      <footer className="pt-2 flex items-center justify-between gap-2 border-t border-line/70 mt-2 relative z-10">
        <div className="min-w-0 flex items-center gap-1.5" title={`Alternative to ${paid.name}`}>
          <span className="text-[11.5px] text-faint">Alternative to:</span>
          <Link
            to={`/alternatives/${paid.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="btn-tactile inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-line bg-surface hover:border-line-strong hover:bg-elevated text-xs font-medium text-ink transition-colors"
          >
            <BrandLogo brand={paidBrand(paid.slug)} name={paid.name} size={14} />
            <span>{paid.name}</span>
          </Link>
        </div>

        {/* Savings Pill */}
        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold">
          <Zap size={12} />
          <span>Save ~{formatSavings(paid.pricePerYearUsd)}/yr</span>
        </span>
      </footer>
    </article>
  );
}

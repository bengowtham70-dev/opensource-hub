import { useState } from "react";
import { BRAND_BY_REPO, BRAND_BY_PAID, PAID_DOMAINS } from "../lib/logos";

// PRD Phase 2 polish — real brand marks from Simple Icons (verified slugs only).
export function repoBrand(repo) {
  return BRAND_BY_REPO[repo] || null;
}

export function paidBrand(slug) {
  return BRAND_BY_PAID[slug] || null;
}

export function paidDomain(slug) {
  return PAID_DOMAINS[slug] || null;
}

export default function BrandLogo({
  brand,
  paidSlug = "",
  repo = "",
  avatarUrl = "",
  name = "",
  size = 20,
  className = ""
}) {
  const [imgError, setImgError] = useState(false);

  // 1. High-precision vector brand SVG (Simple Icons)
  const resolvedBrand = brand || (paidSlug ? paidBrand(paidSlug) : null) || (repo ? repoBrand(repo) : null);
  if (resolvedBrand && resolvedBrand.path) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="img"
        aria-label={`${resolvedBrand.title || name} logo`}
        className={`shrink-0 ${className}`}
      >
        <title>{resolvedBrand.title || name}</title>
        <path d={resolvedBrand.path} fill={`#${resolvedBrand.hex || "121212"}`} />
      </svg>
    );
  }

  // 2. High-resolution Web Favicon / CDN Logo for Commercial Paid Tools
  const domain = (paidSlug ? paidDomain(paidSlug) : null) || (name && PAID_DOMAINS[name.toLowerCase().replace(/[^a-z0-9]/g, '-')]) || null;
  const resolvedPaidIcon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=${Math.max(64, size * 2)}` : null;

  // 3. Official GitHub project / organization logo avatar for Open Source Repos
  const owner = repo ? repo.split("/")[0] : "";
  const resolvedRepoAvatar = avatarUrl || (owner ? `https://github.com/${owner}.png?size=${Math.max(64, size * 2)}` : null);

  const activeImgSrc = resolvedPaidIcon || resolvedRepoAvatar;

  if (activeImgSrc && !imgError) {
    return (
      <img
        src={activeImgSrc}
        alt={`${name || repo || paidSlug} logo`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setImgError(true)}
        className={`shrink-0 rounded-md object-contain bg-white dark:bg-zinc-900 border border-line/70 shadow-2xs ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    );
  }

  // 4. Clean tactile letter mark fallback
  const letter = (name || repo || paidSlug || "?").charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={`grid place-items-center shrink-0 rounded-md bg-elevated border border-line-strong text-ink font-display font-semibold select-none ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: Math.max(10, Math.round(size * 0.55)) }}
    >
      {letter}
    </span>
  );
}

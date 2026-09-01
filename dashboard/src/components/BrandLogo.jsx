import { useState } from "react";
import { BRAND_BY_REPO, BRAND_BY_PAID } from "../lib/logos";

// PRD Phase 2 polish — real brand marks from Simple Icons (verified slugs only).
export function repoBrand(repo) {
  return BRAND_BY_REPO[repo] || null;
}

export function paidBrand(slug) {
  return BRAND_BY_PAID[slug] || null;
}

export default function BrandLogo({ brand, repo = "", avatarUrl = "", name = "", size = 20, className = "" }) {
  const [imgError, setImgError] = useState(false);
  const resolvedBrand = brand || (repo ? repoBrand(repo) : null);

  // 1. High-precision vector brand SVG (Simple Icons)
  if (resolvedBrand) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role="img"
        aria-label={`${resolvedBrand.title} logo`}
        className={`shrink-0 ${className}`}
      >
        <title>{resolvedBrand.title}</title>
        <path d={resolvedBrand.path} fill={`#${resolvedBrand.hex}`} />
      </svg>
    );
  }

  // 2. Official GitHub project / organization logo avatar
  const owner = repo ? repo.split("/")[0] : "";
  const resolvedAvatar = avatarUrl || (owner ? `https://github.com/${owner}.png?size=${Math.max(64, size * 2)}` : null);

  if (resolvedAvatar && !imgError) {
    return (
      <img
        src={resolvedAvatar}
        alt={`${name || repo} logo`}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className={`shrink-0 rounded-lg object-contain bg-surface border border-line shadow-2xs ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // 3. Clean tactile letter mark fallback
  const letter = (name || repo || "?").charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={`grid place-items-center shrink-0 rounded-lg bg-elevated border border-line-strong text-dim font-display font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.52) }}
    >
      {letter}
    </span>
  );
}

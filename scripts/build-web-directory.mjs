// plans/web-directory/PLAN.md W1 â€” zero-dependency static site generator for the
// public web directory (PRD Â§5b). Pre-renders HTML from the SAME data files the
// local daemon reads, so website and dashboard can never drift. Output: web-dist/
// (landing-page/ is copied to its root so existing links keep working).
//
// Honesty rules enforced here (PRD Â§2.2/Â§38): public pages render freshness /
// maintenance / sparklines ONLY from genuine snapshot meta + history â€” the
// synthetic seed curve never appears on a public page.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "web-dist");

// ---------- pure helpers (exported for tests) ----------

export function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function deriveSlug(repo, taken = new Set()) {
  const [owner, name] = repo.split("/");
  let slug = name.toLowerCase();
  if (taken.has(slug)) slug = `${owner}-${slug}`.toLowerCase(); // collision fallback
  return slug;
}

const fmtStars = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);

// Genuine-history gate: <8 real samples â†’ no sparkline on public pages, ever.
export function sparklineSvg(history) {
  if (!Array.isArray(history) || history.length < 8) return "";
  const pts = history.slice(-30);
  const stars = pts.map((p) => p.stars);
  const min = Math.min(...stars);
  const max = Math.max(...stars);
  const span = max - min || 1;
  const step = 120 / (pts.length - 1);
  const points = stars
    .map((s, i) => `${(i * step).toFixed(1)},${(28 - ((s - min) / span) * 24).toFixed(1)}`)
    .join(" ");
  const positive = stars[stars.length - 1] >= stars[0];
  const color = positive ? "#10b981" : "#f59e0b";
  return `<svg class="spark" viewBox="0 0 120 30" width="120" height="30" aria-hidden="true"><polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" points="${points}"/></svg>`;
}

function pill(label, tone) {
  const colors = {
    trust: ["rgba(16,185,129,.3)", "var(--trust)", "rgba(16,185,129,.08)"],
    caution: ["rgba(245,158,11,.3)", "var(--caution)", "rgba(245,158,11,.08)"],
    dim: ["rgba(255,255,255,.12)", "var(--dim)", "transparent"],
    red: ["rgba(248,113,113,.35)", "#f87171", "rgba(248,113,113,.08)"], // TrustMeter precedent
  }[tone];
  return `<span class="pill" style="border-color:${colors[0]};color:${colors[1]};background:${colors[2]}">${esc(label)}</span>`;
}

export function maintenancePill(maintenance) {
  if (!maintenance?.status) return "";
  const tone =
    maintenance.status === "active" ? "trust" : maintenance.status === "slowing" ? "caution" : "red";
  return pill(maintenance.status, tone);
}

function freshnessPill(freshness) {
  if (!freshness?.days && freshness?.days !== 0) return "";
  const tone = freshness.days < 90 ? "trust" : freshness.days > 180 ? "caution" : "dim";
  return pill(`${freshness.days}d`, tone);
}

// ---------- §3d shared components (share bar, byline, metadata math) ----------

export function shareBarHtml(url, title) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    ["X", `https://x.com/intent/post?text=${t}&url=${u}`],
    ["Reddit", `https://reddit.com/submit?url=${u}&title=${t}`],
    ["Hacker News", `https://news.ycombinator.com/submitlink?u=${u}&t=${t}`],
    ["LinkedIn", `https://linkedin.com/sharing/share-offsite?url=${u}`],
  ];
  return `<div class="share-bar"><span class="lbl">Share</span>${links
    .map(([n, h]) => `<a rel="noopener noreferrer" target="_blank" href="${h}">${esc(n)}</a>`)
    .join("")}<button type="button" data-share-copy onclick="if(navigator.clipboard){navigator.clipboard.writeText(location.href);this.textContent='Copied'}">Copy link</button></div>`;
}

export function bylineHtml(updatedIso, ctx) {
  const d = esc(String(updatedIso || "").slice(0, 10));
  return `<div class="byline"><span class="avatar">OH</span><span>Compiled by the OpenSource Hub team &middot; Last updated ${d}${
    ctx?.routes.has("about") ? ` &middot; <a href="/about.html">how rankings work</a>` : ""
  }</span></div>`;
}

export function repoAgeYears(meta) {
  if (!meta?.createdAt) return null;
  return +(((Date.now() - new Date(meta.createdAt).getTime()) / (365.25 * 86400000)).toFixed(1));
}

export function growth30d(history) {
  if (!Array.isArray(history) || history.length < 8) return null;
  const pts = history.slice(-30);
  const first = pts[0]?.stars;
  const last = pts[pts.length - 1]?.stars;
  if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) return null;
  return { gained: last - first, pct: +(((last - first) / first) * 100).toFixed(1) };
}

function pushDaysAgo(meta) {
  const d = meta?.pushedAt
    ? Math.floor((Date.now() - new Date(meta.pushedAt).getTime()) / 86400000)
    : null;
  if (d == null) return null;
  return d === 0 ? "today" : `${d}d ago`;
}

function winnerHigher(aVal, bVal) {
  if (aVal == null || bVal == null || aVal === bVal) return "tie";
  return aVal > bVal ? "a" : "b";
}

function winnerLower(aVal, bVal) {
  if (aVal == null || bVal == null || aVal === bVal) return "tie";
  return aVal < bVal ? "a" : "b";
}

// §3d Tier-2 — average 30-day momentum across a group of pairings.
// Honest null on seed data: no real history, no badge, ever.
export function categoryGrowth(pairings, snapshots) {
  const vals = [];
  for (const p of pairings || []) {
    const g = growth30d(snapshots?.history?.[p.alternative.repo]);
    if (g && Number.isFinite(g.pct)) vals.push(g.pct);
  }
  if (!vals.length) return null;
  return { pct: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1), n: vals.length };
}

function growthPillHtml(g) {
  if (!g) return "";
  const up = g.pct >= 0;
  return `<span class="pill" style="border-color:${up ? "rgba(16,185,129,.3)" : "rgba(245,158,11,.3)"};color:${up ? "var(--trust)" : "var(--caution)"}">${up ? "+" : ""}${g.pct}% avg 30d</span>`;
}

// Deterministic OG card path per page route â€” single source shared with
// scripts/generate-og-images.mjs (W7) so meta tags and files can never drift.
export function ogImagePath(route) {
  const flat = String(route || "").replace(/^\//, "").replace(/\//g, "__") || "home";
  return `/og/${flat}.png`;
}

// ---------- layout ----------

const CSS = `
:root{--base:#07090e;--surface:#0d111a;--elevated:#151b28;--primary:#6366f1;--trust:#10b981;
--caution:#f59e0b;--tech:#06b6d4;--ink:#f8fafc;--dim:#94a3b8;--faint:#64748b;
--border:rgba(255,255,255,.09);--font-d:"Outfit Variable","Plus Jakarta Sans",ui-sans-serif,sans-serif;
--font-b:"Inter Variable",system-ui,sans-serif;--font-m:"JetBrains Mono",ui-monospace,monospace}
*{box-sizing:border-box;margin:0}
body{background:var(--base);color:var(--dim);font-family:var(--font-b);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(7,9,14,.85);backdrop-filter:blur(12px);z-index:9}
.nav{display:flex;align-items:center;gap:22px;height:60px}
.logo{font-family:var(--font-d);font-weight:700;color:var(--ink);font-size:17px}
.logo b{color:var(--primary)}
.nav a{font-size:13.5px;color:var(--dim)}.nav a:hover{color:var(--ink)}
.nav .spacer{flex:1}
main{padding:40px 0 72px}
h1{font-family:var(--font-d);color:var(--ink);font-size:38px;letter-spacing:-.02em;line-height:1.15}
.repo-line{font-family:var(--font-m);font-size:13px;color:var(--faint);margin-top:6px}
.desc{margin-top:14px;max-width:70ch;font-size:15.5px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;margin-top:18px}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;align-items:center}
.pill{display:inline-flex;align-items:center;gap:5px;padding:2px 10px;border-radius:999px;border:1px solid;font-size:11.5px;font-family:var(--font-m)}
.stat{display:flex;gap:26px;flex-wrap:wrap;margin-top:16px}
.stat b{display:block;font-family:var(--font-m);color:var(--ink);font-size:19px}
.stat span{font-size:12px;color:var(--faint)}
.spark-wrap{display:flex;align-items:center;gap:12px;margin-top:14px}
.spark polyline{filter:drop-shadow(0 0 4px rgba(16,185,129,.35))}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:999px;border:1px solid var(--border);font-size:13.5px;color:var(--ink);transition:border-color .25s,transform .25s}
.btn:hover{border-color:rgba(99,102,241,.5)}
.btn:active{transform:scale(.97)}
.btn.primary{background:linear-gradient(135deg,#6366f1,#4f46e5);border-color:transparent;font-weight:600}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:14px}
.shots img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;border:1px solid var(--border);background:var(--elevated)}
h2{font-family:var(--font-d);color:var(--ink);font-size:19px;margin-top:34px}
.install{display:inline-flex;align-items:center;gap:10px;margin-top:16px;padding:10px 16px;border-radius:12px;background:var(--elevated);border:1px solid var(--border);font-family:var(--font-m);font-size:13.5px;color:var(--ink)}
.install .p{color:var(--faint)}
.install .pkg{color:var(--tech)}
footer{border-top:1px solid var(--border);padding:26px 0;font-size:12.5px;color:var(--faint)}
footer a:hover{color:var(--ink)}
table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:560px}
th{font-family:var(--font-m);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);text-align:left;padding:8px 10px;border-bottom:1px solid var(--border)}
td{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.05)}
tbody tr:hover td{background:rgba(99,102,241,.04)}
tbody tr td:first-child a{color:var(--ink);font-weight:600}
tbody tr td:first-child a:hover{color:var(--primary)}
.faq details{border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:12px 16px;margin-top:8px}
.faq summary{cursor:pointer;color:var(--ink);font-size:14px;font-weight:600}
.faq p{margin-top:8px;font-size:14px}
.checklist{list-style:none;padding:0;margin-top:6px;font-size:13.5px;display:grid;gap:4px}
.hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.hub-card{display:flex;flex-direction:column;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;transition:border-color .25s,transform .25s}
.hub-card:hover{border-color:rgba(99,102,241,.5);transform:translateY(-2px)}
.hub-card strong{color:var(--ink);font-family:var(--font-d);font-size:15px}
.hub-card .cat{font-size:11.5px;color:var(--tech)}
.hub-card .save{font-size:12px;color:var(--trust);font-family:var(--font-m)}
.chip{background:transparent;border:1px solid var(--border);border-radius:999px;color:var(--dim);font-size:12px;font-family:var(--font-m);padding:4px 12px;cursor:pointer;transition:border-color .25s,color .25s}
.chip span{opacity:.6}
.chip:hover{color:var(--ink)}
.pager{display:flex;gap:8px;margin-top:22px;font-family:var(--font-m)}
.pager a,.pager b{padding:5px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;color:var(--dim)}
.pager b{color:var(--ink);border-color:rgba(99,102,241,.5)}
.ad-banner{display:flex;align-items:center;gap:14px;margin:0 0 16px;padding:12px 18px;border:1px solid var(--border);border-radius:14px;background:var(--surface);position:relative}
.ad-banner .ad-tag{font-family:var(--font-m);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);border:1px solid var(--border);border-radius:999px;padding:2px 8px}
.tier{display:flex;flex-direction:column;align-items:flex-start}
.tier.popular{border-color:rgba(99,102,241,.45)}
.share-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:20px;font-family:var(--font-m)}
.share-bar .lbl{font-size:11px;color:var(--faint);letter-spacing:.06em;text-transform:uppercase}
.share-bar a,.share-bar button{font-size:12px;color:var(--dim);border:1px solid var(--border);background:transparent;border-radius:999px;padding:5px 14px;cursor:pointer;text-decoration:none;transition:border-color .25s,color .25s}
.share-bar a:hover,.share-bar button:hover{color:var(--ink);border-color:rgba(99,102,241,.5)}
.byline{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:13px;color:var(--dim)}
.byline a{color:var(--tech)}
.byline .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#0ea5e9);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;font-family:var(--font-m);flex:none}
.cmp-head{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}
.cmp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px}
.cmp-card h3{margin:0 0 6px;color:var(--ink)}
.cmp-card .st{font-family:var(--font-m);font-size:13px;color:var(--dim)}
.cmp-grid{display:grid;gap:10px;margin-top:18px}
.cmp-row{display:grid;grid-template-columns:1fr minmax(140px,auto) 1fr;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 16px}
.cmp-row .side{font-size:13.5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cmp-row .side:last-child{justify-content:flex-end;text-align:right}
.cmp-dim{font-family:var(--font-m);font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--faint);text-align:center;line-height:1.5}
.cmp-win{color:var(--trust);border:1px solid rgba(16,185,129,.3);background:rgba(16,185,129,.08);border-radius:999px;padding:1px 9px;font-size:10.5px;font-family:var(--font-m)}
.cmp-tie{color:var(--faint);border:1px solid var(--border);border-radius:999px;padding:1px 9px;font-size:10.5px;font-family:var(--font-m)}
.cmp-verdict{margin-top:18px;padding:14px 18px;border:1px solid rgba(99,102,241,.35);border-radius:14px;background:rgba(99,102,241,.06);font-size:14.5px}
.sort-bar{display:flex;align-items:center;gap:10px;margin-top:16px;font-family:var(--font-m);font-size:12px;color:var(--dim)}
.sort-bar label{letter-spacing:.06em;text-transform:uppercase;font-size:10.5px;color:var(--faint)}
.sort-bar select{background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--ink);font-family:inherit;font-size:12px;padding:6px 10px;cursor:pointer;transition:border-color .25s}
.sort-bar select:hover{border-color:rgba(99,102,241,.5)}
.sort-bar select:focus{outline:none;border-color:rgba(99,102,241,.6)}
.sort-bar select option{color:#121212;background:#ffffff}
.crumbs{font-family:var(--font-m);font-size:11.5px;color:var(--faint);margin-bottom:14px}
.crumbs a{color:var(--dim)}
.crumbs a:hover{color:var(--ink)}
.crumbs b{color:var(--ink);font-weight:600}
.trend-strip{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:12px}
.cmeta{font-size:11.5px;color:var(--faint);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
@media(max-width:680px){.cmp-head{grid-template-columns:1fr}.cmp-row{grid-template-columns:1fr;gap:8px}.cmp-row .cmp-dim{text-align:left}.cmp-row .side:last-child{justify-content:flex-start;text-align:left}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`;

function crumbsHtml(ctx) {
  const c = ctx.crumbs;
  if (!Array.isArray(c) || !c.length) return "";
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${c
    .map((x) =>
      x.href
        ? ` <span class="sep">/</span> <a href="${esc(x.href)}">${esc(x.label)}</a>`
        : ` <span class="sep">/</span> <b>${esc(x.label)}</b>`
    )
    .join("")}</nav>`;
}

export function layout(ctx, body) {
  const { config, route } = ctx;
  const base = config.baseUrl || "";
  const canonical = `${base}${route}`;
  const nav = (config.nav || [])
    .map((n) => {
      const href = n.href.startsWith("/#") ? `/#install` : n.href;
      // Nav entries only link to routes that exist in this build (no dead links).
      if (!href.includes("#") && !ctx.routes.has(href.replace(/\/$/, "")) && href !== "/") return "";
      return `<a href="${esc(href)}">${esc(n.label)}</a>`;
    })
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ctx.title)}</title>
<meta name="description" content="${esc(ctx.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(ctx.title)}">
<meta property="og:description" content="${esc(ctx.description)}">
<meta property="og:url" content="${esc(canonical)}">
${ctx.ogImage ? `<meta property="og:image" content="${esc(base + ctx.ogImage)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<style>${CSS}</style>
</head>
<body>
<header><div class="wrap nav">
<span class="logo"><b>â—†</b> ${esc(config.siteName)}</span>
${nav}<span class="spacer"></span>
<a class="btn primary" href="/#install">Run locally</a>
</div></header>
<main><div class="wrap">${crumbsHtml(ctx)}${body}</div></main>
<footer><div class="wrap">
${
  config.newsletter?.embedUrl
    ? `<div class="news" style="margin-bottom:22px">
<h2 style="margin-top:0">Weekly digest</h2>
<p style="font-size:13.5px;max-width:60ch">New tools, fresh alternatives and trust-signal changes â€” once a week, no spam.${
        Number(config.newsletter.subscribers) > 0
          ? ` <strong style="color:var(--ink)">${Number(config.newsletter.subscribers).toLocaleString("en-US")} subscribers</strong>.`
          : ""
      }</p>
<iframe src="${esc(config.newsletter.embedUrl)}" style="width:100%;max-width:480px;height:64px;border:0;background:transparent" loading="lazy" title="Newsletter signup"></iframe>
</div>`
    : ""
}
${esc(config.tagline)} Data refreshed daily from GitHub Â· <a href="/terms.html">Terms</a> Â· <a href="/privacy.html">Privacy</a>
</div></footer>
</body></html>`;
}

// ---------- profile page ----------

export function profileHtml(pairing, ctx) {
  const { snapshots, config } = ctx;
  const a = pairing.alternative;
  const [owner] = a.repo.split("/");
  const stars = snapshots.stars?.[a.repo];
  const meta = snapshots.meta?.[a.repo];
  const maintStatus = maintStatusFor(snapshots, a.repo);
  const days = meta?.pushedAt
    ? Math.floor((Date.now() - new Date(meta.pushedAt).getTime()) / 86400000)
    : null;
  const history = snapshots.history?.[a.repo];
  const ageY = repoAgeYears(meta);

  const crossLinks = (pairing.paidTool.slug ? [`/alternatives/${pairing.paidTool.slug}`] : [])
    .map((href) =>
      ctx.routes.has(`alternatives/${pairing.paidTool.slug}`)
        ? `<a class="btn" href="${href}">${esc(pairing.paidTool.name)}</a>`
        : `<span class="pill" style="border-color:var(--border)">${esc(pairing.paidTool.name)}</span>`
    )
    .join(" ");

  const screenshots = (a.screenshots || [])
    .map(
      (s) =>
        `<img loading="lazy" src="${esc(s.src)}" alt="${esc(s.alt)}" width="352" height="220">`
    )
    .join("");

  const sponsors =
    a.sponsorsUrl ||
    (owner ? `https://github.com/sponsors/${owner}` : "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: a.name,
    description: a.description,
    applicationCategory: pairing.paidTool.category || "DeveloperApplication",
    operatingSystem: (a.platforms || []).join(", ") || "Cross-platform",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...(a.license?.spdx ? { license: a.license.spdx } : {}),
    author: { "@type": "Organization", name: owner },
    downloadUrl: `https://github.com/${a.repo}`,
  };

  const body = `
<h1>${esc(a.name)}</h1>
<p class="repo-line">github.com/${esc(a.repo)}${
    a.language
      ? ` Â· ${
          ctx.repoSlug
            ? `<a href="/stacks/${esc(slugify(a.language))}" style="color:var(--tech)">${esc(a.language)}</a>`
            : esc(a.language)
        }`
      : ""
  }${a.license?.spdx ? ` Â· <a href="/licenses/${esc(slugify(licenseFamily(a.license.spdx)))}" style="color:inherit">${esc(a.license.spdx)}</a>` : ""}</p>
<p class="desc">${esc(a.description)}</p>

<div class="stat">
  ${
    stars != null
      ? `<div><b>${fmtStars(stars)}</b><span>GitHub stars</span></div>`
      : ""
  }
  <div><b>${ageY != null ? `${ageY} yrs` : "n/a"}</b><span>repository age</span></div>
  <div><b>$0</b><span>forever Â· ${esc(pairing.paidTool.name)} ${esc(
    pairing.paidTool.planName || ""
  )} â‰ˆ $${pairing.paidTool.pricePerYearUsd}/yr</span></div>
</div>

${
  history && history.length >= 8
    ? `<div class="spark-wrap">${sparklineSvg(history)}<span style="font-size:12px;color:var(--faint)">star trajectory (collected daily)</span></div>`
    : ""
}

<div class="pills">
  ${maintenancePill(maintStatus ? { status: maintStatus } : null)}
  ${freshnessPill(days == null ? null : { days })}
  ${(a.tags || []).slice(0, 6).map((t) => {
    const inner = `<span class="pill" style="border-color:rgba(6,182,212,.25);color:var(--tech)">${esc(t)}</span>`;
    return ctx.repoSlug ? `<a href="/tags/${esc(slugify(t))}">${inner}</a>` : inner;
  }).join("")}
</div>

<h2>Open source alternative to</h2>
<div class="pills">${crossLinks}</div>

${
  (ctx.cmpLinks?.get(ctx.route.slice(1)) || []).length
    ? `<h2>Head-to-head</h2>
<div class="pills">${(ctx.cmpLinks.get(ctx.route.slice(1)) || [])
      .map(
        (l) =>
          `<a href="${esc(l.href)}"><span class="pill" style="border-color:rgba(99,102,241,.45);color:var(--primary)">vs ${esc(l.name)}</span></a>`
      )
      .join("")}</div>`
    : ""
}

${
  a.demoUrl
    ? `<p style="margin-top:18px"><a class="btn" rel="noopener noreferrer" target="_blank" href="${esc(a.demoUrl)}">â–¶ Try the live demo</a></p>`
    : ""
}

${toolExplainerHtml(pairing, ctx)}

<h2 id="install">Run it on your machine</h2>
<div class="install"><span class="p">$</span> npm install -g <span class="pkg">opensource-hub</span></div>
<p style="font-size:12.5px;color:var(--faint);margin-top:8px">
Local dashboard Â· no account Â· nothing leaves your machine.</p>
<p style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
<a class="btn primary" href="https://github.com/${esc(a.repo)}">â˜… Star on GitHub</a>
${
  sponsors
    ? `<a class="btn" rel="noopener noreferrer" target="_blank" href="${esc(sponsors)}">â™¥ Sponsor ${esc(owner)}</a>`
    : ""
}
<a class="btn" rel="noopener noreferrer" target="_blank" href="https://codeload.github.com/${esc(a.repo)}/zip/HEAD">⬇ Download source (.zip)</a>
</p>

${shareBarHtml(`${(ctx.config.baseUrl || "")}/${ctx.route}.html`, `${a.name}: free open-source alternative to ${pairing.paidTool.name}`)}

${screenshots ? `<h2>Screenshots</h2><div class="shots">${screenshots}</div>` : ""}
<p style="font-size:11.5px;color:var(--faint);margin-top:10px">${
  screenshots ? "Community-reported imagery, not guaranteed." : ""
}</p>

<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  return layout(
    {
      ...ctx,
      crumbs: [
        ...(ctx.routes.has("alternatives")
          ? [{ href: "/alternatives.html", label: "Alternatives" }]
          : []),
        ...(ctx.routes.has(`alternatives/${pairing.paidTool.slug}`)
          ? [{ href: `/alternatives/${pairing.paidTool.slug}.html`, label: pairing.paidTool.name }]
          : [{ label: pairing.paidTool.name }]),
        { label: a.name },
      ],
      title: `${a.name}: free open-source alternative to ${pairing.paidTool.name}`,
      description: `${a.description} Free alternative to ${pairing.paidTool.name} ($${pairing.paidTool.pricePerYearUsd}/yr) â€” open source, self-hostable, zero accounts.`,
    },
    body
  );
}

// ---------- §3d editorial depth: plain-language deep dive per tool ----------
// Every sentence is assembled from verified catalog fields — nothing invented.

const PLATFORM_LABELS = {
  win: "Windows",
  mac: "macOS",
  linux: "Linux",
  web: "Runs in your browser",
  ios: "iOS",
  android: "Android",
  "self-host": "Self-hosts on your own server",
};

export function toolExplainerHtml(pairing, ctx) {
  const a = pairing.alternative;
  const paid = pairing.paidTool;
  const relLine =
    a.relationship === "direct"
      ? `It is tracked as a <strong>drop-in replacement</strong> for ${esc(
          paid.name
        )} — the core workflows people pay for are covered.`
      : a.relationship === "fork"
        ? `It started as a fork of the tool it replaces, so the core experience feels familiar by design.`
        : `It covers part of what ${esc(
            paid.name
          )} does — review the known gaps below before committing.`;

  const platformList = [...new Set(a.platforms || [])]
    .map((p) => PLATFORM_LABELS[p] || p)
    .join(" &middot; ");

  const tco = a.tco?.hostingMonthlyEstimateUsd;
  const hostingLine = tco
    ? ` Self-hosting is rarely literally $0 — a small server typically runs about <strong>$${tco}/mo</strong>, i.e. ~$${
        tco * 12
      }/yr against ${esc(paid.name)}'s roughly $${paid.pricePerYearUsd}/yr${
        paid.planName ? ` (${esc(paid.planName)} plan)` : ""
      }. Still a fraction of the price, with full data ownership.`
    : "";

  const selfHostNote = a.ecosystems?.docker
    ? " An official Docker image makes deployment close to one command."
    : (a.platforms || []).includes("self-host")
      ? " Expect some setup: a server, a database and a little patience."
      : "";

  const licNote = LICENSE_COMMERCIAL_NOTE[a.license?.type] || "";
  const licLink =
    licNote && a.license?.spdx && ctx.routes?.has("licenses")
      ? ` Full details on the <a href="/licenses/${esc(
          slugify(licenseFamily(a.license.spdx))
        )}">${esc(a.license.spdx)}</a> license page.`
      : "";

  // Hand-written override slot: catalog entries may carry an `editorial` string
  // (human-verified prose). It renders first; the generated sections follow.
  const custom = a.editorial
    ? `<div class="card"><p style="white-space:pre-line;margin-top:0">${esc(a.editorial)}</p></div>`
    : "";

  return `
<h2 style="margin-top:28px">What is ${esc(a.name)}?</h2>
<p class="desc">${esc(a.description)} ${relLine}</p>
${custom}
${
  (a.parity || []).length
    ? `<h2 style="margin-top:24px">What it covers</h2>
<div class="card"><ul class="checklist">${(a.parity || [])
        .map((f) => `<li>&check; ${esc(f)}</li>`)
        .join("")}</ul></div>`
    : ""
}
<h2 style="margin-top:24px">Known gaps</h2>
${
  (a.gaps || []).length
    ? `<div class="card"><ul class="checklist">${(a.gaps || [])
        .map((f) => `<li style="color:var(--caution)">&#9650; ${esc(f)}</li>`)
        .join("")}</ul></div>`
    : `<p style="font-size:13px;color:var(--faint)">No known gaps reported yet — spotted something wrong? Flag it on the hub page.</p>`
}
${
  a.migrationNotes
    ? `<h2 style="margin-top:24px">Switching from ${esc(paid.name)}</h2>
<div class="card"><p style="white-space:pre-line;margin-top:0">${esc(a.migrationNotes)}</p>
<p style="font-size:13px;color:var(--dim);margin-top:8px">Tip: run both tools side by side on one real project for two weeks before cutting over — switching cold is the most common regret.</p></div>`
    : ""
}
${
  licNote
    ? `<h2 style="margin-top:24px">The license, in plain terms</h2>
<div class="card"><p style="margin-top:0">${esc(licNote)}${licLink}</p></div>`
    : ""
}
${
  platformList || hostingLine || selfHostNote
    ? `<h2 style="margin-top:24px">Running it yourself</h2>
<div class="card"><p style="margin-top:0">${platformList ? esc(platformList) : ""}${selfHostNote}${hostingLine}</p></div>`
    : ""
}
<p style="font-size:11.5px;color:var(--faint);margin-top:10px">Community-reported summary assembled from catalog data — not guaranteed, not a security audit.</p>`;
}

// ---------- shared data helpers (single source with src/server/trust.js) ----------

export function maintStatusFor(snapshots, repo) {
  const meta = snapshots.meta?.[repo];
  if (!meta?.pushedAt && !meta?.archived) return null;
  const days = meta.pushedAt
    ? Math.floor((Date.now() - new Date(meta.pushedAt).getTime()) / 86400000)
    : null;
  return meta.archived || (days != null && days > 210)
    ? "abandoned"
    : days == null
      ? null
      : days > 90
        ? "slowing"
        : "active";
}

export function parityPct(alternative) {
  const total = (alternative.parity?.length ?? 0) + (alternative.gaps?.length ?? 0);
  return total > 0 ? Math.round(((alternative.parity?.length ?? 0) / total) * 100) : null;
}

export function paginate(totalItems, perPage) {
  return Math.max(1, Math.ceil(totalItems / perPage));
}

// ---------- W3: taxonomy engine (tags / categories / stacks / licenses) ----------

export function slugify(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// SPDX base family: "AGPL-3.0-or-later" folds into the AGPL-3.0 family page,
// which lists every variant it covers (Â§3a license-certification angle).
function licenseFamily(spdx) {
  return spdx.replace(/-or-later$/i, "");
}

const LICENSE_COMMERCIAL_NOTE = {
  permissive: "Permissive â€” commercial-friendly, minimal restrictions.",
  copyleft: "Copyleft â€” derivatives must stay open. Fine for internal commercial use; review before redistributing modified versions.",
  "network-copyleft": "Network copyleft â€” running a modified version as a service triggers share-alike. Strongest protection against proprietary forks.",
};

function bump(map, key, init) {
  if (!map.has(key)) map.set(key, init());
  return map.get(key);
}

// Derives ALL taxonomy surfaces from catalog data at build time â€” no hand-maintained
// files to drift (PLAN deviation #10). Omit-empty is structural: only keys derived
// from real pairings ever exist.
export function computeTaxonomies(pairings) {
  const tags = new Map();
  const categories = new Map();
  const licenses = new Map();
  const stacks = new Map();

  const stackAdd = (techLabel, p) => {
    const slug = slugify(techLabel);
    if (!slug) return;
    const e = bump(stacks, slug, () => ({ slug, label: techLabel, pairings: [] }));
    if (!e.pairings.includes(p)) e.pairings.push(p);
  };

  for (const p of pairings) {
    const a = p.alternative;
    for (const tag of a.tags || []) {
      const slug = slugify(tag);
      if (!slug) continue;
      const e = bump(tags, slug, () => ({ slug, label: tag, pairings: [] }));
      if (!e.pairings.some((x) => x.alternative.repo === a.repo)) e.pairings.push(p);
    }

    const cat = p.paidTool.category || "Other";
    const ce = bump(categories, slugify(cat), () => ({ slug: slugify(cat), label: cat, pairings: [] }));
    ce.pairings.push(p);

    const spdx = a.license?.spdx;
    if (spdx) {
      const fam = licenseFamily(spdx);
      const le = bump(licenses, slugify(fam), () => ({
        slug: slugify(fam),
        label: fam,
        variants: new Set(),
        type: a.license.type,
        pairings: [],
      }));
      le.variants.add(spdx);
      if (!le.pairings.some((x) => x.alternative.repo === a.repo)) le.pairings.push(p);
    }

    if (a.language) stackAdd(a.language, p);
    if (a.ecosystems?.docker) stackAdd("Docker", p);
    if ((a.platforms || []).includes("self-host")) stackAdd("Self-Hosted", p);
  }
  return { tags, categories, licenses, stacks };
}

export function taxonomyIndexHtml(kind, entries, ctx) {
  const titles = {
    tags: ["Browse by tag", "Every capability tag across the catalog."],
    categories: ["Browse by category", "Tools grouped by the paid software they replace."],
    stacks: ["Tech stacks", "Filter by language, Docker readiness or self-hosting."],
    licenses: ["Licenses", "SPDX license families â€” know the terms before you adopt."],
  };
  const [h1, blurb] = titles[kind];
  const sorted = [...entries.values()].sort(
    (a, b) => b.pairings.length - a.pairings.length || a.label.localeCompare(b.label)
  );
  const cards = sorted
    .map(
      (e) => `<a class="hub-card" href="/${kind}/${esc(e.slug)}">
<strong>${esc(e.label)}</strong>
<span class="cat">${e.variants ? esc([...e.variants].join(", ")) : ""}</span>
<span class="save">${e.pairings.length} tool${e.pairings.length > 1 ? "s" : ""}${
        kind === "categories"
          ? (() => {
              const g = categoryGrowth(e.pairings, ctx.snapshots);
              return g ? ` &middot; ${g.pct >= 0 ? "+" : ""}${g.pct}% avg 30d` : "";
            })()
          : ""
      }</span>
</a>`
    )
    .join("");
  let trendHtml = "";
  if (kind === "categories" && ctx.snapshots) {
    const withGrowth = sorted
      .map((e) => ({ e, g: categoryGrowth(e.pairings, ctx.snapshots) }))
      .filter((x) => x.g)
      .sort((a, b) => b.g.pct - a.g.pct)
      .slice(0, 6);
    if (withGrowth.length) {
      trendHtml = `<h2 style="margin-top:22px">Trending categories</h2>
<div class="trend-strip">${withGrowth.map(({ e, g }) => `<a class="hub-card" href="/${kind}/${esc(e.slug)}"><strong>${esc(e.label)}</strong><span class="cat">${e.pairings
        .slice(0, 3)
        .map((p) => esc(p.alternative.name))
        .join(", ")}${e.pairings.length > 3 ? ` +${e.pairings.length - 3} more` : ""}</span><span class="save">${e.pairings.length} tools &middot; <span style="color:${
        g.pct >= 0 ? "var(--trust)" : "var(--caution)"
      }">${g.pct >= 0 ? "+" : ""}${g.pct}% avg 30d</span></span></a>`).join("")}</div>`;
    }
  }
  const body = `<h1>${esc(h1)}</h1><p class="desc">${esc(blurb)}</p>
${trendHtml}
<div class="hub-grid" style="margin-top:18px">${cards}</div>`;
  return layout(
    {
      ...ctx,
      route: `/${kind}`,
      crumbs: [{ label: `${h1[0].toUpperCase()}${h1.slice(1)}` }],
      title: `${h1[0].toUpperCase()}${h1.slice(1)} â€” OpenSource Hub`,
      description: blurb,
    },
    body
  );
}

function taxonomyDetailHtml(kind, entry, ctx) {
  const cards = [...entry.pairings]
    .map((p) => {
      const slug = ctx.repoSlug.get(p.alternative.repo);
      return `<a class="hub-card" href="/${esc(slug)}"><strong>${esc(p.alternative.name)}</strong><span class="cat">${esc(p.paidTool.name)}</span></a>`;
    })
    .join("");
  const extra =
    kind === "licenses"
      ? `<p class="desc">${esc(LICENSE_COMMERCIAL_NOTE[entry.type] || "")}${
          entry.variants.size > 1
            ? ` Variants covered: ${esc([...entry.variants].join(", "))}.`
            : ""
        }</p>`
      : "";
  const titleLabels = { tags: "Tag", categories: "Category", stacks: "Stack", licenses: "License" };
  const body = `<h1>${esc(entry.label)}</h1>
<p class="repo-line">${titleLabels[kind]} Â· ${entry.pairings.length} tool${entry.pairings.length > 1 ? "s" : ""}${
    kind === "categories" && ctx.snapshots
      ? growthPillHtml(categoryGrowth(entry.pairings, ctx.snapshots))
      : ""
  }</p>
${extra}
<div class="hub-grid" style="margin-top:18px">${cards}</div>`;
  return layout(
    {
      ...ctx,
      route: `/${kind}/${entry.slug}`,
      crumbs: [{ href: `/${kind}.html`, label: `${titleLabels[kind]}s` }, { label: entry.label }],
      title: `${entry.label} (${titleLabels[kind]}) â€” OpenSource Hub`,
      description: `${entry.pairings.length} open source tool(s) tagged ${entry.label}.`,
    },
    body
  );
}

// ---------- W2: /alternatives hub pages (the money pages) ----------

const REL_LABEL = {
  direct: "Drop-in replacement",
  partial: "Partial replacement",
  fork: "Fork of origin",
};

function hubMatrixRow(pairing, snapshots, ctx) {
  const a = pairing.alternative;
  // Canonical slug from the registry — never re-derive (deriveSlug would see the
  // repo's own slug as "taken" and wrongly emit the owner-prefixed variant).
  const slug = ctx.repoSlug?.get(a.repo) ?? deriveSlug(a.repo, ctx.takenSlugs);
  const pct = parityPct(a);
  const maint = maintStatusFor(snapshots, a.repo);
  const relTone =
    a.relationship === "direct" ? "var(--trust)" : a.relationship === "fork" ? "var(--tech)" : "var(--primary)";
  return `<tr>
<td><a href="/${esc(slug)}">${esc(a.name)}</a></td>
<td style="color:${relTone}">${esc(REL_LABEL[a.relationship] || "Alternative")}</td>
<td>${pct != null ? `${pct}%` : "â€”"}</td>
<td>${maint ? pill(maint, maint === "active" ? "trust" : maint === "slowing" ? "caution" : "red") : "â€”"}</td>
<td style="font-family:var(--font-m);font-size:12.5px">${esc(a.license?.spdx || "â€”")}</td>
<td style="color:var(--trust);font-weight:600">$${pairing.paidTool.pricePerYearUsd}/yr</td>
</tr>`;
}

function hubFaq(slugName, pairings, snapshots) {
  const first = pairings[0];
  const selfHostable = pairings.some(
    (p) => p.alternative.ecosystems?.docker || (p.alternative.platforms || []).includes("self-host")
  );
  return [
    {
      q: `Are these ${slugName} alternatives really free?`,
      a: `Yes â€” every listing is open source and costs $0. You may still pay for optional managed hosting, but the software itself is free.`,
    },
    {
      q: `Can an open-source tool really replace ${slugName}?`,
      a:
        first.alternative.relationship === "direct"
          ? `${first.alternative.name} is rated a drop-in replacement covering the core ${slugName} workflows. Check the parity list above for details â€” community-reported, not guaranteed.`
          : `${first.alternative.name} covers part of the ${slugName} feature set (rated "${first.alternative.relationship} replacement"). Review the gaps list before switching.`,
    },
    {
      q: `Can I self-host these alternatives?`,
      a: selfHostable
        ? `Yes â€” several listings ship official Docker images or explicitly support self-hosting. Look for the platforms and Docker badges on each tool page.`
        : `Some run fully local on your machine; others offer self-hosting. Each tool page lists its platforms.`,
    },
  ];
}

export function alternativesHubHtml(pairings, ctx) {
  const { snapshots, config } = ctx;
  const paid = pairings[0].paidTool;
  const year = new Date().getFullYear();
  const rows = pairings.map((p) => hubMatrixRow(p, snapshots, ctx)).join("");
  const faq = hubFaq(paid.name, pairings, snapshots);

  const detailSections = pairings
    .map((p) => {
      const a = p.alternative;
      const slug = ctx.repoSlug?.get(a.repo) ?? deriveSlug(a.repo, ctx.takenSlugs);
      return `
<h2>${esc(a.name)} <span style="color:var(--faint);font-size:14px;font-family:var(--font-m)">Â· ${esc(REL_LABEL[a.relationship] || "")}</span></h2>
<p class="desc">${esc(a.description)}</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:12px">
<div class="card" style="margin-top:0"><strong style="color:var(--ink)">What it covers</strong>
<ul class="checklist">${(a.parity || []).map((f) => `<li>âœ“ ${esc(f)}</li>`).join("")}</ul></div>
<div class="card" style="margin-top:0"><strong style="color:var(--ink)">What it lacks</strong>
<ul class="checklist">${(a.gaps || []).map((f) => `<li style="color:var(--caution)">â–³ ${esc(f)}</li>`).join("") || `<li style="color:var(--faint)">No known gaps reported yet.</li>`}</ul></div>
</div>
${a.migrationNotes ? `<div class="card" style="margin-top:12px"><strong style="color:var(--ink)">Migrating from ${esc(paid.name)}</strong><p style="margin-top:6px;white-space:pre-line">${esc(a.migrationNotes)}</p></div>` : ""}
<p style="margin-top:10px"><a class="btn" href="/${esc(slug)}">â†’ Full ${esc(a.name)} profile</a></p>`;
    })
    .join("");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: pairings.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${(config.baseUrl || "")}/${deriveSlug(p.alternative.repo, ctx.takenSlugs)}`,
        name: p.alternative.name,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: config.baseUrl || "/" },
        { "@type": "ListItem", position: 2, name: "Alternatives", item: `${config.baseUrl || ""}/alternatives` },
        { "@type": "ListItem", position: 3, name: paid.name },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const body = `
<h1>Best open source alternatives to ${esc(paid.name)} in ${year}</h1>
${bylineHtml(ctx.lastUpdated, ctx)}
<p class="desc">${esc(paid.name)}'s ${esc(paid.planName || "paid")} plan costs about
<strong style="color:var(--caution)">$${pairings[0].paidTool.pricePerYearUsd}/yr</strong>.
The open-source options below cost $0 â€” forever.
${
  ctx.repoSlug && paid.category
    ? ` <a class="pill" style="border-color:rgba(6,182,212,.25);color:var(--tech)" href="/categories/${esc(slugify(paid.category))}">${esc(paid.category)}</a>`
    : ""
}</p>

<div class="card" style="overflow-x:auto">
<table>
<thead><tr><th>Alternative</th><th>Relationship</th><th>Parity</th><th>Maintenance</th><th>License</th><th>You save</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p style="font-size:11.5px;color:var(--faint);margin-top:10px">Community-reported comparisons, not guaranteed. Parity = covered features Ã· (covered + known gaps).</p>
</div>

${detailSections}

<h2>Frequently asked questions</h2>
<div class="faq">
${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
</div>

${shareBarHtml(`${(config.baseUrl || "")}/alternatives/${esc(paid.slug)}.html`, `Best open source alternatives to ${paid.name} (${year})`)}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  return layout(
    {
      ...ctx,
      crumbs: [
        ...(ctx.routes.has("alternatives")
          ? [{ href: "/alternatives.html", label: "Alternatives" }]
          : []),
        { label: paid.name },
      ],
      title: `${paid.name} Alternatives â€” Free Open Source (${year})`,
      description: `Free open-source alternatives to ${paid.name}: ${pairings
        .map((p) => p.alternative.name)
        .join(", ")}. Save ~$${pairings[0].paidTool.pricePerYearUsd}/yr with tools you can own.`,
    },
    body
  );
}

// ---------- W2: master /alternatives index ----------

export function alternativesIndexHtml(hubs, ctx, { page = 1, perPage = 50 } = {}) {
  const { config } = ctx;
  const year = new Date().getFullYear();
  const sorted = [...hubs.entries()].sort((a, b) =>
    a[1][0].paidTool.name.localeCompare(b[1][0].paidTool.name)
  );
  const pageCount = paginate(sorted.length, perPage);
  const slice = sorted.slice((page - 1) * perPage, page * perPage);

  const categories = new Map();
  for (const [, ps] of sorted) {
    const c = ps[0].paidTool.category || "Other";
    categories.set(c, (categories.get(c) || 0) + 1);
  }
  const chips = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(
      ([c, n]) =>
        `<button type="button" class="chip" data-cat="${esc(c)}">${esc(c)} <span>${n}</span></button>`
    )
    .join("");

  const cards = slice
    .map(([slug, ps]) => {
      const paid = ps[0].paidTool;
      return `<a class="hub-card" href="/alternatives/${esc(slug)}" data-cat="${esc(paid.category || "Other")}" data-name="${esc(paid.name)}" data-save="${Number(paid.pricePerYearUsd) || 0}" data-count="${ps.length}">
<strong>${esc(paid.name)}</strong>
<span class="cat">${esc(paid.category || "")}</span>
<span class="save">save â‰ˆ $${paid.pricePerYearUsd}/yr Â· ${ps.length} option${ps.length > 1 ? "s" : ""}</span>
</a>`;
    })
    .join("");

  const pager =
    pageCount > 1
      ? `<nav class="pager" aria-label="Pagination">${Array.from({ length: pageCount }, (_, i) => {
          const n = i + 1;
          const href = n === 1 ? "/alternatives" : `/alternatives/page/${n}`;
          return n === page
            ? `<b aria-current="page">${n}</b>`
            : `<a href="${href}">${n}</a>`;
        }).join("")}</nav>`
      : "";

  const filterScript =
    chips &&
    `<script>(function(){var d=document;chips=d.querySelectorAll('.chip');cards=d.querySelectorAll('.hub-card');
chips.forEach(function(c){c.addEventListener('click',function(){var on=c.getAttribute('aria-pressed')!=='true';
chips.forEach(function(x){x.setAttribute('aria-pressed','false')});c.setAttribute('aria-pressed',on?'true':'false');
var cat=on?c.getAttribute('data-cat'):null;cards.forEach(function(k){k.style.display=!cat||k.getAttribute('data-cat')===cat?'':'none'})})})})();</script>`;

  const sortScript = `<div class="sort-bar"><label for="sort">Order by</label><select id="sort">
<option value="name">Name A&ndash;Z</option>
<option value="save">Biggest savings</option>
<option value="count">Most options</option>
</select></div>
<script>(function(){var s=document.getElementById('sort');if(!s)return;var grid=document.querySelector('.hub-grid');if(!grid)return;var items=[].slice.call(grid.querySelectorAll('.hub-card'));
s.addEventListener('change',function(){var v=s.value;items.sort(function(a,b){if(v==='save')return (+b.dataset.save||0)-(+a.dataset.save||0);if(v==='count')return (+b.dataset.count||0)-(+a.dataset.count||0);return String(a.dataset.name||'').localeCompare(String(b.dataset.name||''))});items.forEach(function(el){grid.appendChild(el)})});})();</script>`;

  const body = `
<h1>Open source alternatives Aâ€“Z</h1>
<p class="desc">Every proprietary tool we track, and the free software that can replace it.</p>
${adBannerHtml(ctx.ads || [])}
<div class="pills" role="group" aria-label="Filter by category">${chips}</div>
<div class="hub-grid" style="margin-top:18px">${cards}</div>
${pager}
${sortScript}
<style>.chip[aria-pressed="true"]{border-color:rgba(99,102,241,.6);color:var(--ink);background:rgba(99,102,241,.15)}</style>
${filterScript}`;

  const suffix = page > 1 ? ` â€” Page ${page}` : "";
  return layout(
    {
      ...ctx,
      route: page === 1 ? "/alternatives" : `/alternatives/page/${page}`,
      crumbs: [{ label: "Alternatives" }],
      title: `Open Source Alternatives to Popular SaaS (${year})${suffix}`,
      description: `Browse free open-source alternatives to ${sorted.length} popular paid tools â€” Notion, Figma, Slack and more. Save thousands per year.`,
    },
    body
  );
}

// ---------- W2: sitemap ----------

export function buildSitemap(routes, baseUrl, lastmod) {
  const urls = ["", ...routes.keys()]
    .map(
      (r) =>
        `<url><loc>${esc(`${baseUrl}/${r}`).replace(/([^:])\/\//g, "$1/")}</loc><lastmod>${lastmod}</lastmod></url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// ---------- W6: blog rendering (escape-first markdown) ----------

// Minimal frontmatter: "---\nkey: value\n---\n" header, one level deep.
export function parseFrontMatter(md) {
  const match = /^(?:\ufeff)?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md || "");
  const meta = {};
  if (match) {
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { meta, body: match ? (md.slice(match[0].length) || "").replace(/^\r?\n+/, "") : md || "" };
}

function safeHref(href) {
  return /^https?:\/\//i.test(href) || href.startsWith("/") || href.startsWith("#");
}

// Inline transforms run AFTER escaping, so raw HTML in source can never reach
// the output (same text-node rule as dashboard/src/lib/markdown.jsx).
export function renderInline(escapedText) {
  let t = escapedText;
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, href) => {
    if (!safeHref(href)) return `<a href="#">${txt}</a>`;
    const external = /^https?:\/\//i.test(href);
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${txt}</a>`;
  });
  return t;
}

export function renderMarkdown(md) {
  if (!md || typeof md !== "string") return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let para = [];
  let listType = null;
  let listItems = [];
  let fence = false;
  let fenceBuf = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${renderInline(esc(para.join(" ")))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (!listItems.length) return;
    const tag = listType === "ol" ? "ol" : "ul";
    out.push(`<${tag}>${listItems.map((i) => `<li>${renderInline(i)}</li>`).join("")}</${tag}>`);
    listItems = [];
    listType = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^```/.test(line.trim())) {
      if (fence) {
        out.push(`<pre><code>${fenceBuf.join("\n")}</code></pre>`);
        fenceBuf = [];
        fence = false;
      } else {
        flushPara();
        flushList();
        fence = true;
      }
      continue;
    }
    if (fence) {
      fenceBuf.push(esc(raw));
      continue;
    }
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length; // ## â†’ h2, ### â†’ h3 (h1 reserved for page title)
      out.push(`<h${level}>${renderInline(esc(heading[2]))}</h${level}>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushPara();
      flushList();
      out.push(`<blockquote><p>${renderInline(esc(line.replace(/^>\s?/, "")))}</p></blockquote>`);
      continue;
    }
    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(esc(ul[1]));
      continue;
    }
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ol) {
      flushPara();
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(esc(ol[1]));
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    para.push(line);
  }
  if (fence && fenceBuf.length) out.push(`<pre><code>${fenceBuf.join("\n")}</code></pre>`);
  flushPara();
  flushList();
  return out.join("\n");
}

// ---------- W4: curated collections + discounts ----------

// Real-history momentum only â€” the synthetic seed curve never drives a public
// collection (PLAN W1 honesty rule applies here too).
function realMomentum(history) {
  if (!Array.isArray(history) || history.length < 8) return null;
  const pts = history.slice(-30);
  const first = pts[0].stars;
  const last = pts[pts.length - 1].stars;
  return first > 0 ? ((last - first) / first) * 100 : null;
}

export function computeCollections(pairings, snapshots) {
  const out = new Map();
  const add = (slug, label, blurb, pairings_) => {
    if (pairings_ && pairings_.length) {
      out.set(slug, { slug, label, blurb, pairings: [...pairings_] });
    }
  };

  // latest â€” catalog order until addedAt tracking lands with a verified batch.
  add("latest", "Latest additions", "Freshly added to the catalog.", pairings);

  // trending â€” genuine 30d momentum, needs enough real members to be meaningful.
  const movers = pairings
    .map((p) => ({ p, m: realMomentum(snapshots.history?.[p.alternative.repo]) }))
    .filter((x) => x.m != null && x.m > 0)
    .sort((a, b) => b.m - a.m)
    .map((x) => x.p);
  if (movers.length >= 5) {
    add("trending", "Trending now", "Strongest 30-day star momentum (collected daily).", movers);
  }

  // self-hosted â€” Docker-ready or explicitly self-hostable.
  add(
    "self-hosted",
    "Self-hosted essentials",
    "Runs on your own hardware â€” official Docker images or explicit self-host support.",
    pairings.filter(
      (p) => p.alternative.ecosystems?.docker || (p.alternative.platforms || []).includes("self-host")
    )
  );

  // ai-native â€” local LLM / AI-workflow tooling.
  const AI_RE = /\bai\b|\bllm\b|\bagents?\b|\bgpt\b|local-ai/i;
  add(
    "ai-native",
    "AI-native tools",
    "Open-source AI assistants, local LLM runners and agent platforms.",
    pairings.filter(
      (p) =>
        (p.alternative.tags || []).some((t) => AI_RE.test(t)) ||
        AI_RE.test(p.alternative.description || "")
    )
  );

  // coming-soon â€” pre-release or small repos with real surging momentum.
  add(
    "coming-soon",
    "Coming soon",
    "Early-stage projects moving fast.",
    pairings.filter((p) => {
      if (p.alternative.isPreRelease) return true;
      const stars = snapshots.stars?.[p.alternative.repo];
      const m = realMomentum(snapshots.history?.[p.alternative.repo]);
      return m != null && m >= 15 && stars != null && stars < 1000;
    })
  );

  // graveyard â€” paid tools that died, and what replaced them (curated field).
  add(
    "graveyard",
    "Product graveyard",
    "The discontinued software these open-source projects keep alive.",
    pairings.filter((p) => p.paidTool?.discontinued === true)
  );

  return out;
}

function collectionCards(entries, repoSlug, snapshots = {}) {
  return entries
    .map((p) => {
      const slug = repoSlug.get(p.alternative.repo);
      const stars = snapshots.stars?.[p.alternative.repo];
      const maint = maintStatusFor(snapshots, p.alternative.repo);
      const lic = p.alternative.license?.spdx;
      const meta = [
        stars != null ? `${fmtStars(stars)} stars` : "",
        maint
          ? pill(maint, maint === "active" ? "trust" : maint === "slowing" ? "caution" : "red")
          : "",
        lic ? esc(lic) : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<a class="hub-card" href="/${esc(slug)}"><strong>${esc(p.alternative.name)}</strong><span class="cat">${esc(
        p.paidTool.name
      )}</span><span class="cmeta">${meta || "&nbsp;"}</span></a>`;
    })
    .join("");
}

function collectionsIndexHtml(liveCollections, ctx) {
  const tiles = [...liveCollections.values()]
    .map(
      (c) =>
        `<a class="hub-card" href="/collections/${esc(c.slug)}"><strong>${esc(c.label)}</strong><span class="cat">${esc(c.blurb)}</span><span class="save">${c.pairings.length} tool${c.pairings.length > 1 ? "s" : ""}</span></a>`
    )
    .join("");
  const dormant = ["trending", "ai-native", "coming-soon", "graveyard"].filter(
    (k) => !liveCollections.has(k)
  );
  const dormantNote = dormant.length
    ? `<p style="font-size:12px;color:var(--faint);margin-top:14px">Also activating automatically as data arrives: ${esc(
        dormant.join(", ")
      )}.</p>`
    : "";
  const body = `<h1>Collections</h1>
<p class="desc">Curated entry points into the catalog â€” derived from data, never hand-listed.</p>
<div class="hub-grid" style="margin-top:18px">${tiles}</div>${dormantNote}`;
  return layout(
    {
      ...ctx,
      route: "/collections",
      title: "Collections â€” OpenSource Hub",
      description: "Curated collections of free open-source software.",
    },
    body
  );
}

function collectionDetailHtml(c, ctx) {
  const body = `<h1>${esc(c.label)}</h1>
<p class="repo-line">${c.pairings.length} tool${c.pairings.length > 1 ? "s" : ""}</p>
<p class="desc">${esc(c.blurb)}</p>
<div class="hub-grid" style="margin-top:18px">${collectionCards(c.pairings, ctx.repoSlug, ctx.snapshots)}</div>`;
  return layout(
    {
      ...ctx,
      route: `/collections/${c.slug}`,
      title: `${c.label} â€” OpenSource Hub`,
      description: c.blurb,
    },
    body
  );
}

function discountsPageHtml(discounts, ctx) {
  const cards = (discounts || [])
    .filter((d) => d && d.vendor && d.url)
    .map(
      (d) => `<a class="hub-card" rel="noopener noreferrer" target="_blank" href="${esc(d.url)}">
<strong>${esc(d.vendor)}</strong><span class="cat">${esc(d.offer || "")}</span>
<span class="save">${d.expiresAt ? `until ${esc(d.expiresAt)}` : ""}</span></a>`
    )
    .join("");
  const body = `<h1>Discounts & credits</h1>
<p class="desc">Hosting credits and deals negotiated for the open-source community. We only list ones we have verified.</p>
${
  cards
    ? `<div class="hub-grid" style="margin-top:18px">${cards}</div>`
    : `<div class="card" style="margin-top:18px"><strong style="color:var(--ink)">No active deals right now.</strong><p style="margin-top:6px;font-size:14px">When we negotiate real ones, they will appear here â€” never fake urgency, ever.</p></div>`
}`;
  return layout(
    {
      ...ctx,
      route: "/discounts",
      title: "Discounts & Hosting Credits â€” OpenSource Hub",
      description: "Verified hosting credits and discounts for open-source builders.",
    },
    body
  );
}

// ---------- W5: syndication (RSS 2.0) + crawler infrastructure ----------

// First-seen registry: the catalog carries no dates, so the build persists the
// first time it sees each tool/hub/post and reuses that date forever â€” honest
// pubDates instead of fake build-dates. State lives in src/data/feed-state.json
// (committed, so CI builds keep continuity).
export function updateFeedState(state = {}, kind, keys, now) {
  const section = { ...(state[kind] || {}) };
  for (const key of keys) {
    if (!section[key]) section[key] = new Date(now).toISOString();
  }
  return { ...state, [kind]: section };
}

export function buildRssFeed({ title, link, description, items = [], lastBuild }) {
  const itemsXml = items
    .map(
      (i) => `<item>
<title>${esc(i.title)}</title>
<link>${esc(i.link)}</link>
<guid isPermaLink="true">${esc(i.guid ?? i.link)}</guid>
${i.description ? `<description>${esc(i.description)}</description>` : ""}
${i.pubDate ? `<pubDate>${new Date(i.pubDate).toUTCString()}</pubDate>` : ""}
</item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${esc(title)}</title>
<link>${esc(link)}</link>
<description>${esc(description)}</description>
<lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
<generator>opensource-hub</generator>
${items ? itemsXml + "\n" : ""}</channel>
</rss>
`;
}

// Â§33 verdict implemented: AI crawlers are explicitly ALLOWED, never blocked by
// accident. Sitemap directive only when a real baseUrl exists.
export function buildRobots(baseUrl) {
  let out = `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n`;
  if (baseUrl) out += `\nSitemap: ${baseUrl.replace(/\/$/, "")}/sitemap.xml\n`;
  return out;
}

export function buildFeeds({
  alternatives,
  config,
  feedState = {},
  posts = [],
  now = Date.now(),
}) {
  const base = (config.baseUrl || "").replace(/\/$/, "");

  const slugs = new Set();
  const repoSlug = new Map();
  for (const p of alternatives.pairings) {
    const slug = deriveSlug(p.alternative.repo, slugs);
    slugs.add(slug);
    repoSlug.set(p.alternative.repo, slug);
  }
  const hubs = new Map();
  for (const p of alternatives.pairings) {
    const hubSlug = p.paidTool?.slug;
    if (!hubSlug) continue;
    if (!hubs.has(hubSlug)) hubs.set(hubSlug, []);
    hubs.get(hubSlug).push(p);
  }

  let state = updateFeedState(feedState, "tools", [...repoSlug.keys()], now);
  state = updateFeedState(state, "hubs", [...hubs.keys()], now);
  state = updateFeedState(
    state,
    "posts",
    posts.map((p) => p.slug),
    now
  );

  const toolItems = alternatives.pairings
    .map((p) => ({
      p,
      seen: state.tools[p.alternative.repo],
    }))
    .sort((a, b) => new Date(b.seen) - new Date(a.seen))
    .map(({ p, seen }) => ({
      title: `${p.alternative.name} â€” free alternative to ${p.paidTool.name}`,
      link: `${base}/${repoSlug.get(p.alternative.repo)}`,
      description: p.alternative.description,
      pubDate: seen,
    }));

  const hubItems = [...hubs.entries()]
    .map(([slug, pairings]) => ({ slug, pairings, seen: state.hubs[slug] }))
    .sort((a, b) => new Date(b.seen) - new Date(a.seen))
    .map(({ slug, pairings, seen }) => ({
      title: `Open source alternatives to ${pairings[0].paidTool.name}`,
      link: `${base}/alternatives/${slug}`,
      description: `Free alternatives to ${pairings[0].paidTool.name}: ${pairings
        .map((p) => p.alternative.name)
        .join(", ")}.`,
      pubDate: seen,
    }));

  const lastBuild = new Date(now).toISOString();
  const files = {
    "rss/tools.xml": buildRssFeed({
      title: `${config.siteName} â€” new open-source tools`,
      link: `${base}/`,
      description: config.tagline,
      items: toolItems,
      lastBuild,
    }),
    "rss/alternatives.xml": buildRssFeed({
      title: `${config.siteName} â€” new alternative pairings`,
      link: `${base}/alternatives`,
      description: "Every paid-tool pairing added to the catalog.",
      items: hubItems,
      lastBuild,
    }),
    // Valid empty channel until W6 blog posts exist (Â§3c full suite).
    "rss/posts.xml": buildRssFeed({
      title: `${config.siteName} â€” blog`,
      link: `${base}/blog`,
      description: "Guides on switching from paid software to open source.",
      items: posts,
      lastBuild,
    }),
  };
  return { files, state };
}

// ---------- W6: blog pages ----------

export function blogIndexHtml(posts, ctx) {
  const cards = [...posts]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map(
      (p) =>
        `<a class="hub-card" href="/blog/${esc(p.slug)}"><strong>${esc(p.title)}</strong><span class="cat">${esc(p.description || "")}</span><span class="save">${esc(p.date || "")}</span></a>`
    )
    .join("");
  const body = `<h1>Blog</h1>
<p class="desc">Guides on switching from paid software to open source â€” written from the catalog, never sponsored.</p>
<div class="hub-grid" style="margin-top:18px">${cards}</div>`;
  return layout(
    { ...ctx, route: "/blog", title: "Blog â€” OpenSource Hub", description: "Switching guides and open-source deep dives." },
    body
  );
}

export function blogPostHtml(post, ctx) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: ctx.config.siteName },
  };
  const body = `<p><a href="/blog" class="btn" style="padding:5px 12px">â† All posts</a></p>
<h1>${esc(post.title)}</h1>
<p class="repo-line">${esc(post.date || "")}</p>
<article>${post.html}</article>
<p style="margin-top:26px"><a class="btn primary" href="/#install">â–¶ Run OpenSource Hub locally</a></p>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return layout(
    {
      ...ctx,
      route: `/blog/${post.slug}`,
      title: `${post.title} â€” OpenSource Hub`,
      description: post.description || post.title,
    },
    body
  );
}

// ---------- W8: dormant monetization scaffolding (/advertise + /submit) ----------
// Zero payment rails while site.config.activateMonetization is false (PRD §6.3):
// pages exist, tiers are visible, but every CTA degrades to contact channels —
// stripe url → mailto → GitHub issue. Never a fabricated email or fake ad.

export function adBannerHtml(ads = []) {
  const slot = ads?.slots?.[0];
  if (!slot || !slot.url) return "";
  const inner = slot.image
    ? `<img src="${esc(slot.image)}" alt="${esc(slot.label || "Sponsored")}" style="height:64px;border-radius:10px">`
    : `<strong>${esc(slot.label || "Sponsored")}</strong>`;
  return `<a class="ad-banner" href="${esc(slot.url)}" target="_blank" rel="sponsored noreferrer noopener">
<span class="ad-tag">Sponsored</span>${inner}</a>`;
}

function ctaHref(config, subject) {
  if (config.stripe?.submitUrl && config.activateMonetization) return config.stripe.submitUrl;
  if (config.contactEmail) {
    return `mailto:${config.contactEmail}?subject=${encodeURIComponent(subject)}`;
  }
  const repo = config.repoSlug || "opensource-hub/opensource-hub";
  return `https://github.com/${repo}/issues/new?title=${encodeURIComponent(subject)}&body=${encodeURIComponent("Details: ")}`;
}

const TIERS = [
  { name: "Silver", price: 147, blurb: "Standard rotation across the directory with click tracking.", perks: ["Directory-wide banner rotation", "Click + impression stats", "1× impression weight"] },
  { name: "Gold", price: 297, popular: true, blurb: "Higher visibility rotation plus the homepage sponsor logo.", perks: ["Everything in Silver", "Homepage sponsor logo", "2.5× impression weight"] },
  { name: "Platinum", price: 597, blurb: "Maximum visibility with exclusive placements.", perks: ["Everything in Gold", "Exclusive placements", "5× impression weight"] },
];

export function advertisePageHtml({ ads = [], pairings = [], hubCount = 0 }, ctx) {
  const { config } = ctx;
  const liveAds = (ads.slots || []).filter((s) => s && s.url);
  const inventory = liveAds.length
    ? liveAds.map(adBannerHtml).join("")
    : `<div class="card" style="margin-top:14px"><strong style="color:var(--ink)">Your banner here.</strong>
<p style="font-size:13.5px;margin-top:6px">This spot shows real campaigns only — we never run filler or fake urgency.</p></div>`;

  const tiers = TIERS.map(
    (t) => `<div class="card tier${t.popular ? " popular" : ""}">
${t.popular ? '<span class="pill" style="border-color:rgba(99,102,241,.5);color:var(--primary)">Most popular</span>' : ""}
<h3 style="font-family:var(--font-d);color:var(--ink);margin-top:${t.popular ? "8px" : "0"}">${esc(t.name)}</h3>
<p style="font-size:26px;color:var(--ink);font-family:var(--font-m)">$${t.price}<span style="font-size:13px;color:var(--faint)">/month</span></p>
<p style="font-size:13.5px">${esc(t.blurb)}</p>
<ul class="checklist">${t.perks.map((p) => `<li>✓ ${esc(p)}</li>`).join("")}</ul>
<a class="btn primary" href="${esc(ctaHref(config, `Advertise — ${t.name} tier`))}" style="margin-top:12px">Get started</a>
</div>`
  ).join("");

  const body = `
<h1>Advertise on OpenSource Hub</h1>
<p class="desc">Reach developers actively choosing their next tools — the audience that installs open source instead of renting SaaS.</p>

<div class="stat" style="margin-top:20px">
<div><b>${pairings.length}</b><span>open-source tools</span></div>
<div><b>${hubCount}</b><span>paid-tool hubs</span></div>
<div><b>$0</b><span>everything we list is free</span></div>
</div>

<h2>Sponsorship tiers</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:14px">${tiers}</div>
<p style="font-size:12px;color:var(--faint);margin-top:12px">All sponsored placements are labeled "Sponsored" and never influence rankings or Trust Scores.</p>

<h2>Current inventory</h2>
${inventory}`;

  return layout(
    {
      ...ctx,
      route: "/advertise",
      title: "Advertise — OpenSource Hub",
      description: "Sponsor OpenSource Hub: reach developers adopting open-source alternatives to paid software.",
    },
    body
  );
}

export function submitPageHtml(ctx) {
  const { config } = ctx;
  const repo = config.repoSlug || "opensource-hub/opensource-hub";
  const freeUrl = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(
    "[Submission] Tool → paid tool pairing"
  )}&body=${encodeURIComponent(
    "## Tool\n\n- **Name:**\n- **GitHub repo:** owner/name\n- **What it replaces:**\n- **Why it's a good fit:**\n\n_Submitted via the OpenSource Hub web directory._"
  )}`;

  const expedited =
    config.activateMonetization && config.stripe?.submitUrl
      ? `<div class="card" style="border-color:rgba(99,102,241,.45)">
<strong style="color:var(--ink)">Expedited review — $97 one-time</strong>
<p style="font-size:13.5px;margin-top:6px">48-hour human verification and launch placement. Same public criteria, faster queue.</p>
<a class="btn primary" href="${esc(config.stripe.submitUrl)}">Pay & submit</a>
<span style="display:block;font-size:11.5px;color:var(--faint);margin-top:8px">Payment processed by Stripe; we never see card details.</span></div>`
      : "";

  const body = `
<h1>Submit a tool</h1>
<p class="desc">Know an open-source project that replaces paid software? Every submission gets human-verified against our <a href="/blog/how-we-compute-trust-scores">public quality bar</a> before listing.</p>

<div class="card" style="margin-top:18px">
<strong style="color:var(--ink)">Free listing</strong>
<ul class="checklist" style="margin-top:8px">
<li>✓ Human fact-check of repo, description and savings estimate</li>
<li>✓ Trust signals computed from real GitHub data</li>
<li>✓ Permanent listing if it meets the bar</li>
</ul>
<a class="btn primary" target="_blank" rel="noopener noreferrer" href="${esc(freeUrl)}">Open submission form on GitHub</a>
<p style="font-size:11.5px;color:var(--faint);margin-top:8px">Submissions are public GitHub issues — no account needed beyond GitHub itself.</p>
</div>
${expedited}`;

  return layout(
    {
      ...ctx,
      route: "/submit",
      title: "Submit a tool — OpenSource Hub",
      description: "Propose an open-source tool for the catalog. Free, human-reviewed listings.",
    },
    body
  );
}

// ---------- build orchestration ----------

// ---------- §3d: head-to-head compare engine ----------

export function compareRouteSlug(slugA, slugB) {
  return [slugA, slugB].sort().join("-vs-");
}

function cmpRow(dim, valA, valB, winner) {
  const mark = (side) =>
    winner === "tie"
      ? `<span class="cmp-tie">even</span>`
      : winner === side
        ? `<span class="cmp-win">wins</span>`
        : "";
  const cell = (v) => v ?? `<span style="color:var(--faint)">unknown</span>`;
  return `<div class="cmp-row">
<div class="side">${cell(valA)}${mark("a")}</div>
<div class="cmp-dim">${esc(dim)}</div>
<div class="side">${cell(valB)}${mark("b")}</div>
</div>`;
}

export function compareDimensions(pA, pB, snapshots) {
  const a = pA.alternative;
  const b = pB.alternative;
  const stars = (r) => snapshots.stars?.[r];
  const meta = (r) => snapshots.meta?.[r];
  const hist = (r) => snapshots.history?.[r];

  const sa = stars(a.repo);
  const sb = stars(b.repo);
  const ga = growth30d(hist(a.repo));
  const gb = growth30d(hist(b.repo));
  const da = pushDaysAgo(meta(a.repo));
  const db = pushDaysAgo(meta(b.repo));
  const aa = repoAgeYears(meta(a.repo));
  const ab = repoAgeYears(meta(b.repo));
  const pa = parityPct(a);
  const pb2 = parityPct(b);

  const licScore = (alt) =>
    alt.license?.spdx ? (licenseFamily(alt.license.spdx) === "permissive" ? 2 : 1) : 0;
  const selfHost = (alt) =>
    (alt.platforms || []).includes("self-host") ||
    (alt.tags || []).some((t) => /docker|self-host/i.test(t));

  const growthTxt = (g) =>
    g ? `${g.gained >= 0 ? "+" : ""}${g.gained} (${g.gained >= 0 ? "+" : ""}${g.pct}%)` : null;

  return [
    ["Community & popularity", `${fmtStars(sa ?? 0)} stars`, `${fmtStars(sb ?? 0)} stars`, winnerHigher(sa, sb)],
    ["Growth momentum (30d)", growthTxt(ga), growthTxt(gb), winnerHigher(ga?.pct ?? null, gb?.pct ?? null)],
    ["Development activity", da, db, winnerLower(pushDaysRaw(meta(a.repo)), pushDaysRaw(meta(b.repo)))],
    ["Project maturity", aa != null ? `${aa} yrs old` : null, ab != null ? `${ab} yrs old` : null, winnerHigher(aa, ab)],
    ["Feature parity", pa != null ? `${pa}%` : null, pb2 != null ? `${pb2}%` : null, winnerHigher(pa, pb2)],
    [
      "License clarity",
      a.license?.spdx ?? null,
      b.license?.spdx ?? null,
      winnerHigher(licScore(a), licScore(b)),
    ],
    ["Self-host ready", selfHost(a) ? "Yes" : "No", selfHost(b) ? "Yes" : "No", (() => {
      const x = selfHost(a) ? 1 : 0;
      const y = selfHost(b) ? 1 : 0;
      return x === y ? "tie" : x > y ? "a" : "b";
    })()],
  ];
}

function pushDaysRaw(meta) {
  if (!meta?.pushedAt) return null;
  return Math.floor((Date.now() - new Date(meta.pushedAt).getTime()) / 86400000);
}

export function comparePageHtml(pA, pB, slugA, slugB, ctx) {
  const { config, snapshots } = ctx;
  const paid = pA.paidTool.name === pB.paidTool.name ? pA.paidTool : null;
  const a = pA.alternative;
  const b = pB.alternative;
  const rows = compareDimensions(pA, pB, snapshots);
  const winsA = rows.filter((r) => r[3] === "a").length;
  const winsB = rows.filter((r) => r[3] === "b").length;
  const overall =
    winsA === winsB
      ? `Both are strong options for replacing ${paid ? esc(paid.name) : "the same paid tool"} — the deciding factors are the dimensions above where one side wins.`
      : winsA > winsB
        ? `On current GitHub data, <strong style="color:var(--ink)">${esc(a.name)}</strong> leads ${Math.max(winsA, winsB)}–${Math.min(winsA, winsB)} on measured dimensions.`
        : `On current GitHub data, <strong style="color:var(--ink)">${esc(b.name)}</strong> leads ${Math.max(winsA, winsB)}–${Math.min(winsA, winsB)} on measured dimensions.`;

  const hubLink =
    paid && ctx.routes.has(`alternatives/${paid.slug}`)
      ? `<a href="/alternatives/${esc(paid.slug)}.html" style="color:var(--tech)">All ${esc(paid.name)} alternatives</a>`
      : "";

  const card = (p, slug) => {
    const al = p.alternative;
    const st = snapshots.stars?.[al.repo];
    return `<div class="cmp-card"><h3><a href="/${esc(slug)}.html" style="color:inherit">${esc(al.name)}</a></h3>
<p class="desc" style="font-size:13px;margin-top:4px">${esc(al.description)}</p>
<p class="st">${st != null ? `${fmtStars(st)} stars &middot; ` : ""}${esc(al.language || "")}${
      al.license?.spdx ? ` &middot; ${esc(al.license.spdx)}` : ""
    }</p></div>`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: config.baseUrl || "/" },
      { "@type": "ListItem", position: 2, name: "Alternatives", item: `${config.baseUrl || ""}/alternatives` },
      { "@type": "ListItem", position: 3, name: `${a.name} vs ${b.name}` },
    ],
  };

  const body = `
<h1>${esc(a.name)} vs ${esc(b.name)}</h1>
<p class="desc">Head-to-head on live GitHub signals: community size, 30-day momentum, development activity,
maturity, feature parity, licensing and self-host readiness — so you can decide which fits your workflow.
${hubLink}</p>
${bylineHtml(ctx.lastUpdated, ctx)}
<div class="cmp-head">${card(pA, slugA)}${card(pB, slugB)}</div>
<div class="cmp-grid">
${rows.map(([dim, va, vb, w]) => cmpRow(dim, va, vb, w)).join("\n")}
</div>
<div class="cmp-verdict"><strong>Verdict:</strong> ${overall}
Heuristic comparison from public metadata, not a security audit.</div>
${shareBarHtml(`${(config.baseUrl || "")}/compare/${compareRouteSlug(slugA, slugB)}.html`, `${a.name} vs ${b.name} — open source alternatives`)}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  return layout(
    {
      ...ctx,
      crumbs: [
        ...(ctx.routes.has("alternatives")
          ? [{ href: "/alternatives.html", label: "Alternatives" }]
          : []),
        { label: "Compare" },
      ],
      title: `${a.name} vs ${b.name}: which open source alternative wins?`,
      description: `Detailed comparison of ${a.name} and ${b.name}${paid ? ` as ${paid.name} alternatives` : ""}: stars, 30-day growth, activity, maturity, parity, license and self-hosting.`,
    },
    body
  );
}

// ---------- §3d: public methodology page ----------

export function aboutPageHtml(ctx) {
  const body = `
<h1>About OpenSource Hub</h1>
<p class="desc">A terminal-installed developer tool that surfaces free, open-source alternatives to the paid
software you already use — with plain-language trust signals so "free" never means "unverified".</p>

<h2>How rankings and trust scores are calculated</h2>
<div class="card"><p style="margin-top:0">Every listing is scored server-side from public GitHub metadata.
The <strong>Trust Score (0–100)</strong> is a composite of six weighted inputs:</p>
<ul class="checklist">
<li><strong>Commit recency</strong> — 30 pts. How recently the project shipped.</li>
<li><strong>Archive status</strong> — 15 pts. Archived repos lose this entirely.</li>
<li><strong>License clarity</strong> — 15 pts. A recognized SPDX license beats silence.</li>
<li><strong>Issue hygiene</strong> — 15 pts. Maintainability signals from issue traffic.</li>
<li><strong>Community traction</strong> — 15 pts. Stars and forks, age-adjusted so established projects don't dominate newcomers by default.</li>
<li><strong>Project maturity</strong> — 10 pts. Years since repository creation.</li>
</ul>
<p>Maintenance status (Active / Slowing / Abandoned) derives from commit recency and archive flags.
Red flags — no README, sudden star spikes on young accounts — render as visible caution badges,
never silent blocks. <strong>This is a heuristic signal, not a security audit.</strong></p></div>

<h2>Honesty rules</h2>
<ul class="checklist">
<li>Parity percentages are community-reported coverage vs known gaps — not guaranteed.</li>
<li>Savings figures use each paid tool's typical list price; hosting costs for self-hosting are shown separately via the TCO guidance.</li>
<li>Data is refreshed daily from GitHub; every generated page is dated.</li>
<li>Flagged projects have an appeals path before public trust data goes live.</li>
</ul>

<h2>Affiliate disclosure</h2>
<p>Some outbound hosting/deployment links may be affiliate links. They never influence ranking or trust scoring —
placement follows the user's own deploy intent, not sponsor preference.</p>

<h2>No accounts, ever</h2>
<p>The directory runs without logins: favorites live locally, comments ride on GitHub Discussions.
Nothing to breach, nothing to sell.</p>`;

  return layout({ ...ctx, crumbs: [{ label: "About" }], title: "About & Methodology", description: "How OpenSource Hub ranks open source alternatives: Trust Score formula, honesty rules, affiliate disclosure." }, body);
}

export function buildSite({ alternatives, snapshots, config, discounts = [], posts = [], ads = [] }) {
  const routes = new Map(); // route → html
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const slugs = new Set();
  const takenSlugs = new Set();
  const repoSlug = new Map();
  const cmpLinks = new Map();

  // Group pairings into SaaS hubs first so profile cross-links can go live the
  // moment their hub route exists in the registry (no dead links, ever).
  const hubs = new Map();
  for (const pairing of alternatives.pairings) {
    const hubSlug = pairing.paidTool?.slug;
    if (!hubSlug) continue;
    if (!hubs.has(hubSlug)) hubs.set(hubSlug, []);
    hubs.get(hubSlug).push(pairing);
  }
  for (const hubSlug of hubs.keys()) routes.set(`alternatives/${hubSlug}`, null);

  // Tool profiles (Â§25.1 #2).
  const profileCtxs = [];
  for (const pairing of alternatives.pairings) {
    const slug = deriveSlug(pairing.alternative.repo, slugs);
    slugs.add(slug);
    takenSlugs.add(slug);
    repoSlug.set(pairing.alternative.repo, slug);
    const ctx = { snapshots, config, routes, route: `/${slug}`, ogImage: ogImagePath(slug), takenSlugs, repoSlug, cmpLinks };
    profileCtxs.push([slug, pairing, ctx]);
  }
  // §3d compare engine — pairwise pages among each hub's top alternatives,
  // extended with same-category siblings so 1:1 seed hubs still get matches.
  // Runs AFTER slugs are assigned; routes pre-register (null) so profile
  // cross-links resolve on first render.
  const COMPARE_PER_GROUP = 3;
  const compareJobs = [];
  {
    const groups = [];
    for (const pairings of hubs.values()) {
      if (pairings.length > 1) groups.push(pairings.slice(0, COMPARE_PER_GROUP));
    }
    const catGroups = new Map();
    for (const pairing of alternatives.pairings) {
      const cat = pairing.paidTool.category;
      if (!cat) continue;
      if (!catGroups.has(cat)) catGroups.set(cat, []);
      catGroups.get(cat).push(pairing);
    }
    for (const list of catGroups.values()) {
      if (list.length > 1) groups.push(list.slice(0, COMPARE_PER_GROUP));
    }
    const seen = new Set();
    for (const list of groups) {
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const slugA = repoSlug.get(list[i].alternative.repo);
          const slugB = repoSlug.get(list[j].alternative.repo);
          if (!slugA || !slugB) continue;
          const route = compareRouteSlug(slugA, slugB);
          if (seen.has(route)) continue;
          seen.add(route);
          const job = { pA: list[i], pB: list[j], slugA, slugB, route };
          compareJobs.push(job);
          routes.set(`compare/${route}`, null);
          for (const [own, other] of [
            [job.slugA, job.pB.alternative.name],
            [job.slugB, job.pA.alternative.name],
          ]) {
            if (!cmpLinks.has(own)) cmpLinks.set(own, []);
            cmpLinks.get(own).push({ href: `/compare/${job.route}.html`, name: other });
          }
        }
      }
    }
  }

  for (const [slug, pairing, ctx] of profileCtxs) {
    routes.set(slug, profileHtml(pairing, ctx));
  }

  // SaaS hub pages (Â§25.1 #1) + master index (W2).
  for (const [hubSlug, pairings] of hubs) {
    const ctx = { snapshots, config, routes, route: `/alternatives/${hubSlug}`, ogImage: ogImagePath("alternatives/" + hubSlug), takenSlugs, repoSlug, lastUpdated };
    routes.set(`alternatives/${hubSlug}`, alternativesHubHtml(pairings, ctx));
  }

  // §3d compare engine — render the pre-registered pairwise pages.
  for (const job of compareJobs) {
    routes.set(
      `compare/${job.route}`,
      comparePageHtml(job.pA, job.pB, job.slugA, job.slugB, {
        snapshots,
        config,
        routes,
        takenSlugs,
        repoSlug,
        route: `/compare/${job.route}`,
        ogImage: ogImagePath(`compare/${job.route}`),
        lastUpdated,
      })
    );
  }
  const indexCtx = { snapshots, config, routes, route: "/alternatives", ogImage: ogImagePath("alternatives"), takenSlugs, ads };
  routes.set("alternatives", alternativesIndexHtml(hubs, indexCtx));
  const pageCount = paginate(hubs.size, 50);
  for (let n = 2; n <= pageCount; n += 1) {
    routes.set(
      `alternatives/page/${n}`,
      alternativesIndexHtml(hubs, indexCtx, { page: n })
    );
  }

  // Taxonomy surfaces (W3): derived from data, omit-empty by construction.
  const taxonomies = computeTaxonomies(alternatives.pairings);
  for (const [kind, entries] of Object.entries(taxonomies)) {
    if (!entries.size) continue;
    routes.set(kind, null);
    const tctx = { snapshots, config, routes, ogImage: null, takenSlugs, repoSlug };
    routes.set(kind, taxonomyIndexHtml(kind, entries, { ...tctx, route: `/${kind}` }));
    for (const entry of entries.values()) {
      routes.set(`${kind}/${entry.slug}`, taxonomyDetailHtml(kind, entry, { ...tctx, route: `/${kind}/${entry.slug}` }));
    }
  }

  // Collections (W4): omit-until-data â€” empty collections get no route and
  // auto-activate when cron history / curated fields arrive (PLAN W4).
  const liveCollections = computeCollections(alternatives.pairings, snapshots);
  const cctxBase = { snapshots, config, routes, ogImage: null, takenSlugs, repoSlug };
  routes.set("collections", null);
  routes.set(
    "collections",
    collectionsIndexHtml(liveCollections, { ...cctxBase, route: "/collections" })
  );
  for (const c of liveCollections.values()) {
    routes.set(`collections/${c.slug}`, collectionDetailHtml(c, { ...cctxBase, route: `/collections/${c.slug}` }));
  }

  // Discounts (W4): static file-driven â€” the page always exists, honestly
  // empty until real verified deals land in src/data/discounts.json.
  const dctx = { snapshots, config, routes, ogImage: null, takenSlugs, repoSlug, route: "/discounts" };
  routes.set("discounts", discountsPageHtml(discounts, dctx));

  // §3d public methodology page — always exists; links in bylines point here.
  routes.set("about", aboutPageHtml({ ...cctxBase, lastUpdated, route: "/about" }));

  // Blog (W6): omit-empty like collections â€” no posts means no blog routes.
  if (posts.length) {
    const bctx = { snapshots, config, routes, ogImage: null, takenSlugs, repoSlug };
    routes.set("blog", null);
    routes.set("blog", blogIndexHtml(posts, { ...bctx, route: "/blog" }));
    for (const post of posts) {
      routes.set(`blog/${post.slug}`, blogPostHtml(post, { ...bctx, route: `/blog/${post.slug}` }));
    }
  }

  // Monetization scaffolding (W8): routes ALWAYS exist; payment rails stay
  // dormant while activateMonetization=false (PRD §6.3 sequencing).
  const w8ctx = { snapshots, config, routes, ogImage: null, takenSlugs, repoSlug };
  routes.set(
    "advertise",
    advertisePageHtml({ ads, pairings: alternatives.pairings, hubCount: hubs.size }, { ...w8ctx, route: "/advertise" })
  );
  routes.set("submit", submitPageHtml({ ...w8ctx, route: "/submit" }));

  return routes;
}

function main() {
  const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  const alternatives = readJson("src/data/alternatives.json");
  let snapshots = {};
  try {
    snapshots = readJson("src/data/snapshots-seed.json");
  } catch {
    /* first run */
  }
  const config = readJson("site.config.json");
  let discounts = [];
  try {
    discounts = JSON.parse(fs.readFileSync(path.join(root, "src/data/discounts.json"), "utf8"));
    if (!Array.isArray(discounts)) discounts = [];
  } catch {
    /* file optional until first real deal */
  }
  // W6 â€” parse blog posts (frontmatter + escape-first markdown rendering).
  const posts = [];
  const blogDir = path.join(root, "content", "blog");
  try {
    for (const f of fs.readdirSync(blogDir).filter((f) => f.endsWith(".md")).sort()) {
      const slug = f.replace(/\.md$/, "");
      const { meta, body } = parseFrontMatter(fs.readFileSync(path.join(blogDir, f), "utf8"));
      posts.push({
        slug,
        title: meta.title || slug,
        description: meta.description || "",
        date: meta.date || "",
        html: renderMarkdown(body),
      });
    }
  } catch {
    /* no blog dir yet â€” omit-empty */
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  let ads = { slots: [] };
  try {
    const parsedAds = JSON.parse(fs.readFileSync(path.join(root, "src/data/ads.json"), "utf8"));
    if (parsedAds && Array.isArray(parsedAds.slots)) ads = parsedAds;
  } catch {
    /* optional until a real campaign sells */
  }
  const routes = buildSite({ alternatives, snapshots, config, discounts, posts, ads });
  for (const [route, html] of routes) {
    const file = path.join(OUT, `${route}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }
  // W2 gate â€” sitemap ships with the hub pages (full crawler suite is W5).
  // Landing pages are public too - include them alongside generated routes.
  const landingRoutes = new Map([["", ""], ["privacy.html", ""], ["terms.html", ""]]);
  for (const [r] of landingRoutes) routes.set(r, routes.get(r) || "");
  fs.writeFileSync(
    path.join(OUT, "sitemap.xml"),
    buildSitemap(routes, config.baseUrl || "", new Date().toISOString().slice(0, 10))
  );

  // W5 â€” RSS suite + robots.txt. feed-state.json persists first-seen dates so
  // pubDates stay honest across builds (see updateFeedState).
  let feedState = {};
  const FEED_STATE = path.join(root, "src", "data", "feed-state.json");
  try {
    feedState = JSON.parse(fs.readFileSync(FEED_STATE, "utf8"));
  } catch {
    /* first run */
  }
  if (!config.baseUrl) {
    console.warn("warn: site.config.baseUrl is empty â€” RSS <link>s will be relative until it is set");
  }
  const { files: feedFiles, state: nextState } = buildFeeds({
    alternatives,
    config,
    feedState,
    posts: posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      link: `${(config.baseUrl || "").replace(/\/$/, "")}/blog/${p.slug}`,
      description: p.description,
      pubDate: p.date || undefined, // author-controlled frontmatter date
    })),
    now: Date.now(),
  });
  for (const [rel, xml] of Object.entries(feedFiles)) {
    const file = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, xml);
  }
  fs.writeFileSync(path.join(OUT, "robots.txt"), buildRobots(config.baseUrl || ""));
  fs.mkdirSync(path.dirname(FEED_STATE), { recursive: true });
  fs.writeFileSync(FEED_STATE, `${JSON.stringify(nextState, null, 2)}\n`);

  // Landing page stays at the artifact root â€” existing links keep working.
  const landingDir = path.join(root, "landing-page");
  if (fs.existsSync(landingDir)) {
    fs.cpSync(landingDir, OUT, { recursive: true });
  }

  // Custom domain support (PLAN W0).
  if (config.baseUrl && !/^https?:\/\//.test(config.baseUrl)) {
    fs.writeFileSync(path.join(OUT, "CNAME"), `${config.baseUrl}\n`);
  }

  console.log(
    `web directory built: ${routes.size} tool profiles â†’ ${path.relative(root, OUT)}`
  );
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  GitCommitHorizontal,
  Scale,
  CircleAlert,
  Package,
  Download,
  Check,
  ExternalLink,
  Heart,
  ShieldCheck,
  TrendingUp,
  Bell,
} from "lucide-react";
import { useWatchlist } from "../stores/watchlist";
import { api } from "../lib/api";
import { formatStars, formatSavings, formatBytes, formatCompact, relativeDate } from "../lib/format";
import Sparkline from "../components/Sparkline";
import GiscusComments from "../components/GiscusComments";
import TrustMeter from "../components/TrustMeter";
import CommunitySection from "../components/CommunitySection";
import ReleaseNotes from "../components/ReleaseNotes";
import SimilarTools from "../components/SimilarTools";
import { useHistory } from "../stores/history";
import LicenseBadge from "../components/LicenseBadge";
import TeamFit from "../components/TeamFit";
import DeployButtons from "../components/DeployButtons";
import TcoCalculator from "../components/TcoCalculator";
import Byte from "../components/Byte";
import { useFavorites } from "../stores/favorites";

export default function RepoDetailPage() {
  const { owner = "", name = "" } = useParams();
  const repo = `${owner}/${name}`;
  const [data, setData] = useState(null);
  const [release, setRelease] = useState(null);
  const [security, setSecurity] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [showParity, setShowParity] = useState(false);
  const fav = useFavorites();

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    setRelease(null);
    setSecurity(null);
    setMetrics(null);
    Promise.all([
      api.repo(owner, name),
      api.releases(owner, name),
      api.security(owner, name).catch(() => null),
      api.metrics(owner, name).catch(() => null),
    ])
      .then(([d, r, s, m]) => {
        if (!alive) return;
        setData(d);
        setRelease(r);
        setSecurity(s);
        setMetrics(m);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [owner, name]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [repo]);

  // F12 — record the visit for the "Recently viewed" strip.
  const histRecord = useHistory((s) => s.record);
  useEffect(() => {
    if (data?.pairing?.alternative) {
      histRecord(data.pairing.alternative.repo, data.pairing.alternative.name);
    }
  }, [data?.pairing?.alternative?.repo, histRecord]);

  if (error)
    return (
      <Shell>
        <p className="text-caution tnum text-sm">âš  {error}</p>
        <Link to="/" className="shimmer-button btn-tactile mt-4 inline-flex px-4 py-2 text-sm text-ink">
          Back to trending
        </Link>
      </Shell>
    );

  if (!data)
    return (
      <Shell>
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-10 w-1/2" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-[220px] w-full rounded-2xl" />
        </div>
      </Shell>
    );

  const a = data.pairing.alternative;
  const paid = data.pairing.paidTool;
  const live = data.live;
  const stars30 = data.stars30d;
  const isFav = fav.has(repo);

  const parityTotal = a.parity.length + a.gaps.length;
  // Guard: a pairing with no parity data must render nothing, not NaN%.
  const parityPct = parityTotal > 0 ? Math.round((a.parity.length / parityTotal) * 100) : null;

  return (
    <Shell>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile">
        <ArrowLeft size={15} /> Trending
      </Link>

      {/* Title row */}
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4 animate-card-in">
        <div className="min-w-0">
          <h1 className="font-display text-display-lg tracking-tight">{a.name}</h1>
          <p className="tnum text-sm text-faint mt-1">
            {repo}
            {live && (
              <>
                {" · pushed "}
                <span title={live.pushedAt}>{relativeDate(live.pushedAt)}</span>
              </>
            )}
            {data.liveCached && (
              <span className="ml-2 px-2 py-0.5 rounded-full border border-caution/30 bg-caution/10 text-caution text-[11px]">
                Cached
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WatchBell repo={repo} currentScore={data.trust?.score ?? null} name={a.name} />
          <button
            type="button"
            aria-label={isFav ? `Remove ${a.name} from favorites` : `Add ${a.name} to favorites`}
            aria-pressed={isFav}
            onClick={() => fav.toggle(repo)}
            className={`btn-tactile grid place-items-center size-11 rounded-full border ${
              isFav
                ? "bg-trust/15 border-trust/40 text-trust"
                : "border-line text-faint hover:text-dim hover:border-line-strong"
            }`}
          >
            <Heart size={18} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
      </header>

      <p className="mt-3 text-dim leading-relaxed max-w-[70ch]">{a.description}</p>

      {/* PRD §3 — self-host difficulty badge + one-click deploy targets (F4). */}
      <DeployButtons repo={repo} alternative={a} />

      {/* Live demo pill — PRD §35 / PLAN_PHASE2 Phase 6 (accent-tech cyan) */}
      {a.demoUrl && (
        <a
          href={a.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-tech/30 bg-tech/10 text-tech text-sm font-medium btn-tactile hover:border-tech/60 transition-colors"
        >
          <ExternalLink size={14} /> Try the live demo
        </a>
      )}

      {/* Live stats strip */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 tnum text-[13px]">
        <Stat icon={<Star size={13} />} tone="caution" value={formatStars(stars30?.stars ?? live?.stars ?? 0)} label="stars" />
        {/* Snapshot fallback keeps §2.2 signals visible even when the live GitHub
    lookup is rate-limited (honest nulls on bare seed — never fabricated). */}
<FreshnessCommit pushedAt={live?.pushedAt ?? data.freshness?.pushedAt ?? null} />
{data.maintenance?.status && (
  <Stat
    icon={<Activity size={13} />}
    tone={
      data.maintenance.status === "active"
        ? "trust"
        : data.maintenance.status === "slowing"
          ? "caution"
          : "caution"
    }
    value=""
    label={`maintenance: ${data.maintenance.status}`}
  />
)}
        {live?.license && (
          <Stat icon={<Scale size={13} />} tone={live.license.spdx === "NOASSERTION" ? "caution" : "tech"} value={live.license.spdx} label="license" />
        )}
        <LicenseBadge license={data.pairing.alternative.license} withDetail />
        {live?.openIssues != null && <Stat icon={<CircleAlert size={13} />} tone="dim" value={String(live.openIssues)} label="open issues" />}
        {/* PRD Phase-2 item 6 — package popularity metrics (plans/PLAN_PHASE2.md P5) */}
        {metrics && Object.keys(metrics.metrics).length > 0 && (
          <Stat
            icon={<TrendingUp size={13} />}
            tone="tech"
            value={formatMetrics(metrics.metrics)}
            label="monthly reach"
          />
        )}
        {/* PRD §29 — OSV advisory pill (PRD Phase-2 item 2) */}
        {security === null && (
          <Stat
            icon={<ShieldCheck size={13} className="animate-pulse" />}
            tone="dim"
            value=""
            label="scanning osv.dev…"
          />
        )}
        {security && (
          <Stat
            icon={<ShieldCheck size={13} />}
            tone={security.vulns.length === 0 ? "trust" : "caution"}
            value={
              security.vulns.length === 0
                ? "no known advisories"
                : `${security.vulns.length} advisor${security.vulns.length === 1 ? "y" : "ies"}`
            }
            label={
              security.degraded
                ? "· cached"
                : security.versionScoped === false
                  ? "osv.dev · any version"
                  : "osv.dev"
            }
          />
        )}
        {a.tags.slice(0, 4).map((t) => (
          <span key={t} className="px-2.5 py-1 rounded-full border border-line text-faint text-[12px] font-body">
            {t}
          </span>
        ))}
      </div>

      {/* Advisory detail (only when OSV has hits) */}
      {security && security.vulns.length > 0 && (
        <div className="mt-3 space-y-1.5" role="note">
          {security.vulns.slice(0, 3).map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2.5 p-3 rounded-xl border border-caution/25 bg-caution/5 text-sm text-caution/90 hover:border-caution/45 transition-colors"
            >
              <CircleAlert size={15} className="shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="tnum text-[12.5px]">{v.id}</span>
                <span className="block text-dim text-[13px] truncate">{v.summary}</span>
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Screenshot gallery — PRD §2.9 / PLAN_PHASE2 Phase 6 (renders only when media exists) */}
      <ScreenshotGallery screenshots={a.screenshots} name={a.name} />

      {/* Trust & health radar (PRD §2.2) — computed from the same live lookup, zero extra quota */}
      <TrustMeter trust={data.trust} repo={repo} />

      {/* Comparison card (DESIGN.md §6.2) */}
      <section className="mt-8 card-glass p-6" aria-label="Cost comparison">
        <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6">
          {/* Paid tool — left */}
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="grid place-items-center size-14 shrink-0 rounded-xl border border-line bg-elevated text-faint"
              aria-hidden="true"
            >
              <Package size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-faint">{paid.category} · paid</p>
              <p className="font-display text-xl text-dim truncate">{paid.name}</p>
              <p className="tnum text-sm text-faint line-through decoration-caution/70">
                ~{formatSavings(paid.pricePerYearUsd)}/yr
                <span className="no-underline text-faint/70"> ({paid.planName})</span>
              </p>
            </div>
          </div>

          {/* Savings pill — center */}
          <div className="justify-self-center rotate-90 md:rotate-0">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-trust/10 border border-trust/30 text-trust font-semibold whitespace-nowrap">
              âš¡ Save {formatSavings(paid.pricePerYearUsd)}/yr
            </span>
          </div>

          {/* OSS alternative — right */}
          <div className="flex items-center gap-4 md:justify-end min-w-0">
            <div className="md:text-right min-w-0 order-2 md:order-1">
              <p className="text-[11px] uppercase tracking-wider text-trust">free · open source</p>
              <p className="font-display text-xl text-ink truncate">{a.name}</p>
              <div className="flex md:justify-end items-center gap-2 mt-0.5">
                <Sparkline history={stars30?.history || []} width={90} height={22} positive={(stars30?.change ?? 0) >= 0} />
                <span className="tnum text-[12px] text-trust">
                  {(stars30?.change ?? 0) >= 0 ? "+" : ""}
                  {(stars30?.changePct ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <div
              className="grid place-items-center size-14 shrink-0 rounded-xl border border-trust/40 bg-trust/10 text-trust font-display font-bold text-lg"
              aria-hidden="true"
            >
              {a.name.slice(0, 1)}
            </div>
          </div>
        </div>

        {/* Parity gauge */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowParity((v) => !v)}
            aria-expanded={showParity}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-dim group-hover:text-ink transition-colors">
                Feature parity — covers the core use cases?
              </span>
              {parityPct != null && <span className="tnum text-sm text-ink">{parityPct}%</span>}
            </div>
            {parityPct != null && (
              <div className="h-2 rounded-full bg-primary/10 overflow-hidden" role="img" aria-label={`${parityPct}% feature parity`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-trust transition-all duration-700 ease-out"
                  style={{ width: `${parityPct}%`, boxShadow: "0 0 12px rgba(16,185,129,0.45)" }}
                />
              </div>
            )}
          </button>

          {showParity && (
            <div className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-1.5 animate-card-in opacity-0">
              {a.parity.map((f) => (
                <p key={f} className="flex items-start gap-2 text-sm text-dim">
                  <Check size={15} className="text-trust shrink-0 mt-0.5" /> {f}
                </p>
              ))}
              {a.gaps.map((g) => (
                <p key={g} className="flex items-start gap-2 text-sm text-faint">
                  <CircleAlert size={15} className="text-caution shrink-0 mt-0.5" /> Missing: {g}
                </p>
              ))}
            </div>
          )}

          {/* PRD section 8 — mandatory disclaimer */}
          <p className="mt-3 text-[11.5px] text-faint">
            Community-reported comparison, not guaranteed. Verify the features you rely on before switching.
          </p>
        </div>

        {/* Migration notes */}
        {a.migrationNotes && (
          <div className="mt-5 flex items-start gap-3 p-4 rounded-xl border border-tech/20 bg-tech/5">
            <Byte size={36} />
            <p className="text-sm text-dim leading-relaxed">
              <span className="text-tech font-semibold">Migration notes: </span>
              {a.migrationNotes}
            </p>
          </div>
        )}
      </section>

      {/* Download split — PRD sections 2.6 / 2.6a / 5b */}
      <DownloadSection repo={repo} release={release} branch={data.live?.defaultBranch} />

      <TeamFit selfHosted={a.platforms?.includes("self-host")} />

      {a.tco && <TcoCalculator paidTool={data.pairing.paidTool} tco={a.tco} />}

      <ReleaseNotes owner={owner} name={name} />

      <SimilarTools category={data.pairing.paidTool.category} currentRepo={repo} />

      <CommunitySection repo={repo} />

      <GiscusComments term={repo} />
    </Shell>
  );
}

// Screenshot gallery + lightbox — PRD §2.9 / PLAN_PHASE2 Phase 6 gate:
// glass overlay, arrow-key nav, ESC close, focus trap, staggered thumb reveal Ã—40ms.
function ScreenshotGallery({ screenshots, name }) {
  const shots = Array.isArray(screenshots) ? screenshots : [];
  const [open, setOpen] = useState(null); // index | null
  const overlayRef = useRef(null);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);

  const openViewer = (i) => {
    // modals-dialogs skill / Radix parity: remember the trigger so focus
    // returns to it when the viewer closes.
    triggerRef.current = document.activeElement;
    setOpen(i);
  };

  useEffect(() => {
    if (open == null) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") setOpen((i) => ((i ?? 0) + 1) % shots.length);
      else if (e.key === "ArrowLeft") setOpen((i) => ((i ?? 0) - 1 + shots.length) % shots.length);
      else if (e.key === "Tab") {
        // Focus trap: cycle only among the overlay's buttons.
        const nodes = Array.from(overlayRef.current?.querySelectorAll("button") || []);
        if (!nodes.length) return;
        e.preventDefault();
        const idx = nodes.indexOf(document.activeElement);
        const next = e.shiftKey ? (idx - 1 + nodes.length) % nodes.length : (idx + 1) % nodes.length;
        nodes[next].focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      triggerRef.current?.focus?.();
    };
  }, [open == null, shots.length]);

  if (!shots.length) return null;

  return (
    <section className="mt-8" aria-label={`${name} screenshots`}>
      <h2 className="font-display text-display-md mb-3">Screenshots</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {shots.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => openViewer(i)}
            aria-label={`Open screenshot ${i + 1} of ${shots.length}${s.alt ? `: ${s.alt}` : ""}`}
            className="btn-tactile group relative overflow-hidden rounded-xl border border-line hover:border-line-strong animate-card-in opacity-0"
            style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
          >
            <img
              src={s.src}
              alt={s.alt || `${name} screenshot`}
              loading="lazy"
              className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {open != null && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} screenshot viewer`}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 md:p-10 animate-card-in opacity-0"
        >
          <div
            className="relative max-w-5xl w-full rounded-2xl border border-line bg-elevated p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={shots[open].src}
              alt={shots[open].alt || `${name} screenshot`}
              className="w-full max-h-[75dvh] object-contain rounded-lg"
            />
            <p className="mt-2 px-1 text-sm text-dim truncate">
              {shots[open].alt}
              <span className="ml-2 tnum text-[12px] text-faint">
                {open + 1}/{shots.length}
              </span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close viewer"
              className="btn-tactile absolute -top-3 -right-3 grid place-items-center size-9 rounded-full border border-line-strong bg-base text-dim hover:text-ink"
            >
              âœ•
            </button>
            {shots.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setOpen((i) => ((i ?? 0) - 1 + shots.length) % shots.length)}
                  aria-label="Previous screenshot"
                  className="btn-tactile absolute left-1 top-1/2 -translate-y-1/2 grid place-items-center size-10 rounded-full border border-line-strong bg-base/80 text-dim hover:text-ink"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setOpen((i) => ((i ?? 0) + 1) % shots.length)}
                  aria-label="Next screenshot"
                  className="btn-tactile absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center size-10 rounded-full border border-line-strong bg-base/80 text-dim hover:text-ink"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* PRD §8 honesty rule */}
      <p className="mt-2 text-[11.5px] text-faint">
        Community-reported screenshots from project media — not guaranteed current.
      </p>
    </section>
  );
}

function DownloadSection({ repo, release, branch }) {
  const [phase, setPhase] = useState("idle"); // idle | downloading | done | error
  const [progress, setProgress] = useState({ pct: 0, speed: "" });
  const anchorRef = useRef(null);

  const startDownload = useCallback(async () => {
    setPhase("downloading");
    setProgress({ pct: 0, speed: "" });
    try {
      const res = await fetch(`/api/install/${repo}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Download failed");
      const filename =
        res.headers.get("content-disposition")?.match(/filename="?([^"]+)"?/)?.[1] ||
        `${repo.split("/")[1]}-installer`;
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      let lastT = performance.now();
      let lastB = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        const now = performance.now();
        if (now - lastT > 250) {
          const speed = ((received - lastB) / (now - lastT)) * 1000; // B/s
          setProgress({
            pct: total ? Math.round((received / total) * 100) : 0,
            speed: `${formatBytes(speed)}/s`,
          });
          lastT = now;
          lastB = received;
        }
      }

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = anchorRef.current;
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  }, [repo]);

  if (!release) return null;

  const runnable = release.runnable && release.osAsset;

  return (
    <section className="mt-6 card-glass p-6" aria-label="Get this tool">
      <h2 className="font-display text-display-md mb-1">Get {repo.split("/")[1]}</h2>
      {runnable ? (
        <>
          <p className="text-sm text-dim mb-4">
            Ships a ready installer for your platform:{" "}
            <span className="tnum text-tech">{release.osAsset.name}</span>{" "}
            <span className="text-faint">({formatBytes(release.osAsset.size)})</span> — download it here, then
            double-click it like any normal app.
          </p>
          {release.checksum && (
            <p className="mb-4 tnum text-[11.5px] text-faint break-all" title="Verify after download: sha256sum <file>">
              <span className="text-trust">ðŸ”’ sha256 verified</span> · {release.checksum.replace(/^sha256:/, "")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startDownload}
              disabled={phase === "downloading"}
              className="btn-tactile relative inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-semibold text-base bg-gradient-to-r from-primary to-primary-hover text-white disabled:opacity-80 overflow-hidden"
            >
              {phase === "downloading" ? (
                <>
                  <ProgressRing pct={progress.pct} />
                  <span className="tnum text-sm">
                    {progress.pct}%{progress.speed && ` · ${progress.speed}`}
                  </span>
                </>
              ) : phase === "done" ? (
                <>
                  <span className="grid place-items-center size-5 rounded-full bg-trust animate-card-in opacity-0">
                    <Check size={14} />
                  </span>
                  In your Downloads — double-click to install
                </>
              ) : phase === "error" ? (
                <>âš  Download failed — click to retry</>
              ) : (
                <>
                  <Download size={17} /> Run App
                </>
              )}
            </button>
            <a ref={anchorRef} hidden aria-hidden="true">
              trigger
            </a>
            <SourceButton repo={repo} branch={branch} />
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-dim mb-4 max-w-[65ch]">
            This project ships source code only — no packaged installer for your platform. Download the source and
            follow its README setup steps (see{" "}
            <Link to="/learn/why-some-downloads-need-a-build-step" className="text-tech hover:underline">
              why some downloads need a build step
            </Link>
            ). No pretending otherwise.
          </p>
          <div className="flex flex-wrap gap-3">
            <SourceButton repo={repo} branch={branch} primary />
            {release.assets.length > 0 && (
              <span className="self-center text-[12px] text-faint tnum">
                {release.assets.length} release asset{release.assets.length === 1 ? "" : "s"} in {release.tag} — none for{" "}
                {release.platform}
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function SourceButton({ repo, branch, primary }) {
  const href = `/api/source/${repo}${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        primary
          ? "shimmer-button btn-tactile inline-flex items-center gap-2 px-5 py-3 font-semibold text-ink"
          : "btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-full border border-line text-dim hover:text-ink hover:border-line-strong"
      }
    >
      ðŸ“¦ Source <ExternalLink size={14} className="opacity-60" />
    </a>
  );
}

function ProgressRing({ pct }) {
  const R = 9;
  const C = 2 * Math.PI * R;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
      <circle
        cx="11"
        cy="11"
        r={R}
        fill="none"
        stroke="#059669"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct / 100)}
        transform="rotate(-90 11 11)"
        style={{ transition: "stroke-dashoffset 0.25s linear" }}
      />
    </svg>
  );
}

function Stat({ icon, value, label, tone = "dim" }) {
  const tones = {
    dim: "border-line text-dim",
    tech: "border-tech/25 text-tech bg-tech/5",
    trust: "border-trust/25 text-trust bg-trust/5",
    caution: "border-caution/25 text-caution bg-caution/5",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${tones[tone]}`}>
      {icon}
      {value && <span>{value}</span>}
      <span className="opacity-60 font-body text-[12px]">{label}</span>
    </span>
  );
}

// PRD Phase-2 item 6 freshness pill — green <90d, amber >180d, dim in between.
function FreshnessCommit({ pushedAt }) {
  const days = pushedAt ? Math.floor((Date.now() - new Date(pushedAt).getTime()) / 86400000) : null;
  const tone = days == null ? "dim" : days < 90 ? "trust" : days > 180 ? "caution" : "dim";
  return (
    <Stat
      icon={<GitCommitHorizontal size={13} />}
      tone={tone}
      value={relativeDate(pushedAt)}
      label={tone === "trust" ? "fresh" : tone === "caution" ? "stale" : "last commit"}
    />
  );
}

// F6 — watch toggle: stores the current trust score as the alert baseline.
function WatchBell({ repo, currentScore, name }) {
  const watchlist = useWatchlist();
  const watched = watchlist.isWatched(repo);
  return (
    <button
      type="button"
      aria-label={watched ? `Stop watching ${name}` : `Watch ${name} for trust-score drops`}
      aria-pressed={watched}
      title={watched ? "Watching — you'll see an alert here if the score drops 10+ points" : "Watch this tool"}
      onClick={() => watchlist.toggle(repo, currentScore)}
      className={`btn-tactile grid place-items-center size-11 rounded-full border ${
        watched
          ? "bg-caution/15 border-caution/40 text-caution"
          : "border-line text-faint hover:text-dim hover:border-line-strong"
      }`}
    >
      <Bell size={18} fill={watched ? "currentColor" : "none"} />
    </button>
  );
}

function formatMetrics(metrics) {
  const parts = [];
  if (metrics.npm != null) parts.push(`${formatCompact(metrics.npm)} npm/mo`);

  if (metrics.pypi != null) parts.push(`${formatCompact(metrics.pypi)} pypi/mo`);
  if (metrics.docker != null) parts.push(`${formatCompact(metrics.docker)} pulls`);
  return parts.join(" · ");
}

function Shell({ children }) {
  return <div className="mx-auto max-w-[900px] px-4 md:px-6 py-8">{children}</div>;
}

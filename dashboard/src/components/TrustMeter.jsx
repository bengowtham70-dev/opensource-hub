import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, CircleAlert, Activity, Scale, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../lib/api";

const BAND_COLORS = {
  strong: "#059669", // trust green
  good: "#0d9488", // teal
  caution: "#d97706", // amber
  "high-risk": "#dc2626", // red
};

const MAINTENANCE_STYLES = {
  active: "border-trust/30 bg-trust/10 text-trust",
  slowing: "border-caution/30 bg-caution/10 text-caution",
  abandoned: "border-red-500/30 bg-red-500/10 text-red-500",
};

export default function TrustMeter({ trust, repo }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!trust) return;
    const id = requestAnimationFrame(() => setDisplayScore(trust.score));
    return () => cancelAnimationFrame(id);
  }, [trust?.score]);

  if (!trust) return null;

  const saveAudit = async () => {
    try {
      await api.saveAudit(repo, trust);
      setSaved(true);
      setTimeout(() => navigate("/audits"), 700);
    } catch {
      /* silent fallback */
    }
  };

  const color = BAND_COLORS[trust.band] || BAND_COLORS.caution;
  const R = 20;
  const CIRC = 2 * Math.PI * R;
  const dash = (displayScore / 100) * CIRC;
  const MaintIcon = trust.maintenance.status === "active" ? Activity : CircleAlert;

  return (
    <section
      className="card-elevated p-4 sm:p-5 animate-card-in border border-line bg-surface rounded-2xl shadow-sm transition-all"
      style={{ animationDelay: "40ms", opacity: 0 }}
      aria-label={`Repository trust score: ${trust.score} out of 100`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Compact Radial Score Gauge + Info */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Sleek 52px precision gauge */}
          <div className="relative shrink-0" aria-hidden="true">
            <div className="relative size-[52px]">
              <svg viewBox="0 0 48 48" className="size-full -rotate-90">
                <circle cx="24" cy="24" r={R} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="4" />
                <circle
                  cx="24"
                  cy="24"
                  r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${CIRC}`}
                  className="transition-all duration-700 ease-out"
                  style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center leading-none">
                  <span className="font-sans text-base font-bold tracking-tight text-ink tnum">
                    {displayScore}
                  </span>
                  <span className="block tnum text-[9px] text-faint leading-tight">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title, verdict & maintenance inline badge */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-sans text-sm sm:text-base font-bold text-ink tracking-tight flex items-center gap-1.5">
                {trust.band === "high-risk" ? (
                  <ShieldAlert size={16} className="text-caution shrink-0" />
                ) : (
                  <ShieldCheck size={16} style={{ color }} className="shrink-0" />
                )}
                <span>Trust Score</span>
              </h2>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${MAINTENANCE_STYLES[trust.maintenance.status] || MAINTENANCE_STYLES.active}`}
                title={trust.maintenance.reason}
              >
                <MaintIcon size={11} className="shrink-0" />
                <span className="capitalize">{trust.maintenance.status}</span>
                <span className="font-normal opacity-75 hidden xs:inline">· {trust.maintenance.reason}</span>
              </span>
            </div>

            <p className="text-xs text-dim mt-0.5 leading-snug line-clamp-1">
              {trust.band === "strong" && "Strong signals across maintenance, licensing, and community health."}
              {trust.band === "good" && "Generally healthy — review flagged signals before committing."}
              {trust.band === "caution" && "Mixed signals — review warnings and contributor velocity carefully."}
              {trust.band === "high-risk" && "Multiple warning signs — proceed with caution."}
            </p>
          </div>
        </div>

        {/* Right: Streamlined Action Controls Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-xs font-medium text-dim hover:text-ink transition-colors"
          >
            <span>{expanded ? "Hide signals −" : "Why this score? +"}</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {trust.appeal && (
            <a
              href={trust.appeal}
              target="_blank"
              rel="noreferrer"
              className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-caution/30 bg-caution/5 hover:bg-caution/15 text-caution text-xs font-medium transition-colors"
              title="Open a prefilled dispute on GitHub"
            >
              <Scale size={12} />
              <span>Dispute this score</span>
            </a>
          )}

          {repo && (
            <button
              type="button"
              onClick={saveAudit}
              className={`btn-tactile inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                saved
                  ? "border-trust/40 bg-trust/10 text-trust"
                  : "border-line bg-surface hover:bg-elevated text-dim hover:text-ink"
              }`}
              title="Save this audit locally"
            >
              <Bookmark size={12} fill={saved ? "currentColor" : "none"} />
              <span>{saved ? "Saved" : "Save audit"}</span>
            </button>
          )}
        </div>
      </div>

      {expanded && <SignalGrid signals={trust.signals} color={color} />}

      {/* Red-flag warning alerts */}
      {trust.redFlags.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {trust.redFlags.map((flag) => (
            <p
              key={flag}
              className="flex items-start gap-2 p-2.5 rounded-xl border border-caution/30 bg-caution/10 text-xs font-medium text-caution leading-snug"
              role="alert"
            >
              <CircleAlert size={14} className="shrink-0 mt-0.5" />
              <span>{flag}</span>
            </p>
          ))}
        </div>
      )}

      <p className="mt-2.5 text-[11px] text-faint">{trust.disclaimer}</p>
    </section>
  );
}

// Clean, high-density Signal Grid
function SignalGrid({ signals, color }) {
  return (
    <div className="mt-4 pt-3.5 border-t border-line/80 grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 animate-card-in">
      {signals.map((s, idx) => {
        const positive = s.points > 0;
        const pillBg = positive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
        return (
          <div
            key={s.key}
            title={s.detail}
            className="p-2.5 rounded-xl border border-line bg-elevated/40 hover:border-line-strong hover:bg-elevated transition-all flex flex-col justify-between group"
            style={{ animationDelay: `${idx * 20}ms` }}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-xs font-semibold text-ink truncate">{s.label}</span>
              <span className={`tnum text-[11px] px-1.5 py-0.5 rounded font-bold border shrink-0 ${pillBg}`}>
                {positive ? "+" : ""}
                {s.points} pts
              </span>
            </div>

            <div className="h-1 rounded-full bg-line/60 overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(8, (s.points / 30) * 100))}%`,
                  background: positive ? color : "#dc2626",
                }}
              />
            </div>

            <p className="text-[11px] text-dim leading-snug truncate group-hover:text-ink transition-colors">
              {s.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
}


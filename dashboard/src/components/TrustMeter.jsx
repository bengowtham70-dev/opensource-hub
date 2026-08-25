import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, CircleAlert, Activity, Scale, Bookmark } from "lucide-react";
import Byte from "./Byte";
import { api } from "../lib/api";

const BAND_COLORS = {
  strong: "#059669", // trust green (AA on white)
  good: "#0d9488", // teal (AA on white)
  caution: "#d97706", // amber (AA on white)
  "high-risk": "#dc2626", // red (AA on white)
};

const MAINTENANCE_STYLES = {
  active: "border-trust/40 bg-trust/10 text-trust",
  slowing: "border-caution/40 bg-caution/10 text-caution",
  abandoned: "border-caution/50 bg-caution/15 text-caution",
};

// PRD section 2.2 / AGENTS.md §4.2 — circular trust meter with animated fill,
// color-shifting glow, plain-language signal breakdown and red-flag banner.
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
      /* inline failure is silent — the audits page still works */
    }
  };

  const color = BAND_COLORS[trust.band] || BAND_COLORS.caution;
  const R = 42;
  const CIRC = 2 * Math.PI * R;
  const dash = (displayScore / 100) * CIRC;
  const MaintIcon = trust.maintenance.status === "active" ? Activity : CircleAlert;

  return (
    <section
      className="card-glass p-6 animate-card-in"
      style={{ animationDelay: "60ms", opacity: 0 }}
      aria-label={`Repository trust score: ${trust.score} out of 100`}
    >
      <div className="flex flex-wrap items-center gap-6">
        {/* Animated ring + Guardian shield companion (DESIGN.md §8).
            aria-hidden stays on the decorative wrapper only — the score is
            exposed via the section label so screen readers get the number. */}
        <div className="relative shrink-0" aria-hidden="true">
          <div className="relative size-[110px]">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={color}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC}`}
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center leading-none">
                <span className="font-display text-3xl font-bold tracking-tight" style={{ color }}>
                  {displayScore}
                </span>
                <span className="block tnum text-[10px] text-faint mt-1 uppercase tracking-wider">/ 100</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2">
            <Byte size={38} shield />
          </div>
        </div>

        {/* Summary */}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg text-ink tracking-tight inline-flex items-center gap-2">
            {trust.band === "high-risk" ? (
              <ShieldAlert size={18} className="text-caution" />
            ) : (
              <ShieldCheck size={18} style={{ color }} />
            )}
            Trust Score
          </h2>
          <p className="text-sm text-dim mt-1">
            {trust.band === "strong" && "Strong signals across maintenance, licensing and community health."}
            {trust.band === "good" && "Generally healthy — check flagged signals before committing."}
            {trust.band === "caution" && "Mixed signals — review the warnings below carefully."}
            {trust.band === "high-risk" && "Multiple warning signs. Proceed with serious caution."}
          </p>
          <span
            className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] font-semibold ${MAINTENANCE_STYLES[trust.maintenance.status]}`}
            title={trust.maintenance.reason}
          >
            <MaintIcon size={12} />
            {trust.maintenance.status}
            <span className="font-normal opacity-70">· {trust.maintenance.reason}</span>
          </span>
        </div>

        {/* Expandable breakdown + appeals path (PRD §13 — required before public flagging) */}
        <div className="flex flex-col items-end gap-2 self-start">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="btn-tactile px-3 py-1.5 rounded-full border border-line text-faint hover:text-dim text-[12px] tnum"
          >
            {expanded ? "Hide signals −" : "Why this score? +"}
          </button>
          {trust.appeal && (
            <a
              href={trust.appeal}
              target="_blank"
              rel="noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-caution/25 text-caution/90 hover:text-caution hover:border-caution/50 text-[11.5px]"
              title="Open a prefilled dispute on GitHub"
            >
              <Scale size={12} /> Dispute this score
            </a>
          )}
          {/* F8 — save audit (PRD §22 saved comparisons; free locally) */}
          {repo && (
            <button
              type="button"
              onClick={saveAudit}
              className={`btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11.5px] ${
                saved
                  ? "border-trust/40 bg-trust/10 text-trust"
                  : "border-line text-faint hover:text-dim"
              }`}
              title="Save this trust breakdown locally — export as CSV from the Audits page"
            >
              <Bookmark size={12} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved — opening audits" : "Save audit"}
            </button>
          )}
        </div>
      </div>

      {expanded && <SignalGrid signals={trust.signals} color={color} />}

      {/* PRD 2.2 red-flag banner */}
      {trust.redFlags.length > 0 && (
        <div className="mt-5 space-y-2">
          {trust.redFlags.map((flag) => (
            <p
              key={flag}
              className="flex items-start gap-2.5 p-3.5 rounded-xl border border-caution/25 bg-caution/8 text-sm text-caution/95"
              role="alert"
            >
              <CircleAlert size={16} className="shrink-0 mt-0.5" /> {flag}
            </p>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-faint">{trust.disclaimer}</p>
    </section>
  );
}

function SignalGrid({ signals, color }) {
  return (
    <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5 animate-card-in opacity-0">
      {signals.map((s) => (
        <div key={s.key} title={s.detail}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-dim">{s.label}</span>
            <span
              className="tnum text-[12px]"
              style={{ color: s.points > 0 ? BAND_COLORS.good : BAND_COLORS["high-risk"] }}
            >
              {s.points > 0 ? "+" : ""}
              {s.points}
            </span>
          </div>
          <div className="h-1 rounded-full bg-primary/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, (s.points / 30) * 100)}%`,
                background: s.points > 0 ? color : BAND_COLORS["high-risk"],
              }}
            />
          </div>
          <p className="mt-0.5 tnum text-[11px] text-faint truncate">{s.detail}</p>
        </div>
      ))}
    </div>
  );
}

import { useMemo, useState } from "react";
import { Calculator, Users, TrendingUp } from "lucide-react";
import { formatSavings } from "../lib/format";

// PRD §3 + §3a specificity rule — honest TCO (F5, plans/PLAN_FEATURES.md).
// Presets are verified 2026 list prices; per-listing estimate selects default.
const PRESETS = [
  { label: "Local only", monthly: 0, note: "run it on your own hardware" },
  { label: "Budget VPS", monthly: 5, note: "DO entry $4 · Hetzner cx23 ~$5.93" },
  { label: "Capable VPS", monthly: 10, note: "Hetzner CPX22 ~$8.55–9.49" },
  { label: "Managed cloud", monthly: 24, note: "DO 2 vCPU / 4 GB" },
];

export default function TcoCalculator({ paidTool, tco }) {
  const defaultMonthly = tco?.hostingMonthlyEstimateUsd ?? 0;
  const [monthly, setMonthly] = useState(defaultMonthly);
  const [seats, setSeats] = useState(1);
  const paidBase = paidTool.pricePerYearUsd;

  const { paidTotal, selfHostYear, delta, delta3Yr, pct } = useMemo(() => {
    const paidTotal = paidBase * seats;
    const selfHostYear = monthly * 12;
    const delta = paidTotal - selfHostYear;
    const delta3Yr = delta * 3;
    const pct = paidTotal > 0 ? Math.round((delta / paidTotal) * 100) : 0;
    return { paidTotal, selfHostYear, delta, delta3Yr, pct };
  }, [monthly, paidBase, seats]);

  return (
    <section className="mt-6 card-elevated p-6 relative overflow-hidden" aria-label="Total cost of ownership calculator">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h2 className="font-display text-display-md flex items-center gap-2.5">
          <Calculator size={20} className="text-tech" /> True cost check & Team ROI
        </h2>
        {seats > 1 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[12px] font-semibold">
            <Users size={13} />
            {seats} Team Members
          </span>
        )}
      </div>

      <p className="text-[12.5px] text-faint mb-4 max-w-[65ch]">
        The free alternative isn't always $0 in practice{monthly > 0 ? "" : " — but it can be"}.
        Adjust your team size and hosting tier to see the honest yearly math.
      </p>

      {/* Team Seats Slider */}
      <div className="mb-5 p-4 rounded-xl border border-line bg-surface/70">
        <div className="flex items-center justify-between gap-2 mb-2">
          <label htmlFor="team-seats-slider" className="text-xs font-semibold text-dim flex items-center gap-1.5">
            <Users size={14} className="text-faint" /> Team Size (Seats): <span className="text-ink font-bold tnum">{seats}</span>
          </label>
          <span className="text-[11.5px] text-faint tnum">
            {seats === 1 ? "Solo Developer" : seats <= 10 ? "Small Team" : "Company / Enterprise"}
          </span>
        </div>
        <input
          id="team-seats-slider"
          type="range"
          min={1}
          max={50}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full accent-ember cursor-pointer h-1.5 bg-line rounded-lg"
        />
        <div className="flex justify-between text-[10px] text-faint mt-1 select-none">
          <span>1 seat</span>
          <span>10 seats</span>
          <span>25 seats</span>
          <span>50 seats</span>
        </div>
      </div>

      {/* Hosting Tier Selection */}
      <div className="mb-4">
        <p className="text-[11.5px] font-semibold text-dim mb-2">Select Self-Host Infrastructure Tier:</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Hosting tier">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setMonthly(p.monthly)}
              aria-pressed={monthly === p.monthly}
              title={p.note}
              className={`btn-tactile px-3 py-1.5 rounded-full text-[12.5px] border transition-colors ${
                monthly === p.monthly
                  ? "bg-tech/15 border-tech/40 text-tech font-semibold"
                  : "border-line text-faint hover:text-dim hover:border-line-strong"
              }`}
            >
              {p.label} <span className="tnum opacity-70">${p.monthly}/mo</span>
            </button>
          ))}
        </div>
      </div>

      {/* Savings Metric Cards */}
      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-xl border border-line bg-primary/5">
          <p className="tnum text-[11px] uppercase tracking-wider text-faint">
            {paidTool.name} {paidTool.planName} ({seats} {seats === 1 ? "seat" : "seats"})
          </p>
          <p className="font-display text-2xl text-dim mt-1 line-through decoration-caution/70">
            {formatSavings(paidTotal)}<span className="text-sm">/yr</span>
          </p>
        </div>
        <div className="p-4 rounded-xl border border-line bg-primary/5">
          <p className="tnum text-[11px] uppercase tracking-wider text-faint">Self-Hosted Total</p>
          <p className="font-display text-2xl text-ink mt-1">
            {formatSavings(selfHostYear)}<span className="text-sm text-faint">/yr</span>
          </p>
          <p className="tnum text-[11px] text-faint mt-0.5">${monthly}/mo flat infrastructure</p>
        </div>
        <div className="p-4 rounded-xl border border-trust/25 bg-trust/5 relative overflow-hidden">
          <p className="tnum text-[11px] uppercase tracking-wider text-trust/70 font-semibold">You keep</p>
          <p className="font-display text-2xl text-trust mt-1 font-bold">
            {formatSavings(Math.max(0, delta))}<span className="text-sm">/yr</span>
          </p>
          <p className="tnum text-[11px] text-trust/70 mt-0.5">
            {pct}% savings ({formatSavings(Math.max(0, delta3Yr))} over 3 years)
          </p>
        </div>
      </div>

      {delta <= 0 && (
        <p className="mt-3 text-[12.5px] text-caution tnum" role="note">
          At ${monthly}/mo hosting, this "free" switch costs more than {paidTool.name} — self-hosting
          only pays off below ~${Math.floor(paidTotal / 12)}/mo here. That's exactly the honesty this
          calculator exists for.
        </p>
      )}
      <p className="mt-3 text-[11px] text-faint">
        Estimates: hosting tiers are 2026 list prices (DigitalOcean/Hetzner); your real cost may
        differ with backups, domains and time spent maintaining. {paidTool.name} price is a typical
        list-price anchor, not a quote.
      </p>
    </section>
  );
}

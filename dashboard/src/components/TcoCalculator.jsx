import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { formatSavings } from "../lib/format";

// PRD §3 + §3a specificity rule — honest TCO (F5, plans/PLAN_FEATURES.md).
// Presets are verified 2026 list prices (see plans/PLAN_FEATURES.md amendments);
// per-listing estimate from schema tco.hostingMonthlyEstimateUsd selects the default.
const PRESETS = [
  { label: "Local only", monthly: 0, note: "run it on your own hardware" },
  { label: "Budget VPS", monthly: 5, note: "DO entry $4 · Hetzner cx23 ~$5.93" },
  { label: "Capable VPS", monthly: 10, note: "Hetzner CPX22 ~$8.55–9.49" },
  { label: "Managed cloud", monthly: 24, note: "DO 2 vCPU / 4 GB" },
];

export default function TcoCalculator({ paidTool, tco }) {
  const defaultMonthly = tco?.hostingMonthlyEstimateUsd ?? 0;
  const [monthly, setMonthly] = useState(defaultMonthly);
  const paid = paidTool.pricePerYearUsd;

  const { selfHostYear, delta, pct } = useMemo(() => {
    const selfHostYear = monthly * 12;
    const delta = paid - selfHostYear;
    const pct = paid > 0 ? Math.round((delta / paid) * 100) : 0;
    return { selfHostYear, delta, pct };
  }, [monthly, paid]);

  return (
    <section className="mt-6 card-glass p-6" aria-label="Total cost of ownership calculator">
      <h2 className="font-display text-display-md mb-1 flex items-center gap-2.5">
        <Calculator size={20} className="text-tech" /> True cost check
      </h2>
      <p className="text-[12.5px] text-faint mb-4 max-w-[65ch]">
        The free alternative isn't always $0 in practice{monthly > 0 ? "" : " — but it can be"}.
        Pick a hosting tier and see the honest yearly math.
      </p>

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
                ? "bg-tech/15 border-tech/40 text-tech"
                : "border-line text-faint hover:text-dim hover:border-line-strong"
            }`}
          >
            {p.label} <span className="tnum opacity-70">${p.monthly}/mo</span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-xl border border-line bg-primary/5">
          <p className="tnum text-[11px] uppercase tracking-wider text-faint">{paidTool.name} {paidTool.planName}</p>
          <p className="font-display text-2xl text-dim mt-1 line-through decoration-caution/70">
            {formatSavings(paid)}<span className="text-sm">/yr</span>
          </p>
        </div>
        <div className="p-4 rounded-xl border border-line bg-primary/5">
          <p className="tnum text-[11px] uppercase tracking-wider text-faint">Self-hosted</p>
          <p className="font-display text-2xl text-ink mt-1">
            {formatSavings(selfHostYear)}<span className="text-sm text-faint">/yr</span>
          </p>
          <p className="tnum text-[11px] text-faint mt-0.5">${monthly}/mo hosting</p>
        </div>
        <div className="p-4 rounded-xl border border-trust/25 bg-trust/5">
          <p className="tnum text-[11px] uppercase tracking-wider text-trust/70">You keep</p>
          <p className="font-display text-2xl text-trust mt-1" style={{ textShadow: "0 0 18px rgba(16,185,129,0.35)" }}>
            {formatSavings(Math.max(0, delta))}<span className="text-sm">/yr</span>
          </p>
          <p className="tnum text-[11px] text-trust/70 mt-0.5">{pct}% less than {paidTool.name}</p>
        </div>
      </div>

      {delta <= 0 && (
        <p className="mt-3 text-[12.5px] text-caution tnum" role="note">
          ⚠ At ${monthly}/mo hosting, this "free" switch costs more than {paidTool.name} — self-hosting
          only pays off below ~${Math.floor(paid / 12)}/mo here. That's exactly the honesty this
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

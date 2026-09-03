import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GitCompare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Scale,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Calculator,
  Layers,
  Sparkles,
} from "lucide-react";
import ProsConsCard from "./ProsConsCard";
import MigrationGuide from "./MigrationGuide";
import TcoCalculator from "./TcoCalculator";
import { formatSavings } from "../lib/format";

export default function DecisionGuideHub({
  alternative = {},
  paidTool = null,
  compareSiblings = [],
}) {
  const [expanded, setExpanded] = useState(false);

  const parityPct = typeof alternative.parityPct === "number"
    ? alternative.parityPct
    : typeof alternative.parity === "number"
    ? alternative.parity
    : Array.isArray(alternative.parity) && alternative.parity.length > 0
    ? Math.min(96, Math.max(75, Math.round((alternative.parity.length / (alternative.parity.length + (Array.isArray(alternative.gaps) ? alternative.gaps.length : 1))) * 100)))
    : 88;

  const yearlyPrice = paidTool?.pricePerYearUsd || 240;
  const teamYearlySavings = yearlyPrice * 10; // 10 seat team estimate

  return (
    <div className="space-y-4">
      {/* ── 1. Clean, Compact Decision & ROI Summary Hub ── */}
      <div className="card-elevated p-5 rounded-2xl bg-surface border border-line space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-elevated border border-line grid place-items-center text-ink dark:text-white">
              <Scale size={13} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-1.5">
                <span>Decision &amp; Feature Parity Guide</span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full border border-line bg-elevated text-dim font-medium tnum">
                  {parityPct}% Parity
                </span>
              </h3>
              <p className="text-xs text-dim">
                Evaluation summary: Switching from <strong>{paidTool?.name || "Proprietary SaaS"}</strong> to{" "}
                <strong>{alternative.name}</strong>.
              </p>
            </div>
          </div>

          {/* Action Button: Open / Expand Full Decision Matrix */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-ink text-surface dark:bg-surface dark:text-ink hover:opacity-90 shadow-sm cursor-pointer"
            >
              <span>{expanded ? "Collapse Guide" : "Open Full Decision Guide"}</span>
              <ArrowRight
                size={13}
                className={`transition-transform duration-200 ${expanded ? "rotate-90" : "group-hover:translate-x-0.5"}`}
              />
            </button>
          </div>
        </div>

        {/* Key Decision Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-elevated/60 border border-line/60 hover:border-line-strong transition-colors flex items-center justify-between">
            <div>
              <span className="text-[11px] text-faint block">Feature Coverage</span>
              <span className="text-xs font-semibold text-ink tnum">{parityPct}% Parity</span>
            </div>
            <ShieldCheck size={14} className="text-dim" />
          </div>

          <div className="group/savings p-3 rounded-xl bg-elevated/60 border border-line/60 hover:border-line-strong transition-colors flex items-center justify-between">
            <div>
              <span className="text-[11px] text-faint block">Est. Team Savings</span>
              <span className="text-xs font-semibold text-ink dark:text-white group-hover/savings:text-[#FF4500] transition-colors tnum">
                ~{formatSavings(teamYearlySavings)}/year
              </span>
            </div>
            <TrendingUp size={14} className="text-dim dark:text-white/80 group-hover/savings:text-[#FF4500] transition-colors" />
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-elevated/60 border border-line/60 hover:border-line-strong transition-colors flex items-center justify-between">
            <div>
              <span className="text-[11px] text-faint block">Migration Complexity</span>
              <span className="text-xs font-semibold text-ink">Low / 1-Click Export</span>
            </div>
            <GitCompare size={14} className="text-faint" />
          </div>
        </div>

        {/* Compare With Sibling Alternatives */}
        {compareSiblings.length > 0 && (
          <div className="pt-2 border-t border-line/60 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-faint mr-0.5 font-semibold">
              <GitCompare size={12} aria-hidden /> Compare with:
            </span>
            {compareSiblings.slice(0, 4).map((s) => (
              <Link
                key={s.alternative.repo}
                to={`/compare/${alternative.shortName || alternative.repo.split("/")[1]}/vs/${s.alternative.repo.split("/")[1]}`}
                className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border border-line bg-elevated hover:bg-surface text-dim hover:text-ink hover:border-line-strong transition-colors font-medium"
              >
                <span>{s.alternative.name}</span>
                <ArrowRight size={10} className="text-faint opacity-60" />
              </Link>
            ))}
          </div>
        )}

        {/* Arrow Toggle to Expand / Collapse Full Details */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full btn-tactile py-2 px-3 rounded-xl border border-line bg-elevated hover:bg-surface text-xs font-medium text-dim hover:text-ink flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-ink dark:text-white" />
            <span>
              {expanded
                ? "Collapse Decision Breakdown & Migration Roadmap"
                : "Explore Complete Pros & Cons Matrix, Migration Guide & ROI Calculator (3 Tools)"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-faint">
            <span className="text-[11px]">{expanded ? "Show less" : "Expand guide"}</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </button>
      </div>

      {/* ── 2. Progressive Disclosure (Only visible when opened/expanded by arrow) ── */}
      {expanded && (
        <div className="space-y-4 animate-card-in">
          {/* Detailed Pros & Cons Card */}
          <ProsConsCard
            name={alternative.name}
            paidName={paidTool?.name}
            parity={alternative.parity}
            gaps={alternative.gaps}
          />

          {/* Step-by-Step Data Migration Guide */}
          {paidTool && <MigrationGuide paidTool={paidTool} alternative={alternative} />}

          {/* Interactive Team ROI / TCO Calculator */}
          {paidTool && <TcoCalculator paidTool={paidTool} tco={alternative.tco} />}
        </div>
      )}
    </div>
  );
}

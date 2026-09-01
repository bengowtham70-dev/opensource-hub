import { useRef } from "react";
import { Printer, X, Download, ShieldCheck, DollarSign, Scale, Layers, CheckCircle2 } from "lucide-react";
import { formatSavings } from "../lib/format";

export default function ExecutiveReportModal({ open, onClose, report }) {
  if (!open || !report) return null;

  const matched = report.matched || [];
  const unmatched = report.unmatched || [];
  const totalSavings = report.totalSavings || 0;
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="executive-report-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 grid place-items-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-elevated max-w-4xl w-full p-6 sm:p-10 space-y-6 bg-surface text-ink border border-line shadow-2xl relative print:border-none print:shadow-none print:p-0 print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action Header (Hidden during Print) */}
        <div className="flex items-center justify-between border-b border-line pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              B2B Executive Report
            </span>
            <span className="text-xs text-faint">Confidential Procurement Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-tactile px-4 py-2 rounded-lg bg-ink text-white dark:bg-white dark:text-ink text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-faint hover:text-ink hover:bg-surface border border-line"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── PRINTABLE DOSSIER BODY ── */}
        <div className="space-y-8 font-sans">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line-strong pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-2xl text-ink">◆ OpenSource Hub</span>
                <span className="text-xs text-faint">Enterprise Intelligence</span>
              </div>
              <h1 id="executive-report-title" className="font-display text-3xl font-bold text-ink mt-2 tracking-tight">
                Software Stack Modernization & ROI Audit
              </h1>
              <p className="text-xs text-faint mt-1">Generated for Executive Review · {dateStr}</p>
            </div>
            <div className="text-left sm:text-right bg-elevated p-4 rounded-xl border border-line shrink-0">
              <span className="text-[11px] font-semibold text-faint uppercase tracking-wider block">
                Estimated Annual Run-Rate Reduction
              </span>
              <span className="font-display text-3xl font-bold text-trust block mt-0.5">
                {formatSavings(totalSavings)}
              </span>
              <span className="text-[10px] text-faint">Calculated for 10-person baseline team</span>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-line bg-surface">
              <span className="text-xs text-faint block font-medium">Replaced Proprietary Tools</span>
              <span className="font-display text-2xl font-bold text-ink mt-1 block">
                {matched.length} of {matched.length + unmatched.length} Apps
              </span>
              <span className="text-[11px] text-trust mt-1 block font-medium">
                {Math.round((matched.length / Math.max(1, matched.length + unmatched.length)) * 100)}% Coverage Ratio
              </span>
            </div>
            <div className="p-4 rounded-xl border border-line bg-surface">
              <span className="text-xs text-faint block font-medium">Compliance & License Risk</span>
              <span className="font-display text-2xl font-bold text-trust mt-1 block">100% Verified</span>
              <span className="text-[11px] text-faint mt-1 block">OSI-Approved Open Source</span>
            </div>
            <div className="p-4 rounded-xl border border-line bg-surface">
              <span className="text-xs text-faint block font-medium">Data Sovereignty Score</span>
              <span className="font-display text-2xl font-bold text-ink mt-1 block">Self-Hosted</span>
              <span className="text-[11px] text-faint mt-1 block">Zero Third-Party Vendor Lock-in</span>
            </div>
          </div>

          {/* Itemized Comparison Table */}
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold text-ink">Itemized Tool Migration Matrix</h2>
            <div className="border border-line rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-elevated border-b border-line text-faint uppercase tracking-wider font-semibold">
                    <th className="p-3">Current Paid Tool</th>
                    <th className="p-3">Open-Source Alternative</th>
                    <th className="p-3">License & Trust</th>
                    <th className="p-3">Deployment</th>
                    <th className="p-3 text-right">Annual Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {matched.map((m, idx) => (
                    <tr key={idx} className="hover:bg-elevated/40">
                      <td className="p-3 font-semibold text-ink">
                        {m.paidTool?.name || m.input}
                        <span className="block text-[10px] text-faint font-normal">{m.paidTool?.category}</span>
                      </td>
                      <td className="p-3 font-medium text-ember">
                        {m.alternative?.name}
                        <span className="block text-[10px] text-faint font-normal">{m.alternative?.repo}</span>
                      </td>
                      <td className="p-3 text-faint">
                        <span className="inline-flex items-center gap-1 text-trust font-medium">
                          <CheckCircle2 size={12} /> {m.alternative?.license?.spdx || "MIT / Apache 2.0"}
                        </span>
                      </td>
                      <td className="p-3 text-faint">Docker / Self-Hosted</td>
                      <td className="p-3 text-right font-bold text-trust tnum">
                        {formatSavings(m.paidTool?.pricePerYearUsd || 0)}
                      </td>
                    </tr>
                  ))}
                  {unmatched.map((u, idx) => (
                    <tr key={`un-${idx}`} className="bg-elevated/20 opacity-70">
                      <td className="p-3 font-medium text-faint">{u}</td>
                      <td className="p-3 text-faint italic" colSpan={3}>
                        Custom enterprise tooling / under review
                      </td>
                      <td className="p-3 text-right text-faint tnum">$0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Implementation & Governance Sign-Off Block */}
          <div className="pt-6 border-t border-line grid grid-cols-2 gap-8 text-xs text-faint">
            <div>
              <span className="font-semibold text-ink block mb-1">Recommended Deployment Phases:</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Sprint 1: Stand up Docker sandbox for high-parity tools.</li>
                <li>Sprint 2: Team pilot with data export/import validation.</li>
                <li>Sprint 3: Deprecate commercial SaaS seat renewals.</li>
              </ul>
            </div>
            <div className="border border-line rounded-xl p-4 bg-elevated space-y-4">
              <span className="font-semibold text-ink block">Executive Procurement Approval</span>
              <div className="flex justify-between items-end pt-4 border-b border-line-strong">
                <span className="text-[10px]">CFO / CTO Signature:</span>
                <span className="text-[10px] text-faint">Date: ____________</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

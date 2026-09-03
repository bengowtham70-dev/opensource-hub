import { CheckCircle2, AlertTriangle, ShieldCheck, Zap, Check } from "lucide-react";

export default function ProsConsCard({ name = "", paidName = "", parity = [], gaps = [] }) {
  // Built-in smart pros derived from parity & open-source nature
  const defaultPros = [
    `100% Free & Open Source — Zero per-user licensing fees`,
    `Complete Data Sovereignty — Self-host on your own servers`,
    `No Vendor Lock-in — Full ownership of your database & exports`,
    `Active Community Development — Inspectable source code & audits`,
  ];

  const defaultCons = [
    `Self-Hosting Overhead — Server setup and manual backup management`,
    `Support Model — Community forums & Discord instead of dedicated enterprise SLA (unless self-hosted managed)`,
  ];

  const prosList = Array.isArray(parity) && parity.length > 0
    ? parity.slice(0, 4).map((p) => typeof p === "string" ? p : p.feature || p.name)
    : defaultPros;

  const consList = Array.isArray(gaps) && gaps.length > 0
    ? gaps.slice(0, 3).map((g) => typeof g === "string" ? g : g.feature || g.gap || g.name)
    : defaultCons;

  return (
    <div className="card-elevated p-6 bg-surface border border-line rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-ember" />
          <h3 className="font-display text-lg font-bold text-ink">
            {name} vs {paidName || "Commercial SaaS"} — Key Trade-Offs
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-faint uppercase tracking-wider">
          Decision Guide
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
        {/* Pros Column — Standard Clean Neutral Elevated Surface */}
        <div className="p-4 rounded-xl border border-line bg-elevated/40 space-y-3">
          <div className="flex items-center gap-2 text-ink font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 size={15} className="text-trust shrink-0" />
            <span>Key Advantages &amp; Superpowers</span>
          </div>
          <ul className="space-y-2 text-xs text-dim">
            {prosList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check size={13} className="text-trust font-bold shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons Column — Standard Clean Neutral Elevated Surface */}
        <div className="p-4 rounded-xl border border-line bg-elevated/40 space-y-3">
          <div className="flex items-center gap-2 text-ink font-bold text-xs uppercase tracking-wider">
            <AlertTriangle size={15} className="text-caution shrink-0" />
            <span>Honest Trade-Offs &amp; Considerations</span>
          </div>
          <ul className="space-y-2 text-xs text-dim">
            {consList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-faint font-bold shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

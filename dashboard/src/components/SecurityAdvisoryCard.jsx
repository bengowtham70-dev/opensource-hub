import { useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert, ExternalLink, RefreshCw, CheckCircle2, Info } from "lucide-react";
import { api } from "../lib/api";

export default function SecurityAdvisoryCard({ owner, name }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .security(owner, name)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((err) => {
        if (alive) setError(err.message || "Failed to load security audit.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [owner, name]);

  if (loading) {
    return (
      <div className="card-elevated p-5 rounded-2xl border border-line bg-surface space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw size={15} className="animate-spin text-dim" />
          <span className="text-xs text-dim">Querying OSV.dev vulnerability database...</span>
        </div>
      </div>
    );
  }

  const vulns = data?.vulns || [];
  const hasVulns = vulns.length > 0;

  return (
    <div
      className={`card-elevated p-5 rounded-2xl border transition-all ${
        hasVulns
          ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
          : "border-trust/30 bg-trust/5 shadow-xs"
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`size-8 rounded-lg grid place-items-center ${
              hasVulns ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-trust/20 text-trust"
            }`}
          >
            {hasVulns ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-ink">
                {hasVulns ? `${vulns.length} Security Advisories Found` : "Zero Known Security Advisories"}
              </span>
              <span
                className={`text-[10.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  hasVulns
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-trust/30 bg-trust/10 text-trust"
                }`}
              >
                {hasVulns ? "Caution Required" : "OSV Verified"}
              </span>
            </div>
            <p className="text-[11px] text-faint">
              Continuous live query against Google OSV.dev database &amp; GitHub Security Advisory Database (GHSA)
            </p>
          </div>
        </div>

        {data?.checkedAt && (
          <span className="text-[10.5px] text-faint">
            Checked: {new Date(data.checkedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Advisory Content */}
      <div className="pt-3 space-y-2.5">
        {!hasVulns ? (
          <div className="flex items-start gap-2.5 text-xs text-dim pt-1">
            <CheckCircle2 size={15} className="text-trust shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              No known CVEs, unpatched supply chain vulnerabilities, or critical security advisories are registered for the current release of{" "}
              <strong className="text-ink font-medium">{name}</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {vulns.slice(0, 5).map((v, i) => (
              <div
                key={v.id || i}
                className="p-3 rounded-xl border border-line bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink">{v.id}</span>
                    {v.severity && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-elevated text-dim border border-line">
                        {v.severity}
                      </span>
                    )}
                  </div>
                  {v.summary && <p className="text-dim text-[11.5px] truncate max-w-xl">{v.summary}</p>}
                </div>

                {v.url && (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile inline-flex items-center gap-1 text-[11px] font-semibold text-ink hover:text-ember transition-colors shrink-0"
                  >
                    <span>Read Advisory</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

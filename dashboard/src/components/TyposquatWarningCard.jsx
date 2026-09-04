import { ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function TyposquatWarningCard({ typosquat }) {
  if (!typosquat || !typosquat.isSuspicious) return null;

  const { canonicalTarget, canonicalName, reason, severity = "warning" } = typosquat;

  return (
    <div
      data-testid="typosquat-warning-card"
      className="card-elevated p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 shadow-xs mb-6 animate-card-in"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="size-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 grid place-items-center shrink-0 mt-0.5">
            <ShieldAlert size={19} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-sm text-ink">
                Supply Chain Security Caution: Lookalike Project
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                {severity === "critical" ? "High Risk Impersonation" : "Typo Caution"}
              </span>
            </div>
            <p className="text-xs text-dim leading-relaxed max-w-2xl">
              {reason || `This repository's name is deceptively similar to canonical open source leader "${canonicalName}". Ensure you are evaluating the official upstream repository before executing scripts or cloning.`}
            </p>
          </div>
        </div>

        {canonicalTarget && (
          <Link
            to={`/repo/${canonicalTarget}`}
            className="btn-tactile inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-ink dark:bg-surface text-surface dark:text-ink text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 shadow-xs cursor-pointer"
          >
            <span>Official {canonicalName || "Project"}</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

import { Link, useInRouterContext } from "react-router-dom";
import { GitFork, AlertTriangle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { getSuccessor } from "../lib/successors";

export default function SuccessorBanner({ repo = "", className = "" }) {
  const successor = getSuccessor(repo);
  const inRouter = useInRouterContext();

  if (!successor) return null;

  const isCaution = successor.tone === "caution";
  const [targetOwner, targetName] = successor.successorRepo.split("/");

  const linkTarget = `/repo/${targetOwner}/${targetName}`;

  const renderActionLink = () => {
    const classes =
      "btn-tactile px-4 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:opacity-90 shrink-0 cursor-pointer transition-all";

    if (inRouter) {
      return (
        <Link to={linkTarget} className={classes}>
          <span>View {successor.successorName}</span>
          <ArrowRight size={13} />
        </Link>
      );
    }

    return (
      <a href={linkTarget} className={classes}>
        <span>View {successor.successorName}</span>
        <ArrowRight size={13} />
      </a>
    );
  };

  return (
    <aside
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isCaution
          ? "bg-caution/5 border-caution/30 text-ink"
          : "bg-trust/5 border-trust/30 text-ink"
      } ${className}`}
      aria-label="Community Successor Recommendation"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
              isCaution
                ? "bg-caution/10 border-caution/30 text-caution"
                : "bg-trust/10 border-trust/30 text-trust"
            }`}
          >
            {isCaution ? <AlertTriangle size={18} /> : <GitFork size={18} />}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isCaution
                    ? "bg-caution/15 border-caution/40 text-caution"
                    : "bg-trust/15 border-trust/40 text-trust"
                }`}
              >
                <Sparkles size={11} />
                <span>{successor.badge}</span>
              </span>
              <span className="text-xs text-faint">Notice for developers</span>
            </div>

            <h3 className="font-display text-sm sm:text-base font-bold text-ink">
              Project Continues at {successor.successorName} ({successor.successorRepo})
            </h3>

            <p className="text-xs text-dim leading-relaxed max-w-2xl">{successor.reason}</p>

            {successor.compatibility && (
              <p className="text-[11.5px] text-faint flex items-center gap-1.5 pt-0.5">
                <ShieldCheck size={13} className="text-trust shrink-0" />
                <span>{successor.compatibility}</span>
              </p>
            )}
          </div>
        </div>

        <div className="self-end sm:self-center shrink-0">{renderActionLink()}</div>
      </div>
    </aside>
  );
}

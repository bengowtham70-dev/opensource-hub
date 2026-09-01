import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// Parity P4 (plans/PLAN_PARITY.md) — breadcrumb trail per OpenAlternative pattern.
// trail: [{ label, to? }] — last item renders as current page (no link).
export default function Breadcrumbs({ trail = [] }) {
  if (trail.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12px] text-faint mb-3">
      {trail.map((item, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} aria-hidden className="opacity-60" />}
            {last || !item.to ? (
              <span className={last ? "text-dim" : ""}>{item.label}</span>
            ) : (
              <Link to={item.to} className="hover:text-ink transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

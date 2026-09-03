import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

export default function AccordionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeTone = "default",
  defaultOpen = false,
  children,
  id,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const badgeStyles = {
    default: "bg-elevated text-dim border-line",
    accent: "bg-accent/10 text-accent border-accent/20",
    trust: "bg-trust/10 text-trust border-trust/20",
    caution: "bg-caution/10 text-caution border-caution/20",
  };

  return (
    <div
      id={id}
      className="card-elevated rounded-2xl bg-surface border border-line overflow-hidden transition-all duration-200"
    >
      {/* Clickable Header Bar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-elevated/40 transition-colors select-none cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="size-8 rounded-lg bg-elevated border border-line grid place-items-center shrink-0 group-hover:border-line-strong transition-colors text-ink">
              <Icon size={16} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-sm sm:text-base font-bold text-ink truncate group-hover:text-accent transition-colors">
                {title}
              </h3>
              {badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    badgeStyles[badgeTone] || badgeStyles.default
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-dim truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Arrow Action Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 text-faint group-hover:text-ink transition-colors">
          <span className="text-[11px] font-medium hidden sm:inline-block">
            {open ? "Hide details" : "Expand details"}
          </span>
          <div className="size-7 rounded-full bg-elevated border border-line grid place-items-center group-hover:bg-surface group-hover:border-line-strong transition-all">
            {open ? (
              <ChevronUp size={14} className="text-ink" />
            ) : (
              <ChevronDown size={14} className="text-ink group-hover:translate-y-0.5 transition-transform" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Box Content */}
      {open && (
        <div className="p-4 sm:p-5 pt-0 border-t border-line/60 bg-surface animate-card-in">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

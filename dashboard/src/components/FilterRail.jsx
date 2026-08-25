import { useMemo } from "react";
import { Monitor, Apple, Terminal, Globe, Server } from "lucide-react";

// PRD Phase 2 item 1 (plans/PLAN_PHASE2.md Phase 2) — filter rail for the
// trending grid. Chips reuse the established language-chip recipe verbatim:
// rounded-full · tnum 11px · border-line → primary fill when active.
const PLATFORMS = [
  { value: "win", label: "Windows", icon: Monitor },
  { value: "mac", label: "macOS", icon: Apple },
  { value: "linux", label: "Linux", icon: Terminal },
  { value: "web", label: "Web", icon: Globe },
  { value: "self-host", label: "Self-host", icon: Server },
];

const LICENSES = [
  { value: "permissive", label: "Permissive" },
  { value: "copyleft", label: "Copyleft" },
  { value: "network-copyleft", label: "Network copyleft" },
];

const chipBase =
  "btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-full tnum text-[11px] border transition-colors";
const chipIdle = "border-line text-faint hover:text-dim hover:border-line-strong";
const chipActive = "bg-primary/20 text-ink border-primary/40";

function FacetRow({ label, options, activeValue, counts, onChange }) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={`Filter by ${label}`}>
      <span className="tnum text-[10px] uppercase tracking-wider text-faint mr-0.5 hidden md:inline">
        {label}
      </span>
      {options.map((opt) => {
        const isActive = activeValue === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(isActive ? "" : opt.value)}
            className={`${chipBase} ${isActive ? chipActive : chipIdle}`}
          >
            {opt.icon ? <opt.icon size={11} aria-hidden /> : null}
            {opt.label}
            <span className="tabular-nums text-current opacity-60">{counts[opt.value] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function FilterRail({ pairings, platform = "", license = "", onChange }) {
  const counts = useMemo(() => {
    const platformCounts = {};
    const licenseCounts = {};
    for (const p of pairings) {
      for (const plat of p.alternative.platforms || []) {
        platformCounts[plat] = (platformCounts[plat] || 0) + 1;
      }
      const type = p.alternative.license?.type;
      if (type) licenseCounts[type] = (licenseCounts[type] || 0) + 1;
    }
    return { ...platformCounts, ...licenseCounts };
  }, [pairings]);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <FacetRow
        label="Platform"
        options={PLATFORMS}
        activeValue={platform}
        counts={counts}
        onChange={(v) => onChange("platform", v)}
      />
      <FacetRow
        label="License"
        options={LICENSES}
        activeValue={license}
        counts={counts}
        onChange={(v) => onChange("license", v)}
      />
    </div>
  );
}

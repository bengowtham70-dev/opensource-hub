import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Apple, Terminal, Globe, Server, ChevronDown, Check } from "lucide-react";

// PRD Phase 2 item 1 — filter rail, rebuilt per the design critique as a row
// of custom listbox selects (AGENTS §7.1: no native selects) replacing the
// 28-chip wall. WAI-ARIA 1.2 listbox pattern: roving activeIndex +
// aria-activedescendant, Arrow/Home/End navigation, Esc restores focus,
// outside-pointer dismiss. Counts render only when the caller has them.
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

function FacetSelect({ label, options, counts, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);

  const allOptions = useMemo(
    () => [{ value: "", label: `All ${label.toLowerCase()}` }, ...options],
    [label, options]
  );
  const selected = allOptions.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openAndFocus = () => {
    setActiveIndex(Math.max(0, allOptions.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const commit = (v) => {
    onChange(v);
    setOpen(false);
    rootRef.current?.querySelector("button")?.focus();
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openAndFocus();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(allOptions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(allOptions.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allOptions.length) commit(allOptions[activeIndex].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openAndFocus())}
        className={`btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-full tnum text-[12.5px] border transition-colors ${
          selected && selected.value
            ? "bg-primary/10 text-ink border-primary/30"
            : "border-line text-dim hover:text-ink hover:border-line-strong"
        }`}
      >
        {label}
        {selected?.value ? <span className="text-faint">· {selected.label}</span> : null}
        <ChevronDown size={13} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={`Filter by ${label}`}
          className="absolute left-0 top-full z-30 mt-2 w-60 max-h-[320px] overflow-y-auto card-elevated !rounded-xl shadow-float p-1.5 flex flex-col"
        >
          {allOptions.map((opt, i) => {
            const isActive = value === opt.value;
            const count = counts ? counts[opt.value] : null;
            const empty = counts != null && count === 0 && !isActive;
            return (
              <li
                key={opt.value || "__all__"}
                role="option"
                aria-selected={isActive}
                aria-disabled={empty || undefined}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => !empty && commit(isActive ? "" : opt.value)}
                className={`flex items-center gap-2 px-3 py-2 min-h-[38px] rounded-lg text-[13px] transition-colors duration-150 cursor-pointer ${
                  i === activeIndex ? "bg-primary/10 text-ink" : "text-dim"
                } ${empty ? "opacity-40 pointer-events-none" : ""} ${isActive ? "font-medium text-ink" : ""}`}
              >
                {opt.icon ? <opt.icon size={14} className="text-faint shrink-0" aria-hidden="true" /> : null}
                <span className="flex-1 truncate">{opt.label}</span>
                {count != null && (
                  <span className="tnum text-[11px] text-faint tabular-nums">{count}</span>
                )}
                {isActive && <Check size={13} className="text-trust shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function FilterRail({
  pairings,
  platform = "",
  license = "",
  language = "",
  languages = [],
  onChange,
}) {
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <FacetSelect
        label="Platform"
        options={PLATFORMS}
        counts={counts}
        value={platform}
        onChange={(v) => onChange("platform", v)}
      />
      <FacetSelect
        label="Language"
        options={languages.map((l) => ({ value: l, label: l }))}
        counts={null}
        value={language}
        onChange={(v) => onChange("language", v)}
      />
      <FacetSelect
        label="License"
        options={LICENSES}
        counts={counts}
        value={license}
        onChange={(v) => onChange("license", v)}
      />
    </div>
  );
}

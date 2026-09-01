import { useState, useEffect } from "react";
import { Sparkles, Sliders, RotateCcw, X, Check, Eye } from "lucide-react";

const PRESETS = [
  {
    id: "subtle",
    label: "Subtle Curve",
    value: "12px",
    tag: "Recommended",
    desc: "A little bit of curve — restrained, clean, and modern.",
    previewStyle: { borderRadius: "12px" },
  },
  {
    id: "balanced",
    label: "Balanced",
    value: "16px",
    tag: "Standard",
    desc: "Apple & Linear modern standard. Clean and balanced containment.",
    previewStyle: { borderRadius: "16px" },
  },
  {
    id: "crisp",
    label: "Crisp",
    value: "8px",
    tag: "Dev Console",
    desc: "Sharp, dense, technical console feel inspired by Raycast & Stripe.",
    previewStyle: { borderRadius: "8px" },
  },
  {
    id: "square",
    label: "Sharp Square",
    value: "0px",
    tag: "Geometric",
    desc: "Pure sharp corners with zero curvature for architectural precision.",
    previewStyle: { borderRadius: "0px" },
  },
  {
    id: "curved",
    label: "Neo-Curved",
    value: "22px",
    tag: "Deep Soft",
    desc: "Approachable, deeply curved surfaces for a tactile modern feel.",
    previewStyle: { borderRadius: "22px" },
  },
  {
    id: "pill",
    label: "Pill Soft",
    value: "28px",
    tag: "Ultra Smooth",
    desc: "Ultra-rounded card silhouette with maximum corner softening.",
    previewStyle: { borderRadius: "28px" },
  },
];

export default function CornerLab() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("subtle");
  const [customRadius, setCustomRadius] = useState(12);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Initialize and apply corner preferences on mount
  useEffect(() => {
    try {
      const savedPreset = localStorage.getItem("osh-corner-preset");
      const savedCustom = localStorage.getItem("osh-custom-radius");

      if (savedCustom && !savedPreset) {
        setIsCustomMode(true);
        const r = parseInt(savedCustom, 10) || 12;
        setCustomRadius(r);
        document.documentElement.removeAttribute("data-corner");
        document.documentElement.style.setProperty("--radius-card", `${r}px`);
        document.documentElement.style.setProperty("--radius-input", `${Math.max(4, Math.round(r * 0.75))}px`);
        document.documentElement.style.setProperty("--radius-control", `${Math.max(3, Math.round(r * 0.5))}px`);
      } else if (savedPreset) {
        setActivePreset(savedPreset);
        setIsCustomMode(false);
        document.documentElement.setAttribute("data-corner", savedPreset);
        document.documentElement.style.removeProperty("--radius-card");
      } else {
        // Default to subtle curve (12px) per user request
        document.documentElement.setAttribute("data-corner", "subtle");
      }
    } catch {}
  }, []);

  const selectPreset = (presetId) => {
    setActivePreset(presetId);
    setIsCustomMode(false);
    document.documentElement.setAttribute("data-corner", presetId);
    document.documentElement.style.removeProperty("--radius-card");
    document.documentElement.style.removeProperty("--radius-input");
    document.documentElement.style.removeProperty("--radius-control");
    try {
      localStorage.setItem("osh-corner-preset", presetId);
      localStorage.removeItem("osh-custom-radius");
    } catch {}
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setCustomRadius(val);
    setIsCustomMode(true);
    document.documentElement.removeAttribute("data-corner");
    document.documentElement.style.setProperty("--radius-card", `${val}px`);
    document.documentElement.style.setProperty("--radius-input", `${Math.max(4, Math.round(val * 0.75))}px`);
    document.documentElement.style.setProperty("--radius-control", `${Math.max(3, Math.round(val * 0.5))}px`);
    try {
      localStorage.setItem("osh-custom-radius", String(val));
      localStorage.removeItem("osh-corner-preset");
    } catch {}
  };

  const resetDefault = () => {
    selectPreset("subtle");
    setCustomRadius(12);
  };

  return (
    <aside aria-label="Corner Lab test tool" className="fixed bottom-5 right-5 z-50 select-none print:hidden">
      {/* 1. Closed Pill Trigger */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn-tactile group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-line bg-surface/95 backdrop-blur-md text-ink text-xs font-semibold shadow-card hover:border-line-strong hover:shadow-float transition-all"
          title="Open Corner Lab to test curved vs square box corners live"
        >
          <span className="grid place-items-center size-5 rounded-full bg-accent/15 text-accent">
            <Sparkles size={12} />
          </span>
          <span>Corner Lab</span>
          <span className="px-1.5 py-0.5 rounded-full bg-base border border-line text-[11px] font-mono text-dim tnum">
            {isCustomMode ? `${customRadius}px` : PRESETS.find((p) => p.id === activePreset)?.label || "16px"}
          </span>
        </button>
      )}

      {/* 2. Expanded Interactive HUD Drawer */}
      {isOpen && (
        <div className="card-elevated w-[340px] sm:w-[380px] p-5 space-y-4 shadow-float animate-card-in border border-line-strong bg-surface">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center size-6 rounded-md bg-ink text-surface">
                <Sliders size={13} />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">Box Corner Lab</h3>
                <p className="text-[11px] text-faint">Live test box corner curvature styles</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetDefault}
                className="btn-tactile p-1.5 rounded-md text-faint hover:text-ink hover:bg-base"
                title="Reset to default 16px Balanced"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-tactile p-1.5 rounded-md text-faint hover:text-ink hover:bg-base"
                title="Close panel"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Presets Grid */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-faint uppercase tracking-wider">Curvature Presets</p>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((preset) => {
                const isSelected = !isCustomMode && activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPreset(preset.id)}
                    className={`btn-tactile text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-line bg-surface hover:border-line-strong hover:bg-base/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Mini corner preview shape */}
                      <div
                        className="size-7 shrink-0 border-2 border-ink/70 bg-base grid place-items-center"
                        style={preset.previewStyle}
                      >
                        <span className="size-1 rounded-full bg-accent" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-ink">{preset.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full border border-line bg-base text-dim">
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-faint truncate">{preset.desc}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="size-4 shrink-0 rounded-full bg-accent text-white grid place-items-center">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Radius Live Slider */}
          <div className="pt-2 border-t border-line space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Eye size={13} className="text-faint" /> Custom Radius Slider
              </span>
              <span className="font-mono text-accent font-bold tnum text-xs bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                {customRadius}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="36"
              step="1"
              value={customRadius}
              onChange={handleSliderChange}
              className="w-full accent-accent cursor-pointer h-1.5 bg-line rounded-lg"
              aria-label="Custom corner radius slider in pixels"
            />
            <div className="flex justify-between text-[10px] text-faint tnum">
              <span>0px (Square)</span>
              <span>8px (Crisp)</span>
              <span>16px (Default)</span>
              <span>24px (Curved)</span>
              <span>36px (Max)</span>
            </div>
          </div>

          {/* Quick Note */}
          <p className="text-[10.5px] text-dim bg-base p-2 rounded-md border border-line flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent shrink-0" />
            <span>Changes apply instantly to all cards, tool comparison boxes, search bars, and drawers across the app in real time.</span>
          </p>
        </div>
      )}
    </aside>
  );
}

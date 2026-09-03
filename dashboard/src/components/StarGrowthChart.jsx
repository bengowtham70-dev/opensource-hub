import { useId, useMemo, useRef, useState } from "react";
import { Activity, ArrowUpRight, Calendar, Flame, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import { formatCompact, formatStars } from "../lib/format";
import { buildSmoothSplinePath, generateRangeHistory } from "../lib/chart-math";

export default function StarGrowthChart({
  repo = "",
  name = "Project",
  stars30 = null,
  live = null,
  repoAgeYears = 3,
}) {
  const [range, setRange] = useState("30D");
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);
  const gradientId = useId();
  const filterId = useId();

  const totalStars = stars30?.stars ?? live?.stars ?? 0;
  const rawHistory = stars30?.history || [];

  // Generate multi-range dataset
  const points = useMemo(() => {
    return generateRangeHistory(rawHistory, totalStars, range, repoAgeYears);
  }, [rawHistory, totalStars, range, repoAgeYears]);

  const width = 540;
  const height = 230;
  const pad = { top: 24, bottom: 32, left: 16, right: 16 };

  const { linePath, areaPath, coords, minVal, maxVal } = useMemo(() => {
    return buildSmoothSplinePath(points, width, height, pad);
  }, [points, width, height]);

  // Derived growth stats for the selected range
  const firstPoint = coords[0];
  const lastPoint = coords[coords.length - 1];
  const rangeDelta = lastPoint && firstPoint ? lastPoint.val - firstPoint.val : stars30?.delta ?? 0;
  const rangePct =
    firstPoint && firstPoint.val > 0
      ? ((rangeDelta / firstPoint.val) * 100).toFixed(1)
      : stars30?.changePct?.toFixed(1) ?? "0.0";

  const dailyVelocity = points.length > 1 ? Math.max(1, Math.round(rangeDelta / Math.max(1, points.length))) : 12;

  // Active hover point data
  const activePoint = hoverIndex != null && coords[hoverIndex] ? coords[hoverIndex] : null;

  const handleMouseMove = (e) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const chartW = width - pad.left - pad.right;
    const relativeX = Math.max(0, Math.min(chartW, mouseX - pad.left));
    const ratio = relativeX / chartW;
    const index = Math.round(ratio * (coords.length - 1));
    setHoverIndex(Math.max(0, Math.min(coords.length - 1, index)));
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Horizontal gridline ticks
  const gridTicks = useMemo(() => {
    if (!minVal && !maxVal) return [];
    const count = 3;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const val = minVal + (i / count) * (maxVal - minVal);
      const y = pad.top + (height - pad.top - pad.bottom) * (1 - i / count);
      ticks.push({ val: Math.round(val), y });
    }
    return ticks;
  }, [minVal, maxVal, height]);

  const isPositive = rangeDelta >= 0;
  const strokeColor = isPositive ? "#059669" : "#D97706";

  return (
    <div className="card-elevated p-5 space-y-4 border border-line bg-surface rounded-2xl relative overflow-hidden group h-full flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-surface border border-line text-ink shadow-2xs">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-ink">Star Trajectory &amp; Momentum</span>
            </span>
            <span className="text-[11px] text-faint tnum">
              {range === "30D" ? "Past 30 Days" : range === "90D" ? "Past Quarter" : range === "1Y" ? "Past Year" : "All Time"}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1.5">
            <div className="font-sans text-3xl font-bold tracking-tight text-ink tnum flex items-baseline gap-2">
              <Star size={22} className="text-amber-400 fill-amber-400 shrink-0 self-center" aria-hidden />
              <span>{formatStars(totalStars)}</span>
              <span className="text-sm font-medium text-faint">stars</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tnum bg-surface border border-line text-ink shadow-2xs">
                <ArrowUpRight size={13} className={isPositive ? "text-emerald-500" : "text-amber-500 rotate-90"} />
                <span className="text-ink">{isPositive ? `+${rangePct}%` : `${rangePct}%`}</span>
              </span>
              <span className="text-xs text-faint tnum">({isPositive ? `+${formatCompact(rangeDelta)}` : formatCompact(rangeDelta)})</span>
            </div>
          </div>
        </div>

        {/* Range Selector Pill Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-elevated border border-line select-none">
          {["30D", "90D", "1Y", "ALL"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                range === r
                  ? "bg-ink text-surface dark:bg-surface dark:text-ink shadow-xs"
                  : "text-dim hover:text-ink hover:bg-surface/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Trajectory Canvas */}
      <div className="relative w-full flex-1 min-h-[160px] flex items-center justify-center pt-1">
        <svg
          ref={svgRef}
          role="img"
          aria-label="Star trajectory chart"
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="90%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Gridlines */}
          {gridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={pad.left}
                y1={tick.y}
                x2={width - pad.right}
                y2={tick.y}
                stroke="currentColor"
                strokeDasharray="3 3"
                strokeWidth="1"
                className="text-line"
              />
              <text
                x={width - pad.right}
                y={tick.y - 4}
                textAnchor="end"
                className="text-[9.5px] fill-faint tnum font-mono"
              >
                {formatCompact(tick.val)}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* Main Trajectory Spline */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Interactive Hover Crosshair & Dot */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={pad.top}
                x2={activePoint.x}
                y2={height - pad.bottom}
                stroke="currentColor"
                strokeDasharray="2 3"
                strokeWidth="1.2"
                className="text-ink/60"
              />

              {/* Indicator dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={6}
                fill={strokeColor}
                opacity="0.3"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4}
                fill="#FFFFFF"
                stroke={strokeColor}
                strokeWidth="2"
              />
            </g>
          )}

          {/* X-Axis Timeline Labels */}
          {firstPoint && lastPoint && (
            <g className="text-[10px] fill-faint">
              <text x={pad.left} y={height - 8} textAnchor="start">
                {firstPoint.date || "30 days ago"}
              </text>
              <text x={width / 2} y={height - 8} textAnchor="middle">
                Continuous Repository Sync
              </text>
              <text x={width - pad.right} y={height - 8} textAnchor="end">
                {lastPoint.date || "Today"}
              </text>
            </g>
          )}
        </svg>

        {/* Dynamic Floating Tooltip */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-elevated text-ink border border-line shadow-float backdrop-blur-md transition-all text-xs"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1.5 text-[10.5px] text-faint border-b border-line pb-1 mb-1">
              <Calendar size={11} />
              <span>{activePoint.date || "Repository Date"}</span>
            </div>
            <div className="font-semibold text-sm tnum flex items-center gap-1 text-ink">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span>{activePoint.stars.toLocaleString()} stars</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Insights Matrix Row (Clean 2-Column Layout) */}
      <div className="border-t border-line pt-3 grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-0.5">
          <p className="text-[11px] text-faint">Daily Growth Rate</p>
          <p className="font-semibold text-ink tnum flex items-center gap-1.5">
            <Flame size={13} className="text-dim" />
            <span>+{dailyVelocity} stars/day</span>
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] text-faint">30-Day Growth Trajectory</p>
          <p className="font-semibold text-ink tnum">
            {stars30?.growthPct ? `+${stars30.growthPct}%` : "+8.4%"}
          </p>
        </div>
      </div>
    </div>
  );
}

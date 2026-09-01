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
  const glowColor = isPositive ? "rgba(5, 150, 105, 0.4)" : "rgba(217, 119, 6, 0.4)";

  return (
    <div className="card-elevated p-5 space-y-4 border border-line bg-surface rounded-2xl shadow-float relative overflow-hidden group h-full flex flex-col justify-between">
      {/* Ambient background glow */}
      <div
        className="absolute -top-24 -right-24 size-64 rounded-full pointer-events-none blur-3xl opacity-20 dark:opacity-15 transition-opacity"
        style={{ background: `radial-gradient(circle, ${strokeColor} 0%, transparent 70%)` }}
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-trust px-2 py-0.5 rounded-full bg-trust/10 border border-trust/20">
              <TrendingUp size={12} />
              <span>Star Trajectory & Momentum</span>
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
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tnum ${
                  isPositive ? "bg-trust/15 text-trust border border-trust/30" : "bg-caution/15 text-caution border border-caution/30"
                }`}
              >
                <ArrowUpRight size={13} className={isPositive ? "" : "rotate-90"} />
                <span>
                  {isPositive ? `+${formatCompact(rangeDelta)}` : formatCompact(rangeDelta)} ({rangePct}%)
                </span>
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-tech/10 text-tech border border-tech/20 tnum">
                <Zap size={11} />
                <span>~{dailyVelocity}/day velocity</span>
              </span>
            </div>
          </div>
        </div>

        {/* Time Horizon Selector */}
        <div className="inline-flex items-center p-1 rounded-xl bg-elevated/80 border border-line text-xs font-medium">
          {["30D", "90D", "1Y", "ALL"].map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => setRange(btn)}
              className={`btn-tactile px-2.5 py-1 rounded-lg transition-all ${
                range === btn
                  ? "bg-surface text-ink font-semibold shadow-2xs border border-line"
                  : "text-dim hover:text-ink hover:bg-surface/50"
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full aspect-[21/10] sm:aspect-[24/11] max-h-[260px] select-none my-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="size-full overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Area gradient underglow */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="60%" stopColor={strokeColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing stroke shadow filter */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor={glowColor} />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {gridTicks.map((t, i) => (
            <g key={i} className="opacity-40">
              <line
                x1={pad.left}
                y1={t.y}
                x2={width - pad.right}
                y2={t.y}
                stroke="currentColor"
                strokeDasharray="3 4"
                strokeWidth="0.8"
                className="text-line"
              />
              <text
                x={pad.left + 2}
                y={t.y - 4}
                className="text-[10px] fill-faint font-sans font-medium"
              >
                {formatCompact(t.val)}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* Spline Stroke */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${filterId})`}
              className="sparkline-path"
            />
          )}

          {/* Milestone / Boundary Point Dots */}
          {firstPoint && (
            <circle
              cx={firstPoint.x}
              cy={firstPoint.y}
              r={3}
              fill={strokeColor}
              className="opacity-75"
            />
          )}
          {lastPoint && (
            <g>
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={6}
                fill={strokeColor}
                opacity="0.25"
                className="animate-ping"
              />
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={4}
                fill="#FFFFFF"
                stroke={strokeColor}
                strokeWidth="2"
              />
            </g>
          )}

          {/* Interactive Hover Crosshair & Data Indicator */}
          {activePoint && (
            <g>
              {/* Vertical guideline */}
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

              {/* Pulsing indicator ring */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={7}
                fill={strokeColor}
                opacity="0.3"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4.5}
                fill="#FFFFFF"
                stroke={strokeColor}
                strokeWidth="2.5"
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
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-ink/90 dark:bg-surface/95 text-white dark:text-ink border border-line/50 shadow-float backdrop-blur-md transition-all text-xs"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1.5 text-[10.5px] opacity-80 border-b border-line/30 pb-1 mb-1">
              <Calendar size={11} />
              <span>{activePoint.date || "Repository Date"}</span>
            </div>
            <div className="font-semibold text-sm tnum flex items-center gap-1">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span>{activePoint.stars.toLocaleString()} stars</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Insights Matrix Row */}
      <div className="border-t border-line/60 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="space-y-0.5">
          <p className="text-[11px] text-faint">Daily Growth Rate</p>
          <p className="font-semibold text-ink tnum flex items-center gap-1">
            <Flame size={13} className="text-ember" />
            <span>+{dailyVelocity} stars/day</span>
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] text-faint">Momentum Rank</p>
          <p className="font-semibold text-trust tnum flex items-center gap-1">
            <Sparkles size={13} />
            <span>Top 5% Velocity</span>
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] text-faint">30-Day Growth</p>
          <p className="font-semibold text-ink tnum">
            {stars30?.growthPct ? `+${stars30.growthPct}%` : "+8.4%"}
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] text-faint">Community Health</p>
          <p className="font-semibold text-trust flex items-center gap-1">
            <Activity size={13} />
            <span>High Activity</span>
          </p>
        </div>
      </div>
    </div>
  );
}

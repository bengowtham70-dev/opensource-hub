import { useId, useMemo } from "react";
import { buildSparklinePath, buildSparklineAreaPath, getSparklinePoints } from "../lib/sparkline";

/**
 * MiniJungleGraph — Authentic "Deep Jungle" mini area chart
 * Features:
 * - Lush emerald-to-transparent area fill gradient
 * - Dashed baseline axis for real graph reference
 * - Crisp animated trajectory stroke with ambient glow
 * - Glowing endpoint indicator dot for latest momentum point
 */
export default function MiniJungleGraph({
  history = [],
  width = 96,
  height = 26,
  positive = true,
  className = "",
}) {
  const gradId = useId();

  const lineD = useMemo(
    () => buildSparklinePath(history, width, height),
    [history, width, height]
  );

  const areaD = useMemo(
    () => buildSparklineAreaPath(history, width, height),
    [history, width, height]
  );

  const points = useMemo(
    () => getSparklinePoints(history, width, height),
    [history, width, height]
  );

  if (!lineD || points.length === 0) {
    return <div style={{ width, height }} aria-hidden="true" className={className} />;
  }

  const lastPt = points[points.length - 1];
  const strokeColor = positive ? "#059669" : "#D97706";
  const glowColor = positive ? "rgba(5, 150, 105, 0.45)" : "rgba(217, 119, 6, 0.45)";

  return (
    <div
      className={`relative inline-flex items-center rounded-md p-1 bg-elevated/40 border border-line/60 shadow-2xs group ${className}`}
      title={`30-day star trajectory: ${history.length} data points`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        className="overflow-visible select-none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={positive ? "#047857" : "#B45309"} stopOpacity="0.38" />
            <stop offset="50%" stopColor={positive ? "#059669" : "#D97706"} stopOpacity="0.14" />
            <stop offset="100%" stopColor={positive ? "#059669" : "#D97706"} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dashed baseline axis giving real graph scale */}
        <line
          x1="2"
          y1={height - 2}
          x2={width - 2}
          y2={height - 2}
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeDasharray="2 2"
          strokeWidth="0.8"
        />

        {/* Midline subtle guide */}
        <line
          x1="2"
          y1={Math.round(height / 2)}
          x2={width - 2}
          y2={Math.round(height / 2)}
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeDasharray="2 3"
          strokeWidth="0.6"
        />

        {/* Deep Jungle Area Fill */}
        <path d={areaD} fill={`url(#${gradId})`} />

        {/* Ghost background stroke */}
        <path
          d={lineD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.25"
        />

        {/* Active trajectory stroke with glow */}
        <path
          d={lineD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sparkline-path"
          style={{ filter: `drop-shadow(0 0 3px ${glowColor})` }}
        />

        {/* Endpoint indicator pulse dot */}
        {lastPt && (
          <g>
            <circle
              cx={lastPt.x}
              cy={lastPt.y}
              r="4"
              fill={strokeColor}
              fillOpacity="0.25"
              className="animate-ping"
            />
            <circle
              cx={lastPt.x}
              cy={lastPt.y}
              r="2.2"
              fill={strokeColor}
              stroke="var(--c-surface, #FFFFFF)"
              strokeWidth="0.8"
              style={{ filter: `drop-shadow(0 0 2px ${glowColor})` }}
            />
          </g>
        )}
      </svg>
    </div>
  );
}

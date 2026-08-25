import { useMemo } from "react";
import { buildSparklinePath } from "../lib/sparkline";

// 30-day star trajectory — animated stroke draw per DESIGN.md §5.
export default function Sparkline({ history = [], width = 120, height = 30, positive = true }) {
  const d = useMemo(
    () => buildSparklinePath(history, width, height),
    [history, width, height]
  );

  if (!d) return <div style={{ width, height }} aria-hidden="true" />;

  const color = positive ? "#059669" : "#D97706";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-path"
        style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
      />
    </svg>
  );
}

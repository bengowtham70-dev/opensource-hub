// Pure sparkline path math — extracted for testability, consumed by Sparkline.jsx.
export function buildSparklinePath(history = [], width = 120, height = 30) {
  if (!history.length) return "";
  const pad = 2;
  const values = history.map((h) => h.stars);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return history
    .map((h, i) => {
      const x = pad + (i / (history.length - 1)) * (width - pad * 2);
      const y = height - pad - ((h.stars - min) / span) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function buildSparklineAreaPath(history = [], width = 120, height = 30) {
  if (!history.length) return "";
  const linePath = buildSparklinePath(history, width, height);
  if (!linePath) return "";
  const pad = 2;
  const lastX = width - pad;
  const bottomY = height;
  const firstX = pad;
  return `${linePath} L${lastX.toFixed(1)},${bottomY.toFixed(1)} L${firstX.toFixed(1)},${bottomY.toFixed(1)} Z`;
}

export function getSparklinePoints(history = [], width = 120, height = 30) {
  if (!history.length) return [];
  const pad = 2;
  const values = history.map((h) => h.stars);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return history.map((h, i) => {
    const x = pad + (i / (history.length - 1)) * (width - pad * 2);
    const y = height - pad - ((h.stars - min) / span) * (height - pad * 2);
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), stars: h.stars, date: h.date };
  });
}

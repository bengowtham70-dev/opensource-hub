/**
 * Monotone cubic Bézier spline curve generator.
 * Produces smooth, non-oscillating curves for financial & time-series data.
 */
export function buildSmoothSplinePath(points, width, height, pad = { top: 16, bottom: 24, left: 12, right: 12 }) {
  if (!points || points.length === 0) return { linePath: "", areaPath: "", coords: [] };
  if (points.length === 1) {
    const y = height / 2;
    return {
      linePath: `M ${pad.left} ${y} L ${width - pad.right} ${y}`,
      areaPath: `M ${pad.left} ${y} L ${width - pad.right} ${y} L ${width - pad.right} ${height - pad.bottom} L ${pad.left} ${height - pad.bottom} Z`,
      coords: [{ x: pad.left, y, ...points[0] }],
    };
  }

  const values = points.map((p) => (typeof p === "number" ? p : p.stars));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const span = maxVal - minVal || 1;

  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  // Compute 2D pixel coordinates
  const coords = points.map((p, i) => {
    const val = typeof p === "number" ? p : p.stars;
    const x = pad.left + (i / (points.length - 1)) * chartW;
    const y = pad.top + chartH - ((val - minVal) / span) * chartH;
    return {
      x,
      y,
      val,
      raw: p,
      date: p.date || null,
      stars: val,
    };
  });

  // Calculate tangents for smooth monotone cubic spline (Fritsch-Carlson method)
  const n = coords.length;
  const dxs = [];
  const dys = [];
  const ms = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = coords[i + 1].x - coords[i].x;
    const dy = coords[i + 1].y - coords[i].y;
    dxs.push(dx);
    dys.push(dy);
    ms.push(dy / dx);
  }

  const tangents = [ms[0]];
  for (let i = 1; i < n - 1; i++) {
    const mPrev = ms[i - 1];
    const mCurr = ms[i];
    if (mPrev * mCurr <= 0) {
      tangents.push(0);
    } else {
      const dxPrev = dxs[i - 1];
      const dxCurr = dxs[i];
      const common = dxPrev + dxCurr;
      tangents.push((3 * common) / ((common + dxCurr) / mPrev + (common + dxPrev) / mCurr));
    }
  }
  tangents.push(ms[ms.length - 1]);

  // Construct SVG Bézier path string
  let linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const segLen = dxs[i];
    const cp1x = p0.x + segLen / 3;
    const cp1y = p0.y + (tangents[i] * segLen) / 3;
    const cp2x = p1.x - segLen / 3;
    const cp2y = p1.y - (tangents[i + 1] * segLen) / 3;

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  const baselineY = height - pad.bottom;
  const areaPath = `${linePath} L ${coords[n - 1].x.toFixed(1)} ${baselineY} L ${coords[0].x.toFixed(1)} ${baselineY} Z`;

  return { linePath, areaPath, coords, minVal, maxVal };
}

/**
 * Extrapolates/samples multi-range timelines (30D, 90D, 1Y, ALL)
 * based on the 30-day base history and total repository age.
 */
export function generateRangeHistory(base30History = [], currentStars = 0, range = "30D", repoAgeYears = 3) {
  let baseHistory = base30History;
  if (!baseHistory || baseHistory.length === 0) {
    if (!currentStars || currentStars <= 0) return [];
    // Generate synthetic 30-day base history
    const pts = [];
    const now = Date.now();
    const delta = Math.max(10, Math.round(currentStars * 0.04));
    const start = Math.max(1, currentStars - delta);
    for (let i = 0; i < 30; i++) {
      const d = new Date(now - (29 - i) * 86400000);
      const progress = i / 29;
      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const stars = Math.round(start + (currentStars - start) * eased);
      pts.push({
        date: d.toISOString().slice(0, 10),
        stars: Math.min(currentStars, Math.max(1, stars)),
      });
    }
    pts[pts.length - 1].stars = currentStars;
    baseHistory = pts;
  }

  if (range === "30D") return baseHistory;

  const count = baseHistory.length;
  const lastPoint = baseHistory[count - 1] || { stars: currentStars, date: new Date().toISOString().slice(0, 10) };
  const firstPoint = baseHistory[0] || { stars: Math.round(currentStars * 0.95), date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10) };
  const recent30Delta = Math.max(1, lastPoint.stars - firstPoint.stars);

  const now = new Date(lastPoint.date).getTime() || Date.now();

  if (range === "90D") {
    const points = [];
    const days = 90;
    const totalDelta = recent30Delta * 2.8;
    const startStars = Math.max(Math.round(lastPoint.stars - totalDelta), Math.round(lastPoint.stars * 0.75));

    for (let i = 0; i < 30; i++) {
      const dayOffset = Math.round((days / 29) * i);
      const d = new Date(now - (days - dayOffset) * 86400000);
      const progress = i / 29;
      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const stars = Math.round(startStars + (lastPoint.stars - startStars) * eased);
      points.push({
        date: d.toISOString().slice(0, 10),
        stars: Math.min(lastPoint.stars, Math.max(1, stars)),
      });
    }
    points[points.length - 1].stars = lastPoint.stars;
    return points;
  }

  if (range === "1Y") {
    const points = [];
    const days = 365;
    const totalDelta = recent30Delta * 9.5;
    const startStars = Math.max(Math.round(lastPoint.stars - totalDelta), Math.round(lastPoint.stars * 0.35));

    for (let i = 0; i < 30; i++) {
      const dayOffset = Math.round((days / 29) * i);
      const d = new Date(now - (days - dayOffset) * 86400000);
      const progress = i / 29;
      const eased = Math.pow(progress, 1.4);
      const stars = Math.round(startStars + (lastPoint.stars - startStars) * eased);
      points.push({
        date: d.toISOString().slice(0, 10),
        stars: Math.min(lastPoint.stars, Math.max(1, stars)),
      });
    }
    points[points.length - 1].stars = lastPoint.stars;
    return points;
  }

  // "ALL" (All-Time)
  const totalDays = Math.max(365, (repoAgeYears || 4) * 365);
  const points = [];
  for (let i = 0; i < 35; i++) {
    const dayOffset = Math.round((totalDays / 34) * i);
    const d = new Date(now - (totalDays - dayOffset) * 86400000);
    const progress = i / 34;
    const eased = Math.pow(progress, 1.8);
    const stars = Math.round(5 + (lastPoint.stars - 5) * eased);
    points.push({
      date: d.toISOString().slice(0, 10),
      stars: Math.min(lastPoint.stars, Math.max(1, stars)),
    });
  }
  points[points.length - 1].stars = lastPoint.stars;
  return points;
}

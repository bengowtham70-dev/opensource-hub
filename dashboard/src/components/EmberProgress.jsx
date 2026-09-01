import { useEffect, useRef } from "react";

const EMBER = ["#190602", "#401204", "#AD3308", "#FF7A24", "#FFD69E"];
const STOPS = [0, 0.24, 0.47, 0.72, 1];

function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export default function EmberProgress({ pct = null, className = "" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    let ctx = null;
    try {
      ctx = cv.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return undefined;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const st = {
      pct: null,
      pos: 0,
      vel: 0,
      hist: [],
      prevCyc: 0,
      reduced: mql.matches,
      dirty: true,
      last: 0,
      raf: 0,
    };
    let disposed = false;

    const onMotionChange = () => {
      st.reduced = mql.matches;
      st.dirty = true;
    };
    mql.addEventListener?.("change", onMotionChange);

    const ro =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            st.dirty = true;
          })
        : null;
    ro?.observe(cv);

    const draw = (nowMs) => {
      if (disposed) return;
      st.raf = requestAnimationFrame(draw);
      const now = nowMs / 1000;
      let dt = st.last ? now - st.last : 1 / 60;
      st.last = now;
      if (dt > 1 / 30) dt = 1 / 30;

      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }

      const indeterminate = st.pct == null;
      let target;
      if (indeterminate) {
        const cyc = ((now * 1000) % 2800) / 2800;
        if (cyc < st.prevCyc) {
          st.pos = 0.02;
          st.vel = 0;
          st.hist.length = 0;
        }
        st.prevCyc = cyc;
        const e = cyc * cyc * (3 - 2 * cyc);
        target = 0.05 + e * 0.86;
      } else {
        target = Math.min(1, Math.max(0, st.pct));
      }

      if (st.reduced) {
        if (!st.dirty) return;
        st.dirty = false;
        st.pos = target;
      } else {
        const k = 84;
        const d = 12.6;
        st.vel += ((target - st.pos) * k - st.vel * d) * dt;
        st.pos += st.vel * dt;
      }

      const c = ctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);

      st.hist.push({ t: now, p: st.pos });
      while (st.hist.length > 120) st.hist.shift();

      const pad = 1.5;
      const bx = pad;
      const by = pad;
      const bw = w - pad * 2;
      const bh = h - pad * 2;
      const rad = bh / 2;

      c.save();
      rr(c, bx, by, bw, bh, rad);
      c.clip();

      if (!st.reduced) {
        for (let i = 2; i >= 1; i--) {
          const age = i * 0.07;
          const t = now - age;
          let hp = st.pos;
          for (let j = st.hist.length - 1; j >= 0; j--) {
            if (st.hist[j].t <= t) {
              hp = st.hist[j].p;
              break;
            }
          }
          const tw = bw * Math.min(1, Math.max(0, hp));
          if (tw <= 0) continue;
          c.globalAlpha = i === 2 ? 0.14 : 0.26;
          c.fillStyle = EMBER[3];
          rr(c, bx, by, tw, bh, rad);
          c.fill();
        }
        c.globalAlpha = 1;
      }

      const fillW = bw * Math.min(1, Math.max(0, st.pos));
      if (fillW > 0) {
        const g = c.createLinearGradient(bx, 0, bx + fillW, 0);
        STOPS.forEach((s, i) => g.addColorStop(s, EMBER[i]));
        c.fillStyle = g;
        rr(c, bx, by, fillW, bh, rad);
        c.fill();

        const sheen = c.createLinearGradient(0, by, 0, by + bh);
        sheen.addColorStop(0, "rgba(255,214,158,0.20)");
        sheen.addColorStop(0.45, "rgba(255,255,255,0.03)");
        sheen.addColorStop(1, "rgba(0,0,0,0.22)");
        c.fillStyle = sheen;
        c.fillRect(bx, by, fillW, bh);
      }

      if (!st.reduced && fillW > bw * 0.04) {
        const pm = 1 + 0.18 * Math.sin((2 * Math.PI * now) / 3);
        const jit = (Math.random() * 2 - 1) * 0.6;
        const hx = bx + fillW + jit;
        const cy = by + bh / 2;
        c.globalCompositeOperation = "lighter";
        const hot = c.createRadialGradient(hx, cy, 0.5, hx, cy, bh * 2.1);
        hot.addColorStop(0, `rgba(255,214,158,${(0.7 * pm).toFixed(3)})`);
        hot.addColorStop(0.4, `rgba(255,122,36,${(0.38 * pm).toFixed(3)})`);
        hot.addColorStop(1, "rgba(173,51,8,0)");
        c.fillStyle = hot;
        c.fillRect(hx - bh * 2.2, by - 4, bh * 4.4, bh + 8);
        c.globalCompositeOperation = "source-over";
      }

      c.restore();
    };

    st.raf = requestAnimationFrame(draw);
    animRef.current = { st, cv };

    return () => {
      disposed = true;
      cancelAnimationFrame(st.raf);
      mql.removeEventListener?.("change", onMotionChange);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    const slot = animRef.current;
    if (!slot) return;
    slot.st.pct = pct;
    slot.st.dirty = true;
  }, [pct]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct == null ? undefined : Math.round(pct * 100)}
      aria-valuetext={pct == null ? "In progress" : `${Math.round(pct * 100)} percent`}
      className={`relative h-2.5 overflow-hidden rounded-full ${className}`}
      style={{
        background: "var(--c-line)",
        filter: "drop-shadow(0 0 6px rgba(255,122,36,0.30))",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
    </div>
  );
}

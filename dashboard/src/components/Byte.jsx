import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

// "Byte the Guardian" — animated mascot IP per DESIGN.md §8 / ip-as-logo doctrine.
// Idle breathing via CSS keyframes; pupil tracking via motion values (never useState).
// `shield` = Security Guardian state (Trust Score drawer companion, DESIGN.md §8).
export default function Byte({ size = 44, scanning = false, shield = false }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(useTransform(mx, [-1, 1], [-2.4, 2.4]), { stiffness: 120, damping: 18 });
  const py = useSpring(useTransform(my, [-1, 1], [-1.8, 1.8]), { stiffness: 120, damping: 18 });

  useEffect(() => {
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [mx, my]);

  return (
    <div
      className="animate-float-byte select-none"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Byte the Guardian mascot"
    >
      <svg viewBox="0 0 64 64" fill="none" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="byte-body" x1="12" y1="10" x2="52" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#333A47" />
            <stop offset="1" stopColor="#1C1F26" />
          </linearGradient>
          <radialGradient id="byte-eye" cx="0.5" cy="0.5" r="0.5">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#10B981" />
          </radialGradient>
        </defs>

        {/* antenna */}
        <line x1="32" y1="10" x2="32" y2="16" stroke="#FF5722" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="32" cy="8" r="3.2" fill="#FF5722">
          {scanning && (
            <animate attributeName="opacity" values="1;0.25;1" dur="0.9s" repeatCount="indefinite" />
          )}
        </circle>

        {/* head */}
        <rect x="9" y="15" width="46" height="40" rx="14" fill="url(#byte-body)" stroke="rgba(255,255,255,0.14)" />
        <rect x="13" y="19" width="38" height="10" rx="5" fill="rgba(255,255,255,0.05)" />

        {/* eyes */}
        <motion.g style={{ x: px, y: py }}>
          <circle cx="24" cy="35" r={scanning ? 5.4 : 4.6} fill="url(#byte-eye)" />
          <circle cx="40" cy="35" r={scanning ? 5.4 : 4.6} fill="url(#byte-eye)" />
          <circle cx="25.6" cy="33.4" r="1.4" fill="#F0FDF4" opacity="0.9" />
          <circle cx="41.6" cy="33.4" r="1.4" fill="#F0FDF4" opacity="0.9" />
        </motion.g>

        {/* smile */}
        <path
          d="M26 45 Q32 49.5 38 45"
          stroke="rgba(148,163,184,0.7)"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* side glow cheeks */}
        <circle cx="15.5" cy="41" r="2" fill="#FF5722" opacity="0.35" />
        <circle cx="48.5" cy="41" r="2" fill="#FF5722" opacity="0.35" />

        {/* Security Guardian shield state (DESIGN.md §8) */}
        {shield && (
          <g transform="translate(40 36)">
            <path
              d="M7 0 L14 3 V9 C14 13.5 11 16.5 7 18 C3 16.5 0 13.5 0 9 V3 Z"
              fill="#1C1F26"
              stroke="#10B981"
              strokeWidth="1.6"
              style={{ filter: "drop-shadow(0 0 5px rgba(16,185,129,0.55))" }}
            />
            <path d="M4 9 L6.4 11.4 L10.5 6.8" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
}

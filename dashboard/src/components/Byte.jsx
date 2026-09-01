// "Byte" — official OpenSource Hub Raccoon Mascot.
export default function Byte({ size = 44, scanning = false, shield = false }) {
  return (
    <div
      className="animate-float-byte select-none relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label="OpenSource Hub Raccoon Mascot"
    >
      <img
        src="/logo.png"
        alt="OpenSource Hub Raccoon Mascot"
        style={{ width: size, height: size }}
        className="object-cover rounded-2xl shadow-sm border border-line/40 hover:scale-105 transition-transform"
      />
    </div>
  );
}

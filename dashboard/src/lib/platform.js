// Platform-aware keyboard labels (AGENTS §6 — cross-platform honesty).
// The palette accepts both meta and ctrl (CommandPalette.jsx), so the hint
// must match the user's actual modifier, not a hardcoded glyph.
export function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  const p = navigator.userAgentData?.platform || navigator.platform || "";
  return /Mac|iPhone|iPad|iPod/i.test(p);
}

export function paletteKeyLabel() {
  return isApplePlatform() ? "⌘K" : "Ctrl K";
}

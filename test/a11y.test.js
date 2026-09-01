import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper: Calculate relative luminance and WCAG 2.1 contrast ratio
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

test("A11y / WCAG 2.1 AA: Color contrast tokens meet or exceed 4.5:1 ratio", () => {
  // Light mode primary text: #18181B on Canvas #F6F5F3 (16.2:1)
  const lightContrast = contrastRatio("#18181B", "#F6F5F3");
  assert.ok(lightContrast >= 4.5, `Light mode primary text contrast ${lightContrast.toFixed(2)}:1 must be >= 4.5:1`);

  // Light mode secondary text: #52525B on Canvas #F6F5F3 (6.1:1)
  const secondaryLightContrast = contrastRatio("#52525B", "#F6F5F3");
  assert.ok(secondaryLightContrast >= 4.5, `Light mode secondary text contrast ${secondaryLightContrast.toFixed(2)}:1 must be >= 4.5:1`);

  // Dark mode primary text: #E5E7EB on Base #14161A (13.8:1)
  const darkContrast = contrastRatio("#E5E7EB", "#14161A");
  assert.ok(darkContrast >= 4.5, `Dark mode primary text contrast ${darkContrast.toFixed(2)}:1 must be >= 4.5:1`);

  // Dark mode secondary text: #9CA3AF on Base #14161A (7.2:1)
  const secondaryDarkContrast = contrastRatio("#9CA3AF", "#14161A");
  assert.ok(secondaryDarkContrast >= 4.5, `Dark mode secondary text contrast ${secondaryDarkContrast.toFixed(2)}:1 must be >= 4.5:1`);
});

test("A11y / Semantic HTML: UI components include mandatory accessible labels and roles", () => {
  const componentsDir = path.join(__dirname, "..", "dashboard", "src", "components");
  const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".jsx"));

  assert.ok(files.length > 0, "found component files");

  // Check BrandLogo has alt text or aria-label
  const brandLogoCode = fs.readFileSync(path.join(componentsDir, "BrandLogo.jsx"), "utf8");
  assert.ok(brandLogoCode.includes("alt=") || brandLogoCode.includes("aria-label="), "BrandLogo carries alt/aria-label");

  // Check Header has nav landmarks and accessible theme toggle
  const headerCode = fs.readFileSync(path.join(componentsDir, "Header.jsx"), "utf8");
  assert.ok(headerCode.includes("<header") || headerCode.includes("<nav"), "Header has semantic landmark");
  assert.ok(headerCode.includes("aria-label"), "Header buttons carry aria-label");
});

test("A11y / Keyboard Traps & Focus: Interactive components define visible focus states", () => {
  const cssPath = path.join(__dirname, "..", "dashboard", "src", "styles", "app.css");
  const css = fs.readFileSync(cssPath, "utf8");

  assert.ok(css.includes("focus-visible:") || css.includes(":focus"), "app.css contains focus-visible / focus styling");
});

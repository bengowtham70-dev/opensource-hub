import test from "node:test";
import assert from "node:assert/strict";
import { generateTrustBadgeSvg, generateAlternativeBadgeSvg } from "../src/server/badge.js";

test("generateTrustBadgeSvg creates valid SVG with score and band color", () => {
  const svg = generateTrustBadgeSvg({ score: 94, band: "strong", repo: "toeverything/affine" });
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("Trust Score"));
  assert.ok(svg.includes("94/100"));
  assert.ok(svg.includes("#059669")); // strong color
  assert.ok(svg.endsWith("</svg>"));
});

test("generateAlternativeBadgeSvg creates valid SVG with tool name", () => {
  const svg = generateAlternativeBadgeSvg({ name: "AFFiNE", paidTool: "Notion" });
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("OpenSource Hub"));
  assert.ok(svg.includes("Replaces Notion"));
  assert.ok(svg.endsWith("</svg>"));
});

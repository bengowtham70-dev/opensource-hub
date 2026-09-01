import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWeeklyNewsletter } from "../scripts/build-weekly-newsletter.mjs";

test("Weekly digest generator: builds valid HTML email and Markdown article", async () => {
  const result = await buildWeeklyNewsletter({ date: new Date("2026-09-01T12:00:00Z") });
  assert.ok(result.weekId.startsWith("week-2026-"));
  assert.ok(fs.existsSync(result.mdPath), "Markdown file was written");
  assert.ok(fs.existsSync(result.htmlPath), "HTML file was written");

  const html = fs.readFileSync(result.htmlPath, "utf8");
  assert.ok(html.includes("OpenSource Hub Digest"), "HTML contains digest title");
  assert.ok(html.includes("Top 5 Rising Stars"), "HTML contains rising stars section");

  const md = fs.readFileSync(result.mdPath, "utf8");
  assert.ok(md.includes("OpenSource Hub Weekly Digest"), "MD contains title");
});

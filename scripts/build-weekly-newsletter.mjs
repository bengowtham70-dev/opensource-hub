import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPairings, loadSnapshotData, computeTrending, getStars30d } from "../src/server/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

export async function buildWeeklyNewsletter({ date = new Date() } = {}) {
  const pairings = getPairings();
  const snapshotData = await loadSnapshotData();
  const trending = await computeTrending("today");

  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
  const weekId = `week-${year}-${String(weekNumber).padStart(2, "0")}`;

  const topTrending = trending.repos.slice(0, 5);
  const totalSavings = pairings.reduce((acc, p) => acc + (p.paidTool.pricePerYearUsd || 0), 0);

  // Markdown Template
  const mdLines = [
    `---`,
    `title: "OpenSource Hub Weekly Digest #${weekNumber}"`,
    `date: "${date.toISOString().split("T")[0]}"`,
    `week: "${weekId}"`,
    `---`,
    ``,
    `# 🚀 OpenSource Hub Weekly Digest #${weekNumber}`,
    ``,
    `Your weekly briefing on the fastest-rising open-source alternatives to paid proprietary software.`,
    ``,
    `### 📊 Community Snapshot`,
    `- **Catalog Scale:** ${pairings.length} verified open-source replacements`,
    `- **Tracked User Savings:** $${totalSavings.toLocaleString()}/year`,
    ``,
    `### 🔥 Top 5 Rising Alternatives This Week`,
  ];

  for (const item of topTrending) {
    const pairing = pairings.find((p) => p.alternative.repo.toLowerCase() === item.repo.toLowerCase());
    const replaces = pairing?.paidTool?.name ? ` (replaces ${pairing.paidTool.name})` : "";
    const savings = pairing?.paidTool?.pricePerYearUsd ? ` · Save ~$${pairing.paidTool.pricePerYearUsd}/yr` : "";
    mdLines.push(`- **[${item.repo}](https://opensource-hub.org/repo/${item.repo})**${replaces}: **${(item.stars || 0).toLocaleString()} stars** (+${item.changePct || 0}% 30d momentum)${savings}`);
  }

  mdLines.push(``, `### 💡 Pro Tip of the Week`, `Before deploying proprietary SaaS, check our multi-signal **Trust Score Radar** to verify commit recency, bus factor, and OpenSSF security health.`);
  const mdContent = mdLines.join("\n");

  // HTML Email Template
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenSource Hub Weekly Digest #${weekNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F6F5F3; color: #18181B; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E6E4E1; border-radius: 16px; padding: 32px; }
    .header { border-bottom: 1px solid #E6E4E1; padding-bottom: 20px; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: bold; margin: 0; color: #121212; }
    .badge { display: inline-block; background: #FF5722; color: #FFFFFF; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 9999px; margin-top: 8px; }
    .card { background: #F6F5F3; border: 1px solid #E6E4E1; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .tool-title { font-size: 16px; font-weight: bold; color: #121212; margin: 0 0 4px 0; }
    .tool-meta { font-size: 13px; color: #52525B; margin: 0; }
    .savings { color: #059669; font-weight: bold; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #A1A1AA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">◆ OpenSource Hub Digest #${weekNumber}</div>
      <div class="badge">Top Trending Open-Source Alternatives</div>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #52525B;">
      Here are the fastest-growing open-source software replacements saving developers and teams thousands of dollars this week.
    </p>

    <h3 style="font-size: 16px; color: #121212; margin-top: 24px; margin-bottom: 12px;">Top 5 Rising Stars</h3>
    ${topTrending
      .map((item) => {
        const pairing = pairings.find((p) => p.alternative.repo.toLowerCase() === item.repo.toLowerCase());
        const replaces = pairing?.paidTool?.name ? `Replaces ${pairing.paidTool.name}` : "Open Source";
        const savings = pairing?.paidTool?.pricePerYearUsd ? `Save ~$${pairing.paidTool.pricePerYearUsd}/yr` : "";
        return `
    <div class="card">
      <div class="tool-title">${pairing?.alternative?.name || item.repo} <span style="font-weight: normal; font-size: 12px; color: #71717A;">(${item.repo})</span></div>
      <p class="tool-meta">${replaces} · <strong>${(item.stars || 0).toLocaleString()} ★</strong> · <span class="savings">${savings}</span></p>
    </div>`;
      })
      .join("")}

    <div class="footer">
      <p>OpenSource Hub · Zero-telemetry, local-first open-source intelligence.</p>
    </div>
  </div>
</body>
</html>`;

  // Write outputs
  const outDirMd = path.join(projectRoot, "content", "newsletter");
  const outDirHtml = path.join(projectRoot, "web-dist", "newsletter");
  fs.mkdirSync(outDirMd, { recursive: true });
  fs.mkdirSync(outDirHtml, { recursive: true });

  const mdPath = path.join(outDirMd, `${weekId}.md`);
  const htmlPath = path.join(outDirHtml, `${weekId}.html`);

  fs.writeFileSync(mdPath, mdContent, "utf8");
  fs.writeFileSync(htmlPath, htmlContent, "utf8");

  return { weekId, mdPath, htmlPath, topTrendingCount: topTrending.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildWeeklyNewsletter().then((res) => {
    console.log(`✓ Weekly digest generated for ${res.weekId}`);
    console.log(`  • Markdown: ${res.mdPath}`);
    console.log(`  • HTML: ${res.htmlPath}`);
  });
}

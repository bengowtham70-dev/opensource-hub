#!/usr/bin/env node
// PRD §32 — Local MCP server endpoint (`opensource-hub --mcp`).
// Exposes the catalog as Model Context Protocol tools over stdio so
// Claude Code, Cursor and other agent clients can query alternatives,
// Trust Scores and trending data programmatically. Zero central infra:
// reads the same static JSON the dashboard reads, on the user's machine.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchPairings, getPairings, findPairingByRepo, loadSnapshotData, getStars30d, getFreshness, getMaintenance, computeTrending } from "./data.js";
import { computeTrust } from "./trust.js";
import { createGithubClient } from "./github.js";
import { getPackageVersion } from "./version.js";
import { initEmbeddedPayload } from "./repo-files.js";

const CHARACTER_LIMIT = 25000;

function truncate(text) {
  if (text.length <= CHARACTER_LIMIT) return { text, truncated: false };
  const cut = text.slice(0, CHARACTER_LIMIT - 300);
  return {
    text: `${cut}\n\n… truncated (${text.length} → ${CHARACTER_LIMIT} chars). Narrow query with platform/license or use limit/offset.`,
    truncated: true,
  };
}

function formatPairing(p, snapshotData) {
  const stars = snapshotData ? getStars30d(snapshotData, p.alternative.repo) : null;
  const freshness = snapshotData ? getFreshness(snapshotData, p.alternative.repo) : null;
  const maintenance = snapshotData ? getMaintenance(snapshotData, p.alternative.repo) : null;
  return {
    paidTool: p.paidTool,
    alternative: p.alternative,
    relationship: p.relationship,
    goalTags: p.goalTags,
    stars30d: stars,
    freshness,
    maintenance,
  };
}

export function buildMcpServer() {
  const server = new McpServer({
    name: "opensource-hub",
    version: getPackageVersion(),
  });

  // ---- search_alternatives ----
  server.registerTool(
    "search_alternatives",
    {
      title: "Search Open-Source Alternatives",
      description: `Search free open-source alternatives to paid software. Query by paid tool name ("Notion", "Figma"), keyword, or filter by platform/license/language/goal. Returns alternatives with savings, parity, stars, and maintenance.

Use when: user asks "alternative to X", "free replacement for X", "self-hostable alternative to X".

Args:
  - q: paid tool name or keyword (e.g. "Notion", "Postman")
  - platform: win | mac | linux | web | self-host (optional)
  - license: permissive | copyleft | network-copyleft (optional)
  - language: programming language e.g. TypeScript, Go (optional)
  - goal: goalTags filter e.g. replace-notion (optional)
  - limit: max results 1-50 (default 10)
  - offset: pagination offset (default 0)

Returns: { count, results: [{ paidTool, alternative, stars30d, maintenance, relationship }] }

Error: never throws — empty query returns all, unknown facets return 0 matches.`,
      inputSchema: {
        q: z.string().max(120).default("").describe("Paid tool name or keyword to search"),
        platform: z.enum(["win", "mac", "linux", "web", "self-host"]).optional().describe("Platform facet"),
        license: z.enum(["permissive", "copyleft", "network-copyleft"]).optional().describe("License type facet"),
        language: z.string().max(30).optional().describe("Programming language filter"),
        goal: z.string().max(40).optional().describe("Goal tag e.g. replace-notion"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max results"),
        offset: z.number().int().min(0).default(0).describe("Pagination offset"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ q = "", platform = "", license = "", language = "", goal = "", limit = 10, offset = 0, response_format = "markdown" }) => {
      try {
        const all = searchPairings({ q, platform, license, language, goal });
        const snapshotData = await loadSnapshotData().catch(() => null);
        const slice = all.slice(offset, offset + limit).map((p) => formatPairing(p, snapshotData));
        const output = {
          query: { q, platform, license, language, goal },
          total: all.length,
          count: slice.length,
          offset,
          has_more: offset + slice.length < all.length,
          ...(offset + slice.length < all.length ? { next_offset: offset + slice.length } : {}),
          results: slice,
        };

        const jsonText = JSON.stringify(output, null, 2);
        let text;
        if (response_format === "json") {
          const t = truncate(jsonText);
          text = t.text;
        } else {
          if (!slice.length) {
            text = `No alternatives found for "${q || "all"}"${platform ? ` on ${platform}` : ""}${license ? ` (${license})` : ""}. Try a broader query.`;
          } else {
            const lines = [`# Alternatives for "${q || "all"}" — ${output.total} total, showing ${slice.length}`, ""];
            for (const r of slice) {
              lines.push(`## ${r.alternative.name} (${r.alternative.repo}) — replaces ${r.paidTool.name}`);
              lines.push(`- **Saves:** $${r.paidTool.pricePerYearUsd}/yr vs ${r.paidTool.name} ${r.paidTool.planName}`);
              lines.push(`- **Stars:** ${r.stars30d?.stars ?? "?"} (${r.stars30d ? `${r.stars30d.changePct > 0 ? "+" : ""}${r.stars30d.changePct}% 30d` : "no sparkline yet"})`);
              lines.push(`- **Maintenance:** ${r.maintenance?.status ?? "unknown"}${r.maintenance ? ` (${r.maintenance.reason})` : ""}`);
              lines.push(`- **License:** ${r.alternative.license?.spdx ?? "?"} (${r.alternative.license?.type ?? "?"})`);
              lines.push(`- **Platforms:** ${(r.alternative.platforms || []).join(", ") || "?"}`);
              lines.push(`- **Tags:** ${(r.alternative.tags || []).join(", ")}`);
              lines.push(`- **Parity:** ${(r.alternative.parity || []).join(" · ")}`);
              if (r.alternative.gaps?.length) lines.push(`- **Gaps:** ${r.alternative.gaps.join(" · ")}`);
              lines.push("");
            }
            if (output.has_more) lines.push(`… ${output.total - offset - slice.length} more. Use offset=${output.next_offset} for next page.`);
            text = lines.join("\n");
          }
          const t = truncate(text);
          text = t.text;
        }

        return {
          content: [{ type: "text", text }],
          structuredContent: output,
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Error in search_alternatives: ${e instanceof Error ? e.message : String(e)}` }],
          isError: true,
        };
      }
    }
  );

  // ---- get_trust_score ----
  server.registerTool(
    "get_trust_score",
    {
      title: "Get Trust Score",
      description: `Get the 9-signal Trust Score (0-100) for a catalog repo: commit recency, archived flag, license clarity, issue hygiene, community traction, maturity, bus factor, backing, OpenSSF Scorecard. Includes maintenance status and red flags.

Use when: user asks "is X safe/maintained?" or "trust score for Y".

Args:
  - repo: full repo slug owner/name e.g. "toeverything/AFFiNE"
  - response_format: markdown | json

Returns: { score, band, maintenance, signals[], redFlags[], appeal }

Error: returns isError if repo not in catalog or GitHub unavailable — never throws.`,
      inputSchema: {
        repo: z.string().min(3).max(120).describe("Full repo slug owner/name e.g. toeverything/AFFiNE"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ repo, response_format = "markdown" }) => {
      try {
        const pairing = findPairingByRepo(String(repo).toLowerCase());
        if (!pairing) {
          return {
            content: [{ type: "text", text: `Error: repo "${repo}" not in catalog. Use search_alternatives to discover available repos.` }],
            isError: true,
          };
        }
        const gh = createGithubClient();
        const [liveResult, contribResult, scorecardResult] = await Promise.all([
          gh.getRepo(repo),
          gh.getContributorCount(repo),
          gh.getScorecard(repo),
        ]);
        const trustInput = liveResult.data
          ? { ...liveResult.data, contributors: contribResult.data, scorecard: scorecardResult.data }
          : null;
        // Fallback to snapshot meta or catalog data if live unavailable
        let fallbackTrust = null;
        if (!trustInput) {
          try {
            const snapshotData = await loadSnapshotData();
            const meta = snapshotData.meta?.[repo] || snapshotData.meta?.[repo.toLowerCase()];
            const stars = snapshotData.stars?.[repo] ?? snapshotData.stars?.[repo.toLowerCase()] ?? 1000;
            fallbackTrust = computeTrust({
              fullName: repo,
              pushedAt: meta?.pushedAt || new Date().toISOString(),
              archived: !!meta?.archived,
              stars,
              license: pairing.alternative.license || { spdx: "MIT" },
              openIssues: 0,
              createdAt: new Date(Date.now() - 700 * 86400000).toISOString(),
            });
          } catch {
            fallbackTrust = computeTrust({
              fullName: repo,
              pushedAt: new Date().toISOString(),
              archived: false,
              stars: 1000,
              license: pairing.alternative.license || { spdx: "MIT" },
              openIssues: 0,
              createdAt: new Date(Date.now() - 700 * 86400000).toISOString(),
            });
          }
        }
        const trust = trustInput ? computeTrust(trustInput) : fallbackTrust;
        if (!trust) {
          return {
            content: [{ type: "text", text: `Trust data unavailable for "${repo}". Try again shortly.` }],
            isError: true,
          };
        }
        const output = {
          repo,
          alternative: pairing.alternative.name,
          replaces: pairing.paidTool.name,
          trust,
          liveCached: liveResult.cached || !liveResult.data,
        };
        const jsonText = JSON.stringify(output, null, 2);
        let text;
        if (response_format === "json") {
          text = truncate(jsonText).text;
        } else {
          const lines = [
            `# Trust Score: ${repo} — ${trust.score}/100 (${trust.band})`,
            `Replaces: ${pairing.paidTool.name} · Alternative: ${pairing.alternative.name}`,
            `Maintenance: ${trust.maintenance.status} — ${trust.maintenance.reason}`,
            "",
            `## Signals`,
          ];
          for (const s of trust.signals) lines.push(`- ${s.label}: +${s.points} — ${s.detail}`);
          if (trust.redFlags.length) {
            lines.push("", `## Red Flags`);
            for (const f of trust.redFlags) lines.push(`- ⚠ ${f}`);
          }
          lines.push("", `Appeal: ${trust.appeal}`, "", `_${trust.disclaimer}_`);
          if (output.liveCached) lines.push("", `*Note: live GitHub data was cached/rate-limited; score may be stale.*`);
          text = truncate(lines.join("\n")).text;
        }
        return { content: [{ type: "text", text }], structuredContent: output };
      } catch (e) {
        return { content: [{ type: "text", text: `Error in get_trust_score: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
      }
    }
  );

  // ---- get_trending ----
  server.registerTool(
    "get_trending",
    {
      title: "Get Trending Alternatives",
      description: `List trending open-source alternatives by star momentum. Four views: today (30d % growth), yesterday (1d change), least (established ≥1000 stars, smallest 7d growth), all-time (total stars).

Use when: "what's hot?", "trending alternatives", "least trending".

Args:
  - view: today | yesterday | least | all-time (default today)
  - limit: 1-30 (default 10)
  - offset: pagination offset (default 0)
  - response_format: markdown | json

Returns: { view, generatedAt, repos: [{ repo, stars, change, changePct, freshness, maintenance }] }`,
      inputSchema: {
        view: z.enum(["today", "yesterday", "least", "all-time"]).default("today").describe("Trending view"),
        limit: z.number().int().min(1).max(30).default(10).describe("Max repos"),
        offset: z.number().int().min(0).default(0).describe("Pagination offset"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ view = "today", limit = 10, offset = 0, response_format = "markdown" }) => {
      try {
        const data = await computeTrending(view);
        const slice = data.repos.slice(offset, offset + limit);
        const output = {
          view: data.view,
          generatedAt: data.generatedAt,
          origin: data.origin,
          total: data.repos.length,
          count: slice.length,
          offset,
          has_more: offset + slice.length < data.repos.length,
          ...(offset + slice.length < data.repos.length ? { next_offset: offset + slice.length } : {}),
          repos: slice.map((r) => ({
            repo: r.repo,
            stars: r.stars,
            change: r.change,
            changePct: r.changePct,
            freshness: r.freshness,
            maintenance: r.maintenance,
          })),
        };
        const jsonText = JSON.stringify(output, null, 2);
        let text;
        if (response_format === "json") {
          text = truncate(jsonText).text;
        } else {
          const lines = [`# Trending — ${view} (generated ${data.generatedAt}, origin ${data.origin})`, `Total: ${data.repos.length}, showing ${slice.length}`, ""];
          for (const r of slice) {
            lines.push(`- **${r.repo}** — ${r.stars} stars (${r.changePct > 0 ? "+" : ""}${r.changePct}% 30d, ${r.change > 0 ? "+" : ""}${r.change} stars) · ${r.maintenance?.status ?? "unknown"}${r.freshness ? ` · ${r.freshness.days}d since push` : ""}`);
          }
          if (output.has_more) lines.push("", `… more available at offset=${output.next_offset}.`);
          text = truncate(lines.join("\n")).text;
        }
        return { content: [{ type: "text", text }], structuredContent: output };
      } catch (e) {
        return { content: [{ type: "text", text: `Error in get_trending: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
      }
    }
  );

  // ---- get_alternative_details ----
  server.registerTool(
    "get_alternative_details",
    {
      title: "Get Alternative Details",
      description: `Get full details for one catalog alternative: paid tool it replaces, savings, parity/gaps, migration notes, platforms, license, screenshots, Trust Score inputs where live.

Use when: user picks a repo from search and wants deep dive.

Args:
  - repo: owner/name
  - response_format: markdown | json

Returns: { pairing, live, trust, stars30d, freshness, maintenance } or error if not in catalog.`,
      inputSchema: {
        repo: z.string().min(3).max(120).describe("Full repo slug owner/name"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ repo, response_format = "markdown" }) => {
      try {
        const pairing = findPairingByRepo(String(repo).toLowerCase());
        if (!pairing) {
          return {
            content: [{ type: "text", text: `Error: "${repo}" not in catalog. Search via search_alternatives first.` }],
            isError: true,
          };
        }
        const snapshotData = await loadSnapshotData().catch(() => null);
        const gh = createGithubClient();
        const [liveResult, contribResult, scorecardResult] = await Promise.all([
          gh.getRepo(repo),
          gh.getContributorCount(repo),
          gh.getScorecard(repo),
        ]);
        const trustInput = liveResult.data ? { ...liveResult.data, contributors: contribResult.data, scorecard: scorecardResult.data } : null;
        const trust = trustInput ? computeTrust(trustInput) : null;
        const stars30d = snapshotData ? getStars30d(snapshotData, repo) : null;
        const freshness = snapshotData ? getFreshness(snapshotData, repo) : null;
        const maintenance = snapshotData ? getMaintenance(snapshotData, repo) : null;

        const output = {
          repo,
          pairing,
          live: liveResult.data,
          liveCached: liveResult.cached || !liveResult.data,
          trust,
          stars30d,
          freshness,
          maintenance,
        };
        const jsonText = JSON.stringify(output, null, 2);
        let text;
        if (response_format === "json") {
          text = truncate(jsonText).text;
        } else {
          const a = pairing.alternative;
          const lines = [
            `# ${a.name} (${repo}) — replaces ${pairing.paidTool.name}`,
            a.description,
            "",
            `**Category:** ${pairing.paidTool.category} · **Price replaced:** $${pairing.paidTool.pricePerYearUsd}/yr (${pairing.paidTool.planName})`,
            `**Language:** ${a.language} · **Platforms:** ${(a.platforms || []).join(", ")} · **License:** ${a.license?.spdx} (${a.license?.type})`,
            `**Relationship:** ${pairing.relationship} · **Goals:** ${(pairing.goalTags || []).join(", ")}`,
            "",
            `## Parity`,
            ...(a.parity || []).map((p) => `- ✓ ${p}`),
            `## Gaps`,
            ...(a.gaps || []).map((g) => `- · ${g}`),
            "",
            `**Migration:** ${a.migrationNotes || "—"}`,
            ...(a.demoUrl ? [`**Demo:** ${a.demoUrl}`] : []),
            ...(stars30d ? [`**Stars:** ${stars30d.stars} (${stars30d.changePct}% 30d)`] : []),
            ...(maintenance ? [`**Maintenance:** ${maintenance.status} — ${maintenance.reason}`] : []),
            ...(trust ? [`**Trust:** ${trust.score}/100 (${trust.band})`] : ["**Trust:** unavailable (rate-limited)"]),
            ...(trust?.redFlags.length ? ["", "## Red Flags", ...trust.redFlags.map((f) => `- ⚠ ${f}`)] : []),
          ];
          text = truncate(lines.join("\n")).text;
        }
        return { content: [{ type: "text", text }], structuredContent: output };
      } catch (e) {
        return { content: [{ type: "text", text: `Error in get_alternative_details: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
      }
    }
  );

  // ---- Resource: catalog ----
  server.registerResource(
    "catalog",
    "osh://catalog/alternatives",
    {
      title: "Full Alternatives Catalog",
      description: "Complete catalog of paid-tool → open-source alternative pairings (28 entries). Same data the dashboard reads.",
      mimeType: "application/json",
    },
    async (uri) => {
      const pairings = getPairings();
      const text = JSON.stringify({ count: pairings.length, pairings }, null, 2);
      const t = truncate(text);
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: t.text }],
      };
    }
  );

  return server;
}

export async function runMcp() {
  await initEmbeddedPayload();
  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // keep process alive via stdio — no HTTP server needed
  console.error(`◆ OpenSource Hub MCP server v${getPackageVersion()} — stdio ready (4 tools + 1 resource)`);
}

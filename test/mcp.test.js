import test from "node:test";
import assert from "node:assert/strict";
import { buildMcpServer } from "../src/server/mcp.js";

test("MCP server: registers all 4 mandatory tools and catalog resource", async () => {
  const mcp = buildMcpServer();
  assert.ok(mcp, "MCP server instance should be created");

  const registeredTools = Object.keys(mcp._registeredTools);
  assert.ok(registeredTools.includes("search_alternatives"), "exposes search_alternatives tool");
  assert.ok(registeredTools.includes("get_trust_score"), "exposes get_trust_score tool");
  assert.ok(registeredTools.includes("get_trending"), "exposes get_trending tool");
  assert.ok(registeredTools.includes("get_alternative_details"), "exposes get_alternative_details tool");

  const resources = Object.keys(mcp._registeredResources);
  assert.ok(resources.includes("osh://catalog/alternatives"), "exposes catalog resource");
});

test("MCP tool: search_alternatives returns relevant matches with zero error", async () => {
  const mcp = buildMcpServer();
  const handler = mcp._registeredTools.search_alternatives.handler;

  // Search for Notion alternative in json mode
  const result = await handler({ q: "Notion", limit: 5, response_format: "json" });
  assert.ok(result, "result is defined");
  assert.ok(Array.isArray(result.content), "returns content array");
  assert.equal(result.content[0].type, "text");

  const parsed = JSON.parse(result.content[0].text);
  assert.ok(parsed.total > 0, "found matching alternatives for Notion");
  assert.ok(parsed.results.some((r) => r.alternative.name === "AFFiNE" || r.alternative.name === "AppFlowy"));
});

test("MCP tool: get_trust_score calculates multi-signal radar for catalog repo", async () => {
  const mcp = buildMcpServer();
  const handler = mcp._registeredTools.get_trust_score.handler;

  const result = await handler({ repo: "toeverything/AFFiNE", response_format: "json" });
  assert.ok(result);
  const parsed = JSON.parse(result.content[0].text);
  assert.ok(parsed.trust);
  assert.ok(typeof parsed.trust.score === "number");
  assert.ok(parsed.trust.score >= 0 && parsed.trust.score <= 100);
  assert.ok(Array.isArray(parsed.trust.signals));
  assert.ok(parsed.trust.signals.length > 0);
  assert.ok(parsed.trust.appeal, "carries dispute appeal prefill info");
});

test("MCP tool: get_trending returns ranked momentum listings", async () => {
  const mcp = buildMcpServer();
  const handler = mcp._registeredTools.get_trending.handler;

  const result = await handler({ view: "today", limit: 5, response_format: "json" });
  assert.ok(result);
  const parsed = JSON.parse(result.content[0].text);
  assert.equal(parsed.view, "today");
  assert.ok(Array.isArray(parsed.repos));
  assert.ok(parsed.repos.length > 0);
});

test("MCP tool: get_alternative_details returns full spec breakdown", async () => {
  const mcp = buildMcpServer();
  const handler = mcp._registeredTools.get_alternative_details.handler;

  const result = await handler({ repo: "toeverything/AFFiNE", response_format: "json" });
  assert.ok(result);
  const parsed = JSON.parse(result.content[0].text);
  assert.equal(parsed.pairing.alternative.name, "AFFiNE");
  assert.equal(parsed.pairing.paidTool.name, "Notion");
  assert.ok(parsed.pairing.paidTool.pricePerYearUsd > 0);
});

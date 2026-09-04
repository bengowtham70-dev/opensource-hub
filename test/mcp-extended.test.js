import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMcpServer } from "../src/server/mcp.js";

test("buildMcpServer registers extended tools (simulate_hardware, generate_compose_stack, ask_repo)", () => {
  const server = buildMcpServer();
  // McpServer stores registered tools in _registeredTools or tools
  const tools = server._registeredTools;
  assert.ok(tools["search_alternatives"], "search_alternatives must be registered");
  assert.ok(tools["get_trust_score"], "get_trust_score must be registered");
  assert.ok(tools["simulate_hardware"], "simulate_hardware must be registered");
  assert.ok(tools["generate_compose_stack"], "generate_compose_stack must be registered");
  assert.ok(tools["ask_repo"], "ask_repo must be registered");
});

test("simulate_hardware MCP tool evaluates RAM fit and lightweight alternatives", async () => {
  const server = buildMcpServer();
  const tool = server._registeredTools["simulate_hardware"];
  assert.ok(tool);

  const result = await tool.handler({
    tool: "supabase",
    ram_mb: 2048,
    arch: "x86_64",
    response_format: "json",
  });

  assert.ok(result);
  assert.ok(result.content);
  assert.ok(!result.isError);
  const data = result.structuredContent;
  assert.ok(data.verdict);
  assert.ok(data.headroomPct !== undefined);
  assert.ok(Array.isArray(data.swaps));
});

test("generate_compose_stack MCP tool generates conflict-free compose YAML and env vars", async () => {
  const server = buildMcpServer();
  const tool = server._registeredTools["generate_compose_stack"];
  assert.ok(tool);

  const result = await tool.handler({
    tools: ["supabase/supabase", "umami-software/umami"],
    stack_name: "ai-startup",
    response_format: "json",
  });

  assert.ok(result);
  assert.ok(!result.isError);
  const data = result.structuredContent;
  assert.equal(data.stackName, "ai-startup");
  assert.equal(data.services.length, 2);
  assert.ok(data.files["docker-compose.yml"]);
  assert.ok(data.files[".env.example"]);
});

test("ask_repo MCP tool provides technical Q&A via local AST", async () => {
  const server = buildMcpServer();
  const tool = server._registeredTools["ask_repo"];
  assert.ok(tool);

  const result = await tool.handler({
    repo: "supabase/supabase",
    question: "How do I install or run with docker?",
    response_format: "json",
  });

  assert.ok(result);
  assert.ok(!result.isError);
  const data = result.structuredContent;
  assert.ok(data.answer);
  assert.ok(data.source);
});

test("get_trust_score and get_alternative_details fall back to dynamic catalog.db for non-seed repos", async () => {
  const server = buildMcpServer();
  const trustTool = server._registeredTools["get_trust_score"];
  const detailsTool = server._registeredTools["get_alternative_details"];

  // Non-seed repo that exists dynamically in catalog.db
  const trustRes = await trustTool.handler({
    repo: "1Panel-dev/1Panel",
    response_format: "json",
  });
  assert.ok(trustRes);
  assert.ok(!trustRes.isError);
  assert.ok(trustRes.structuredContent.trust.score >= 0);

  const detailsRes = await detailsTool.handler({
    repo: "1Panel-dev/1Panel",
    response_format: "json",
  });
  assert.ok(detailsRes);
  assert.ok(!detailsRes.isError);
  assert.ok(detailsRes.structuredContent.pairing);
});



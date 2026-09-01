#!/usr/bin/env node
import { Command } from "commander";
import { run } from "../src/server/index.js";
import { getPackageVersion } from "../src/server/version.js";
import { initEmbeddedPayload } from "../src/server/repo-files.js";

// plans/PLAN_PHASE2.md Phase 9 — register embedded assets before commander
// reads the version. No-op on npm installs; instant inside Bun binaries.
await initEmbeddedPayload();

const program = new Command();

program
  .name("opensource-hub")
  .description("Find free open-source alternatives to the paid software you use.")
  .version(getPackageVersion())
  .option("-p, --port <number>", "preferred port", "3000")
  .option("--no-open", "do not open the browser automatically")
  .option("--mcp", "run as MCP stdio server for agent clients (PRD §32)")
  .action(async (opts) => {
    if (opts.mcp) {
      const { runMcp } = await import("../src/server/mcp.js");
      await runMcp();
      return;
    }
    await run({
      preferredPort: Number.parseInt(opts.port, 10),
      openBrowser: opts.open,
    });
  });

program.parseAsync();

import test from "node:test";
import assert from "node:assert/strict";
import { evaluateHardware } from "../src/server/hardware.js";
import { createApp } from "../src/server/app.js";
import { setTimeout } from "node:timers/promises";

test("evaluateHardware calculates headroom and detects lightweight fit", () => {
  const result = evaluateHardware({
    ramMb: 1024,
    cpus: 1,
    arch: "x86_64",
    repos: ["pocketbase/pocketbase"],
  });

  assert.equal(result.status, "PERFECT_FIT");
  assert.equal(result.toolBreakdown.length, 1);
  assert.equal(result.toolBreakdown[0].name, "pocketbase");
  assert.equal(result.toolBreakdown[0].idleRamMb, 25);
  // Required: base 200MB + 25MB = 225MB. Headroom: 1024 - 225 = 799MB (78%)
  assert.equal(result.totalRequiredMb, 225);
  assert.equal(result.headroomMb, 799);
  assert.equal(result.headroomPct, 78);
  assert.equal(result.activeSwaps.length, 0);
});

test("evaluateHardware identifies insufficient RAM and recommends lightweight swap", () => {
  const result = evaluateHardware({
    ramMb: 1024,
    cpus: 1,
    arch: "x86_64",
    repos: ["supabase/supabase"],
  });

  assert.equal(result.status, "INSUFFICIENT_RAM");
  assert.equal(result.toolBreakdown[0].idleRamMb, 1536);
  assert.ok(result.headroomMb < 0);
  assert.equal(result.activeSwaps.length, 1);
  assert.equal(result.activeSwaps[0].swap.name, "PocketBase");
  assert.ok(result.activeSwaps[0].swap.ramSavingsMb > 1000);
});

test("GET /api/hardware/evaluate endpoint responds with sizing evaluation", async () => {
  const { app } = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    const res = await fetch(`${base}/api/hardware/evaluate?ram=2048&cpus=2&arch=arm64&repos=usebruno/bruno,pocketbase/pocketbase`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "PERFECT_FIT");
    assert.equal(data.toolBreakdown.length, 2);
    assert.equal(data.arch, "arm64");
  } finally {
    server.close();
    await setTimeout(250);
  }
});

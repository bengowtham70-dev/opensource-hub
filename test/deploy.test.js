import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveSelfHost, deployTargets } from "../src/server/deploy.js";

test("badge derivation: docker → Needs Docker; web-only → Hosted app; self-host → sysadmin", () => {
  assert.equal(deriveSelfHost({ platforms: ["self-host", "web"], ecosystems: { docker: "penpot/app" } }).label, "Needs Docker");
  assert.equal(deriveSelfHost({ platforms: ["web"] }).label, "Hosted app");
  assert.equal(deriveSelfHost({ platforms: ["self-host", "win"] }).label, "Needs a sysadmin");
  assert.equal(deriveSelfHost({ platforms: ["win", "mac"] }), null);
});

test("deploy targets: Railway needs docker; Vercel needs web; Render never (verified cut)", () => {
  const both = deployTargets({ platforms: ["self-host", "web"], ecosystems: { docker: "x/y" } });
  assert.deepEqual(both.map((t) => t.name), ["Railway", "Vercel"]);

  const dockerOnly = deployTargets({ platforms: ["self-host"], ecosystems: { docker: "x/y" } });
  assert.deepEqual(dockerOnly.map((t) => t.name), ["Railway"]);

  const webOnly = deployTargets({ platforms: ["web"] });
  assert.deepEqual(webOnly.map((t) => t.name), ["Vercel"]);

  const none = deployTargets({ platforms: ["win"] });
  assert.equal(none.length, 0);
});

test("deploy URLs are the verified 2026 official patterns with repo encoded", () => {
  const targets = deployTargets({ platforms: ["self-host", "web"], ecosystems: { docker: "x/y" } });
  const railway = targets.find((t) => t.name === "Railway").url("owner/repo");
  assert.ok(railway.startsWith("https://railway.com/new/template?template="));
  assert.ok(railway.includes(encodeURIComponent("https://github.com/owner/repo")));
  const vercel = targets.find((t) => t.name === "Vercel").url("owner/repo");
  assert.ok(vercel.startsWith("https://vercel.com/new/clone?repository-url="));
  assert.ok(vercel.includes(encodeURIComponent("https://github.com/owner/repo")));
});

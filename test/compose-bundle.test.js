import { test } from "node:test";
import assert from "node:assert/strict";
import { generateComposeBundle } from "../src/server/compose-bundle.js";

test("generates multi-service compose bundle with resolved ports and files", () => {
  const bundle = generateComposeBundle({
    tools: ["supabase/supabase", "umami-software/umami", "dani-garcia/vaultwarden"],
    stackName: "startup-stack",
  });

  assert.ok(bundle.ok);
  assert.equal(bundle.stackName, "startup-stack");
  assert.equal(bundle.services.length, 3);

  // Check all required bundle files
  assert.ok(bundle.files["docker-compose.yml"]);
  assert.ok(bundle.files[".env.example"]);
  assert.ok(bundle.files["start.sh"]);
  assert.ok(bundle.files["start.ps1"]);
  assert.ok(bundle.files["README.md"]);

  // Verify compose yaml structure
  const yaml = bundle.files["docker-compose.yml"];
  assert.match(yaml, /version: '3\.8'|services:/);
  assert.match(yaml, /networks:/);
  assert.match(yaml, /volumes:/);

  // Verify environment example contains secure secrets
  const env = bundle.files[".env.example"];
  assert.match(env, /_SECRET=|_PASSWORD=/);

  // Verify README has access URLs
  const readme = bundle.files["README.md"];
  assert.match(readme, /http:\/\/localhost:/);
});

test("resolves port collisions between services requesting the same port", () => {
  // Both umami and an imaginary service or nextcloud might conflict
  const bundle = generateComposeBundle({
    tools: ["umami-software/umami", "plausible/analytics"],
  });

  assert.ok(bundle.ok);
  const ports = bundle.services.map((s) => s.port);
  const uniquePorts = new Set(ports);
  assert.equal(ports.length, uniquePorts.size, "All assigned ports must be distinct");
});

test("handles empty tools gracefully", () => {
  const bundle = generateComposeBundle({ tools: [] });
  assert.ok(bundle.ok);
  assert.equal(bundle.services.length, 0);
  assert.ok(bundle.files["docker-compose.yml"]);
});

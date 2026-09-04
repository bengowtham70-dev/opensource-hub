import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allocateServicePorts,
  generateMultiComposeYaml,
  resolveDockerImage,
  generateBashCommand,
  generatePowerShellCommand,
} from "../dashboard/src/lib/compose-generator.js";

test("allocateServicePorts resolves port collisions gracefully", () => {
  const items = [
    { alternative: { repo: "nocodb/nocodb", name: "NocoDB" } },
    { alternative: { repo: "myorg/custom-tool-1", name: "Custom Tool 1" } },
    { alternative: { repo: "myorg/custom-tool-2", name: "Custom Tool 2" } },
  ];

  const allocated = allocateServicePorts(items);
  assert.equal(allocated.length, 3);

  const hostPorts = allocated.map((a) => a.hostPort);
  // All 3 host ports must be distinct
  const uniquePorts = new Set(hostPorts);
  assert.equal(uniquePorts.size, 3, `Expected 3 unique ports, got ${JSON.stringify(hostPorts)}`);

  // First should be 8080, next 8081, next 8082
  assert.equal(hostPorts[0], 8080);
  assert.equal(hostPorts[1], 8081);
  assert.equal(hostPorts[2], 8082);
});

test("allocateServicePorts maps canonical ports for well-known tools", () => {
  const items = [
    { alternative: { repo: "dani-garcia/vaultwarden", name: "Vaultwarden" } },
    { alternative: { repo: "valkey-io/valkey", name: "Valkey" } },
    { alternative: { repo: "umami-software/umami", name: "Umami" } },
    { alternative: { repo: "penpot/penpot", name: "Penpot" } },
  ];

  const allocated = allocateServicePorts(items);
  const byName = Object.fromEntries(allocated.map((a) => [a.serviceName, a.hostPort]));

  assert.equal(byName["vaultwarden"], 8088);
  assert.equal(byName["valkey"], 6379);
  assert.equal(byName["umami"], 3000);
  assert.equal(byName["penpot"], 9001);
});

test("resolveDockerImage honors verified ecosystems.docker coordinates", () => {
  const custom = {
    alternative: {
      repo: "some/repo",
      ecosystems: { docker: "ghcr.io/verified/image:v1.2.3" },
    },
  };
  assert.equal(resolveDockerImage(custom), "ghcr.io/verified/image:v1.2.3");

  const vaultwarden = { alternative: { repo: "dani-garcia/vaultwarden", name: "Vaultwarden" } };
  assert.equal(resolveDockerImage(vaultwarden), "vaultwarden/server:latest");

  const fallback = { alternative: { repo: "owner/coolapp", name: "CoolApp" } };
  assert.equal(resolveDockerImage(fallback), "owner/coolapp:latest");
});

test("generateMultiComposeYaml emits valid YAML with networks and volumes", () => {
  const items = [
    { alternative: { repo: "supabase/supabase", name: "Supabase" } },
    { alternative: { repo: "umami-software/umami", name: "Umami" } },
  ];

  const yaml = generateMultiComposeYaml(items);
  assert.ok(yaml.includes('version: "3.8"'));
  assert.ok(yaml.includes("services:"));
  assert.ok(yaml.includes("networks:\n  osh-network:"));
  assert.ok(yaml.includes("volumes:\n"));
  assert.ok(yaml.includes("supabase_data:"));
  assert.ok(yaml.includes("umami_data:"));
  assert.ok(yaml.includes("restart: unless-stopped"));
});

test("CLI command generators produce runnable scripts", () => {
  const sampleYaml = 'version: "3.8"\nservices:\n  app:\n    image: app:latest';
  const bash = generateBashCommand(sampleYaml);
  assert.ok(bash.includes("mkdir -p my-open-stack"));
  assert.ok(bash.includes("cat << 'EOF' > docker-compose.yml"));
  assert.ok(bash.includes("docker compose up -d"));

  const ps = generatePowerShellCommand(sampleYaml);
  assert.ok(ps.includes("New-Item -ItemType Directory"));
  assert.ok(ps.includes("Out-File -Encoding utf8 docker-compose.yml"));
  assert.ok(ps.includes("docker compose up -d"));
});

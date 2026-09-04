/**
 * Multi-Tool Docker Compose Stack Architect & Deployment Exporter
 * PRD §38 & §31
 *
 * Generates conflict-free, production-ready multi-service stacks complete with
 * port allocation, environment secrets, and cross-platform start scripts.
 */

import crypto from "node:crypto";
import { findPairingByRepo, getPairings } from "./data.js";
import { getRepoByFullName } from "./db.js";

export const CANONICAL_PORTS = {
  postgres: 5432,
  postgresql: 5432,
  supabase: 54321,
  redis: 6379,
  valkey: 6379,
  vaultwarden: 8088,
  bitwarden: 8088,
  nocodb: 8080,
  baserow: 8082,
  penpot: 9001,
  umami: 3000,
  plausible: 8000,
  meilisearch: 7700,
  qdrant: 6333,
  chroma: 8001,
  gitea: 3001,
  forgejo: 3001,
  minio: 9000,
  grafana: 3003,
  metabase: 3004,
  nextcloud: 8085,
  mattermost: 8065,
  zulip: 9991,
  "uptime-kuma": 3005,
  jitsi: 8443,
  affine: 3010,
  appflowy: 8089,
  focalboard: 8002,
  immich: 2283,
  paperless: 8005,
  "stirling-pdf": 8083,
  activepieces: 8084,
  windmill: 8003,
  coolify: 8004,
  seafile: 8086,
  rustdesk: 21116,
};

export function resolveImage(slug) {
  const s = String(slug || "").toLowerCase();
  if (s.includes("vaultwarden")) return "vaultwarden/server:latest";
  if (s.includes("nocodb")) return "nocodb/nocodb:latest";
  if (s.includes("penpot")) return "penpotapp/backend:latest";
  if (s.includes("umami")) return "ghcr.io/umami-software/umami:postgresql-latest";
  if (s.includes("plausible")) return "ghcr.io/plausible/community-edition:latest";
  if (s.includes("valkey")) return "valkey/valkey:latest";
  if (s.includes("supabase")) return "supabase/studio:latest";
  if (s.includes("nextcloud")) return "nextcloud:latest";
  if (s.includes("mattermost")) return "mattermost/mattermost-team-edition:latest";
  if (s.includes("uptime-kuma")) return "louislam/uptime-kuma:1";
  if (s.includes("minio")) return "minio/minio:latest";
  if (s.includes("immich")) return "ghcr.io/immich-app/immich-server:release";
  if (s.includes("meilisearch")) return "getmeili/meilisearch:latest";
  if (s.includes("metabase")) return "metabase/metabase:latest";
  if (s.includes("grafana")) return "grafana/grafana:latest";
  if (s.includes("gitea")) return "gitea/gitea:latest";
  if (s.includes("forgejo")) return "codeberg.org/forgejo/forgejo:latest";
  if (s.includes("affine")) return "ghcr.io/toeverything/affine-self-hosted:latest";
  if (s.includes("activepieces")) return "activepieces/activepieces:latest";

  const parts = s.split("/");
  const repoName = parts[1] || parts[0];
  return `${repoName}:latest`;
}

export function allocatePorts(items) {
  const used = new Set();
  const assignments = [];

  for (const item of items) {
    const slug = (item.name || item.slug || item.repo || "").toLowerCase();
    let preferred = 8080;
    for (const [key, port] of Object.entries(CANONICAL_PORTS)) {
      if (slug.includes(key)) {
        preferred = port;
        break;
      }
    }

    let allocated = preferred;
    while (used.has(allocated)) {
      allocated += 1;
    }
    used.add(allocated);
    assignments.push({ ...item, port: allocated });
  }

  return assignments;
}

export function generateComposeBundle({ tools = [], stackName = "my-opensource-stack" }) {
  const safeStackName = stackName.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "opensource-stack";

  // Resolve tool items
  const resolved = [];
  for (const raw of tools) {
    const slug = typeof raw === "string" ? raw : (raw.repo || raw.slug || "");
    const pairing = findPairingByRepo(slug.toLowerCase());
    let name = slug.split("/")[1] || slug;
    let desc = "";

    if (pairing) {
      name = pairing.alternative.name || name;
      desc = pairing.alternative.description || "";
    } else {
      const dbRepo = getRepoByFullName(slug);
      if (dbRepo) {
        name = dbRepo.name || name;
        desc = dbRepo.description || "";
      }
    }

    resolved.push({
      repo: slug,
      name,
      serviceKey: name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      description: desc,
      image: resolveImage(slug),
    });
  }

  // Allocate collision-free ports
  const services = allocatePorts(resolved);

  // Generate docker-compose.yml
  const yamlLines = [
    `# OpenSource Hub — Multi-Service Stack: ${safeStackName}`,
    `# Generated at: ${new Date().toISOString()}`,
    `# Run with: docker compose up -d`,
    ``,
    `version: '3.8'`,
    ``,
    `services:`,
  ];

  const envVars = [
    `# OpenSource Hub — Environment Configuration for ${safeStackName}`,
    `# Generated at: ${new Date().toISOString()}`,
    `# Copy to .env and adjust variables as needed`,
    ``,
  ];

  const volumeNames = [];

  for (const s of services) {
    const containerPort = CANONICAL_PORTS[s.serviceKey] || 8080;
    const volName = `${s.serviceKey}_data`;
    volumeNames.push(volName);

    const secretKey = `${s.serviceKey.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_SECRET`;
    const randomSecret = crypto.randomBytes(18).toString("hex");
    envVars.push(`${secretKey}=${randomSecret}`);

    yamlLines.push(`  ${s.serviceKey}:`);
    yamlLines.push(`    image: ${s.image}`);
    yamlLines.push(`    container_name: ${safeStackName}-${s.serviceKey}`);
    yamlLines.push(`    restart: unless-stopped`);
    yamlLines.push(`    networks:`);
    yamlLines.push(`      - osh_internal_net`);
    yamlLines.push(`    ports:`);
    yamlLines.push(`      - "\${PORT_${s.serviceKey.toUpperCase()}:-${s.port}}:${containerPort}"`);
    yamlLines.push(`    environment:`);
    yamlLines.push(`      - NODE_ENV=production`);
    yamlLines.push(`      - APP_SECRET=\${${secretKey}}`);
    yamlLines.push(`    volumes:`);
    yamlLines.push(`      - ${volName}:/data`);
    yamlLines.push(`    deploy:`);
    yamlLines.push(`      resources:`);
    yamlLines.push(`        limits:`);
    yamlLines.push(`          memory: 1024M`);
    yamlLines.push(`    healthcheck:`);
    yamlLines.push(`      test: ["CMD-SHELL", "echo 'OK' || exit 1"]`);
    yamlLines.push(`      interval: 30s`);
    yamlLines.push(`      timeout: 10s`);
    yamlLines.push(`      retries: 3`);
    yamlLines.push(``);
  }

  yamlLines.push(`networks:`);
  yamlLines.push(`  osh_internal_net:`);
  yamlLines.push(`    driver: bridge`);
  yamlLines.push(``);

  yamlLines.push(`volumes:`);
  if (volumeNames.length) {
    for (const v of volumeNames) {
      yamlLines.push(`  ${v}:`);
    }
  } else {
    yamlLines.push(`  stack_data:`);
  }

  const composeYaml = yamlLines.join("\n");
  const envExample = envVars.join("\n");

  // Generate start.sh (POSIX)
  const startSh = `#!/usr/bin/env bash
# OpenSource Hub Stack Launcher (${safeStackName})
set -euo pipefail

echo "================================================="
echo "  🚀 Starting OpenSource Hub Deployment Stack"
echo "  Stack: ${safeStackName}"
echo "================================================="

if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Creating from .env.example..."
  cp .env.example .env
fi

echo "📦 Pulling container images..."
docker compose pull

echo "⚡ Starting background services..."
docker compose up -d

echo ""
echo "✅ Stack successfully started!"
echo "Service status:"
docker compose ps
`;

  // Generate start.ps1 (PowerShell)
  const startPs1 = `# OpenSource Hub Stack Launcher (${safeStackName})
$ErrorActionPreference = "Stop"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  🚀 Starting OpenSource Hub Deployment Stack" -ForegroundColor Cyan
Write-Host "  Stack: ${safeStackName}" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

if (-not (Test-Path .env)) {
    Write-Host "⚠️  No .env file found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

Write-Host "📦 Pulling container images..." -ForegroundColor Gray
docker compose pull

Write-Host "⚡ Starting background services..." -ForegroundColor Cyan
docker compose up -d

Write-Host ""
Write-Host "✅ Stack successfully started!" -ForegroundColor Green
docker compose ps
`;

  // Generate README.md runbook
  const readmeLines = [
    `# ${safeStackName.toUpperCase()} — OpenSource Hub Deployment Kit`,
    ``,
    `Production-ready self-hosted multi-container stack generated by OpenSource Hub.`,
    ``,
    `## Deployed Services`,
    `| Service | Repository | Local URL | Container Port |`,
    `| :--- | :--- | :--- | :--- |`,
  ];

  for (const s of services) {
    readmeLines.push(
      `| **${s.name}** | \`${s.repo}\` | [http://localhost:${s.port}](http://localhost:${s.port}) | \`${s.port}\` |`
    );
  }

  readmeLines.push(
    ``,
    `## Quickstart`,
    ``,
    `### Linux / macOS:`,
    `\`\`\`bash`,
    `chmod +x start.sh`,
    `./start.sh`,
    `\`\`\``,
    ``,
    `### Windows PowerShell:`,
    `\`\`\`powershell`,
    `./start.ps1`,
    `\`\`\``,
    ``,
    `### Manual Command:`,
    `\`\`\`bash`,
    `docker compose up -d`,
    `\`\`\``,
    ``,
    `## Managing the Stack`,
    `- **View Logs**: \`docker compose logs -f\``,
    `- **Stop Services**: \`docker compose stop\``,
    `- **Tear Down**: \`docker compose down\``,
    `- **Tear Down & Erase Volumes**: \`docker compose down -v\``
  );

  const readmeMd = readmeLines.join("\n");

  return {
    ok: true,
    stackName: safeStackName,
    services: services.map((s) => ({
      name: s.name,
      repo: s.repo,
      port: s.port,
      url: `http://localhost:${s.port}`,
    })),
    files: {
      "docker-compose.yml": composeYaml,
      ".env.example": envExample,
      "start.sh": startSh,
      "start.ps1": startPs1,
      "README.md": readmeMd,
    },
  };
}

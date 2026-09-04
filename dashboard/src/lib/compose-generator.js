/**
 * Intelligent Multi-Service Docker Compose Generator
 * Resolves port collisions, assigns persistent named volumes, and embeds official image coordinates.
 */

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

export function resolveDockerImage(item) {
  const alt = item?.alternative || item || {};
  if (alt.ecosystems?.docker) {
    const d = alt.ecosystems.docker;
    return d.includes(":") ? d : `${d}:latest`;
  }
  if (alt.dockerImage) {
    const d = alt.dockerImage;
    return d.includes(":") ? d : `${d}:latest`;
  }
  const repo = alt.repo || "";
  const [owner, name] = repo.split("/");
  const slug = (name || alt.name || "").toLowerCase();

  if (slug.includes("vaultwarden")) return "vaultwarden/server:latest";
  if (slug.includes("nocodb")) return "nocodb/nocodb:latest";
  if (slug.includes("penpot")) return "penpotapp/backend:latest";
  if (slug.includes("umami")) return "ghcr.io/umami-software/umami:postgresql-latest";
  if (slug.includes("plausible")) return "ghcr.io/plausible/community-edition:latest";
  if (slug.includes("valkey")) return "valkey/valkey:latest";
  if (slug.includes("supabase")) return "supabase/studio:latest";
  if (slug.includes("nextcloud")) return "nextcloud:latest";
  if (slug.includes("mattermost")) return "mattermost/mattermost-team-edition:latest";
  if (slug.includes("uptime-kuma")) return "louislam/uptime-kuma:1";
  if (slug.includes("minio")) return "minio/minio:latest";
  if (slug.includes("immich")) return "ghcr.io/immich-app/immich-server:release";
  if (slug.includes("meilisearch")) return "getmeili/meilisearch:latest";
  if (slug.includes("paperless")) return "ghcr.io/paperless-ngx/paperless-ngx:latest";
  if (slug.includes("stirling")) return "froodles/s-pdf:latest";

  if (owner && name) {
    return `${owner.toLowerCase()}/${name.toLowerCase()}:latest`;
  }
  return `${slug || "app"}:latest`;
}

export function allocateServicePorts(items = []) {
  const usedHostPorts = new Set();
  const allocated = [];

  for (const item of items) {
    const alt = item?.alternative || item || {};
    const sName = (alt.shortName || alt.name || (alt.repo ? alt.repo.split("/")[1] : "service") || "service")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");

    let basePort = null;
    for (const [key, port] of Object.entries(CANONICAL_PORTS)) {
      if (sName.includes(key) || (alt.repo && alt.repo.toLowerCase().includes(key))) {
        basePort = port;
        break;
      }
    }
    if (!basePort) {
      basePort = alt.defaultPort || 8080;
    }

    const containerPort = basePort;
    let hostPort = basePort;
    while (usedHostPorts.has(hostPort)) {
      hostPort++;
    }
    usedHostPorts.add(hostPort);

    allocated.push({
      serviceName: sName,
      displayName: alt.name || sName,
      repo: alt.repo || "",
      item,
      image: resolveDockerImage(item),
      hostPort,
      containerPort,
      volumeName: `${sName}_data`,
      accessUrl: `http://localhost:${hostPort}`,
    });
  }
  return allocated;
}

export function generateMultiComposeYaml(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return `version: "3.8"\n\nservices:\n  # Select tools from the catalog to generate your Docker Compose stack\n`;
  }

  const services = allocateServicePorts(items);

  let yaml = `version: "3.8"\n\n`;
  yaml += `# OpenSource Hub — Unified Multi-Service Docker Compose Stack\n`;
  yaml += `# Total Services: ${services.length}\n`;
  yaml += `# Generated automatically with collision-free port allocation & persistent storage\n\n`;

  yaml += `services:\n`;

  for (const s of services) {
    yaml += `  ${s.serviceName}:\n`;
    yaml += `    image: ${s.image}\n`;
    yaml += `    container_name: ${s.serviceName}\n`;
    yaml += `    restart: unless-stopped\n`;
    yaml += `    ports:\n`;
    yaml += `      - "${s.hostPort}:${s.containerPort}"\n`;
    yaml += `    environment:\n`;
    yaml += `      - NODE_ENV=production\n`;
    yaml += `      - APP_PORT=${s.containerPort}\n`;
    yaml += `    volumes:\n`;
    yaml += `      - ${s.volumeName}:/var/lib/${s.serviceName}/data\n`;
    yaml += `    networks:\n`;
    yaml += `      - osh-network\n\n`;
  }

  yaml += `networks:\n`;
  yaml += `  osh-network:\n`;
  yaml += `    driver: bridge\n\n`;

  yaml += `volumes:\n`;
  for (const s of services) {
    yaml += `  ${s.volumeName}:\n`;
    yaml += `    driver: local\n`;
  }

  return yaml;
}

export function generateBashCommand(yamlContent) {
  return `mkdir -p my-open-stack && cd my-open-stack
cat << 'EOF' > docker-compose.yml
${yamlContent.trim()}
EOF

docker compose up -d
echo "Stack started! Run 'docker compose ps' to verify running containers."`;
}

export function generatePowerShellCommand(yamlContent) {
  return `New-Item -ItemType Directory -Force -Path my-open-stack; Set-Location my-open-stack
@'
${yamlContent.trim()}
'@ | Out-File -Encoding utf8 docker-compose.yml

docker compose up -d
Write-Host "Stack started! Run 'docker compose ps' to verify running containers." -ForegroundColor Green`;
}

export function generateCasaOsManifest(items = []) {
  const services = allocateServicePorts(items);
  const firstService = services[0] || { serviceName: "app", hostPort: 8080 };

  const appManifest = {
    version: "1.0",
    title: {
      en_us: "OpenSource Hub Stack (" + services.map(s => s.displayName || s.serviceName).join(", ") + ")"
    },
    tagline: {
      en_us: "Self-hosted stack built with OpenSource Hub"
    },
    description: {
      en_us: "Production-ready open-source alternative stack containing: " + services.map(s => `${s.displayName || s.serviceName} (${s.image})`).join(", ")
    },
    icon: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/docker.svg",
    screenshot_link: [],
    author: "OpenSource Hub Community",
    developer: "OpenSource Hub",
    index: `http://localhost:${firstService.hostPort}`,
    services: services.map((s) => ({
      name: s.serviceName,
      image: s.image,
      ports: [
        {
          container: s.containerPort,
          host: s.hostPort,
          type: "tcp"
        }
      ],
      volumes: [
        {
          container: `/var/lib/${s.serviceName}/data`,
          host: `/DATA/AppData/${s.serviceName}`
        }
      ],
      envs: [
        { name: "NODE_ENV", value: "production" },
        { name: "APP_PORT", value: String(s.containerPort) }
      ],
      restart: "unless-stopped"
    }))
  };

  return JSON.stringify(appManifest, null, 2);
}

export function generateUnraidXml(items = []) {
  const services = allocateServicePorts(items);
  const primary = services[0] || { serviceName: "app", displayName: "App", image: "app:latest", hostPort: 8080, containerPort: 8080 };

  let xml = `<?xml version="1.0"?>
<Container version="2">
  <Name>OpenSource-Hub-Stack</Name>
  <Repository>${primary.image}</Repository>
  <Registry>https://hub.docker.com</Registry>
  <Network>bridge</Network>
  <Privileged>false</Privileged>
  <Support>https://opensource-hub.com</Support>
  <Project>https://github.com/bengowtham70/opensource-hub</Project>
  <Overview>Multi-service open-source stack generated by OpenSource Hub. Includes: ${services.map(s => s.displayName || s.serviceName).join(", ")}.</Overview>
  <Category>Cloud: Productivity: Tools:</Category>
  <WebUI>http://[IP]:[PORT:${primary.hostPort}]/</WebUI>
  <Icon>https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/docker.svg</Icon>
  <ExtraParams>--restart unless-stopped</ExtraParams>\n`;

  for (const s of services) {
    xml += `  <Config Name="${s.displayName || s.serviceName} Web Port" Target="${s.containerPort}" Default="${s.hostPort}" Mode="tcp" Description="Host port for ${s.displayName || s.serviceName}" Type="Port" Display="always" Required="true" Mask="false">${s.hostPort}</Config>\n`;
    xml += `  <Config Name="${s.displayName || s.serviceName} Data Storage" Target="/var/lib/${s.serviceName}/data" Default="/mnt/user/appdata/${s.serviceName}" Mode="rw" Description="Persistent data for ${s.displayName || s.serviceName}" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/${s.serviceName}</Config>\n`;
  }

  xml += `</Container>`;
  return xml;
}

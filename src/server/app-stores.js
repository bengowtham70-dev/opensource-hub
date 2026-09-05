// PRD §31 — Self-hosting platform app stores & container distribution
// Generates official, verified app store packages for UmbrelOS, Runtipi, CasaOS, and Unraid
// from catalog metadata with zero external dependencies.

import { createZipArchive } from "./migration-kit.js";
import { getPairings } from "./data.js";

// Canonical port allocations to avoid collision
const CANONICAL_PORTS = {
  "supabase/supabase": 8000,
  "usebruno/bruno": 3000,
  "toeverything/affine": 3010,
  "penpot/penpot": 9001,
  "pocketbase/pocketbase": 8090,
  "mattermost/mattermost": 8065,
  "nocodb/nocodb": 8080,
  "umami-software/umami": 3000,
  "makeplane/plane": 8095,
  "signoz/signoz": 3301,
  "teableio/teable": 3000,
  "plausible/analytics": 8000,
  "dani-garcia/vaultwarden": 8080,
  "immich-app/immich": 2283,
  "nextcloud/server": 8080,
  "meilisearch/meilisearch": 7700,
  "ghost": 2368,
  "grafana/grafana": 3000,
};

const DOCKER_IMAGES = {
  "supabase/supabase": "supabase/postgres:15.1.0.117",
  "usebruno/bruno": "usebruno/bruno:latest",
  "toeverything/affine": "toeverything/affine:stable",
  "penpot/penpot": "penpotapp/frontend:latest",
  "pocketbase/pocketbase": "ghcr.io/muchobien/pocketbase:latest",
  "mattermost/mattermost": "mattermost/mattermost-team-edition:latest",
  "nocodb/nocodb": "nocodb/nocodb:latest",
  "umami-software/umami": "ghcr.io/umami-software/umami:postgresql-latest",
  "makeplane/plane": "makeplane/plane-frontend:latest",
  "signoz/signoz": "signoz/frontend:latest",
  "teableio/teable": "teable/teable:latest",
  "plausible/analytics": "ghcr.io/plausible/community-edition:latest",
  "dani-garcia/vaultwarden": "vaultwarden/server:latest",
  "immich-app/immich": "ghcr.io/immich-app/immich-server:release",
  "nextcloud/server": "nextcloud:stable",
  "meilisearch/meilisearch": "getmeili/meilisearch:latest",
  "grafana/grafana": "grafana/grafana:latest",
};

export function getEligibleAppStoreApps() {
  const list = [];
  const seen = new Set();
  const pairings = getPairings();

  for (const p of pairings) {
    const repo = (p.alternative?.repo || "").toLowerCase();
    if (!repo || seen.has(repo)) continue;
    seen.add(repo);

    const slug = repo.split("/")[1] || repo;
    const dockerImg =
      p.alternative?.ecosystems?.docker ||
      DOCKER_IMAGES[repo] ||
      `${slug}/${slug}:latest`;

    const port = CANONICAL_PORTS[repo] || 8080;

    list.push({
      id: slug,
      repo,
      name: p.alternative.name || slug,
      replaces: p.paidTool?.name || "Proprietary SaaS",
      category: p.paidTool?.category || "Developer Tools",
      description: p.alternative.description || `Open-source alternative to ${p.paidTool?.name}`,
      tagline: `Free open-source alternative to ${p.paidTool?.name}`,
      developer: repo.split("/")[0] || "OpenSource",
      website: `https://github.com/${repo}`,
      image: dockerImg,
      port,
      parity: p.parity || 90,
      license: p.alternative.license?.spdx || "Open Source",
    });
  }

  return list;
}

export function generateUmbrelAppStoreYaml() {
  return `name: "OpenSource Hub Community Store"
description: "The trusted open-source alternatives directory and 1-click home server app store."
icon: "https://raw.githubusercontent.com/bengowtham70-dev/opensource-hub/main/landing-page/assets/logo.svg"
submitter: "OpenSource Hub Community"
submission: "https://github.com/bengowtham70-dev/opensource-hub"
`;
}

export function generateUmbrelAppManifest(app) {
  return `manifestVersion: 1
id: "${app.id}"
name: "${app.name}"
tagline: "${app.tagline}"
description: "${app.description.replace(/"/g, "'")}"
category: "${app.category}"
version: "1.0.0"
port: ${app.port}
developer: "${app.developer}"
website: "${app.website}"
repo: "${app.website}"
support: "${app.website}/issues"
submitter: "OpenSource Hub"
submission: "https://github.com/bengowtham70-dev/opensource-hub"
gallery:
  - "https://raw.githubusercontent.com/bengowtham70-dev/opensource-hub/main/landing-page/assets/logo.svg"
`;
}

export function generateUmbrelCompose(app) {
  return `version: "3.7"

services:
  app:
    image: "${app.image}"
    restart: on-failure
    stop_grace_period: 1m
    ports:
      - "${app.port}:${app.port}"
    volumes:
      - \${APP_DATA_DIR}/data:/data
    environment:
      - NODE_ENV=production
      - PORT=${app.port}
`;
}

export function generateRuntipiConfig(app) {
  return JSON.stringify(
    {
      name: app.name,
      id: app.id,
      available: true,
      port: app.port,
      categories: [app.category],
      description: app.description,
      shortDesc: `Open-source replacement for ${app.replaces}`,
      author: app.developer,
      source: app.website,
      form_fields: [],
    },
    null,
    2
  );
}

export function generateRuntipiAppData(app) {
  return JSON.stringify(
    {
      id: app.id,
      version: "1.0.0",
      scheme: "http",
      forcePort: false,
    },
    null,
    2
  );
}

export function generateCasaOsAppJson(app) {
  return JSON.stringify(
    {
      version: "1.0",
      title: { en_us: app.name },
      tagline: { en_us: app.tagline },
      description: { en_us: app.description },
      icon: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/docker.svg",
      screenshot_link: [],
      author: app.developer,
      index: `http://localhost:${app.port}`,
      services: [
        {
          name: app.id,
          image: app.image,
          ports: [{ container: app.port, host: app.port, type: "tcp" }],
          volumes: [{ container: "/data", host: `/DATA/AppData/${app.id}` }],
          envs: [{ name: "NODE_ENV", value: "production" }],
          restart: "unless-stopped",
        },
      ],
    },
    null,
    2
  );
}

export function generateUnraidAppXml(app) {
  return `<?xml version="1.0"?>
<Container version="2">
  <Name>${app.name}</Name>
  <Repository>${app.image}</Repository>
  <Registry>https://hub.docker.com</Registry>
  <Network>bridge</Network>
  <Privileged>false</Privileged>
  <Support>${app.website}/issues</Support>
  <Project>${app.website}</Project>
  <Overview>${app.description}</Overview>
  <Category>${app.category}</Category>
  <WebUI>http://[IP]:[PORT:${app.port}]/</WebUI>
  <Icon>https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/docker.svg</Icon>
  <ExtraParams>--restart unless-stopped</ExtraParams>
  <Config Name="Web Port" Target="${app.port}" Default="${app.port}" Mode="tcp" Description="Host port for ${app.name}" Type="Port" Display="always" Required="true" Mask="false">${app.port}</Config>
  <Config Name="AppData" Target="/data" Default="/mnt/user/appdata/${app.id}" Mode="rw" Description="Persistent data for ${app.name}" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/${app.id}</Config>
</Container>`;
}

export function generateAppStoreFiles(platform = "umbrel") {
  const apps = getEligibleAppStoreApps();
  const files = {};

  if (platform === "umbrel") {
    files["umbrel-app-store.yml"] = generateUmbrelAppStoreYaml();
    for (const app of apps) {
      files[`apps/${app.id}/umbrel-app.yml`] = generateUmbrelAppManifest(app);
      files[`apps/${app.id}/docker-compose.yml`] = generateUmbrelCompose(app);
    }
  } else if (platform === "runtipi") {
    for (const app of apps) {
      files[`apps/${app.id}/config.json`] = generateRuntipiConfig(app);
      files[`apps/${app.id}/app-data.json`] = generateRuntipiAppData(app);
      files[`apps/${app.id}/docker-compose.yml`] = generateUmbrelCompose(app);
    }
  } else if (platform === "casaos") {
    for (const app of apps) {
      files[`apps/${app.id}/casaos-app.json`] = generateCasaOsAppJson(app);
    }
  } else if (platform === "unraid") {
    for (const app of apps) {
      files[`templates/${app.id}.xml`] = generateUnraidAppXml(app);
    }
  }

  return files;
}

export function buildAppStoreZip(platform = "umbrel") {
  const files = generateAppStoreFiles(platform);
  return createZipArchive(files);
}

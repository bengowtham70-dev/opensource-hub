// PRD Phase 2 / plans/PLAN_PHASE2.md Phase 1 — Catalog Schema v2 migration.
// Idempotent: deterministic enrichment map keyed by paidTool.slug; re-running
// yields byte-identical output for unchanged input maps.
//
// License provenance: SPDX ids verified via api.github.com/repos/{repo} on
// 2026-08-24 (scripts/license-verify.json). NOASSERTION repos resolved by
// reading the actual LICENSE files (scripts/inspect-licenses*.mjs):
//   AFFiNE=MIT(core) · GIMP=GPL-3.0-or-later · Inkscape=GPL-3.0-or-later
//   KeePassXC=GPL-3.0-or-later · Bitwarden clients=GPL-3.0(default)
//   Focalboard=AGPL-3.0(source) · NocoDB=AGPL-3.0 · Metabase=AGPL-3.0(OSS ed.)
//   authentik=MIT(core) · Joplin=AGPL-3.0-or-later
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, "../src/data/alternatives.json");

// platforms: where the ALTERNATIVE runs · relationship/goalTags: pairing-level
const ENRICHMENT = {
  notion: {
    relationship: "partial",
    goalTags: ["replace-notion"],
    platforms: ["win", "mac", "linux", "web", "self-host"],
    license: { spdx: "MIT", type: "permissive" },
    demoUrl: "https://app.affine.pro",
    ecosystems: {},
  },
  postman: {
    relationship: "direct",
    goalTags: ["replace-postman"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "MIT", type: "permissive" },
    ecosystems: {},
  },
  figma: {
    relationship: "direct",
    goalTags: ["replace-figma"],
    platforms: ["web", "self-host"],
    license: { spdx: "MPL-2.0", type: "copyleft" },
    demoUrl: "https://design.penpot.app",
    ecosystems: { docker: "penpot/app" },
  },
  slack: {
    relationship: "direct",
    goalTags: ["replace-slack"],
    platforms: ["win", "mac", "linux", "web", "self-host"],
    license: { spdx: "Apache-2.0", type: "permissive" },
    demoUrl: "https://chat.zulip.org",
    ecosystems: {},
  },
  "microsoft-365": {
    relationship: "direct",
    goalTags: ["replace-microsoft-office"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "MPL-2.0", type: "copyleft" },
    ecosystems: {},
  },
  photoshop: {
    relationship: "partial",
    goalTags: ["replace-photoshop"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "GPL-3.0-or-later", type: "copyleft" },
    ecosystems: {},
  },
  illustrator: {
    relationship: "direct",
    goalTags: ["replace-illustrator"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "GPL-3.0-or-later", type: "copyleft" },
    ecosystems: {},
  },
  dropbox: {
    relationship: "partial",
    goalTags: ["replace-dropbox"],
    platforms: ["win", "mac", "linux", "web", "self-host"],
    license: { spdx: "AGPL-3.0", type: "network-copyleft" },
    demoUrl: "https://try.nextcloud.com",
    ecosystems: { docker: "nextcloud" },
  },
  "1password": {
    relationship: "direct",
    goalTags: ["replace-password-manager"],
    platforms: ["win", "mac", "linux", "web", "self-host"],
    license: { spdx: "GPL-3.0", type: "copyleft" },
    demoUrl: "https://vault.bitwarden.com",
    ecosystems: {},
  },
  lastpass: {
    relationship: "direct",
    goalTags: ["replace-password-manager"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "GPL-3.0-or-later", type: "copyleft" },
    ecosystems: {},
  },
  zoom: {
    relationship: "direct",
    goalTags: ["replace-zoom"],
    platforms: ["web", "self-host"],
    license: { spdx: "Apache-2.0", type: "permissive" },
    demoUrl: "https://meet.jit.si",
    ecosystems: { docker: "jitsi/web" },
  },
  trello: {
    relationship: "partial",
    goalTags: ["replace-trello"],
    platforms: ["win", "mac", "linux", "self-host"],
    license: { spdx: "AGPL-3.0", type: "network-copyleft" },
    ecosystems: { docker: "mattermost/focalboard" },
  },
  asana: {
    relationship: "partial",
    goalTags: ["replace-asana"],
    platforms: ["web", "self-host"],
    license: { spdx: "AGPL-3.0", type: "network-copyleft" },
    demoUrl: "https://app.plane.so",
    ecosystems: {},
  },
  monday: {
    relationship: "direct",
    goalTags: ["replace-monday", "replace-trello"],
    platforms: ["web", "self-host"],
    license: { spdx: "MIT", type: "permissive" },
    ecosystems: { docker: "wekanteam/wekan" },
  },
  airtable: {
    relationship: "direct",
    goalTags: ["replace-airtable"],
    platforms: ["web", "self-host"],
    license: { spdx: "AGPL-3.0", type: "network-copyleft" },
    demoUrl: "https://app.nocodb.com",
    ecosystems: { docker: "nocodb/nocodb" },
  },
  miro: {
    relationship: "direct",
    goalTags: ["replace-miro"],
    platforms: ["web", "self-host"],
    license: { spdx: "MIT", type: "permissive" },
    demoUrl: "https://excalidraw.com",
    ecosystems: {},
  },
  grammarly: {
    relationship: "direct",
    goalTags: ["replace-grammarly"],
    platforms: ["win", "mac", "linux", "web", "self-host"],
    license: { spdx: "LGPL-2.1", type: "copyleft" },
    demoUrl: "https://languagetool.org",
    ecosystems: {},
  },
  "premiere-pro": {
    relationship: "direct",
    goalTags: ["replace-video-editor"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "GPL-3.0", type: "copyleft" },
    ecosystems: {},
  },
  tableau: {
    relationship: "partial",
    goalTags: ["replace-tableau"],
    platforms: ["web", "self-host"],
    license: { spdx: "AGPL-3.0", type: "network-copyleft" },
    demoUrl: "https://demo.metabase.com",
    ecosystems: { docker: "metabase/metabase" },
  },
  firebase: {
    relationship: "direct",
    goalTags: ["replace-firebase"],
    platforms: ["web", "self-host"],
    license: { spdx: "Apache-2.0", type: "permissive" },
    ecosystems: {},
  },
  auth0: {
    relationship: "direct",
    goalTags: ["replace-auth-provider"],
    platforms: ["self-host"],
    license: { spdx: "MIT", type: "permissive" },
    ecosystems: { docker: "goauthentik/server" },
  },
  heroku: {
    relationship: "direct",
    goalTags: ["replace-heroku"],
    platforms: ["self-host"],
    license: { spdx: "Apache-2.0", type: "permissive" },
    ecosystems: { docker: "coollabsio/coolify" },
  },
  todoist: {
    relationship: "direct",
    goalTags: ["replace-todoist"],
    platforms: ["win", "mac", "linux", "web", "self-host"],
    license: { spdx: "AGPL-3.0", type: "network-copyleft" },
    demoUrl: "https://try.vikunja.io",
    ecosystems: { docker: "vikunja/vikunja" },
  },
  spotify: {
    relationship: "partial",
    goalTags: ["replace-spotify"],
    platforms: ["win", "mac", "linux", "self-host"],
    license: { spdx: "GPL-3.0", type: "copyleft" },
    ecosystems: { docker: "deluan/navidrome" },
  },
  jira: {
    relationship: "direct",
    goalTags: ["replace-jira"],
    platforms: ["web", "self-host"],
    license: { spdx: "GPL-3.0", type: "copyleft" },
    ecosystems: { docker: "openproject/openproject" },
  },
  evernote: {
    relationship: "direct",
    goalTags: ["replace-evernote"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "AGPL-3.0-or-later", type: "network-copyleft" },
    ecosystems: { npm: "joplin" },
  },
  lightroom: {
    relationship: "direct",
    goalTags: ["replace-lightroom"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "GPL-3.0", type: "copyleft" },
    ecosystems: {},
  },
  "docker-desktop": {
    relationship: "direct",
    goalTags: ["replace-docker-desktop"],
    platforms: ["win", "mac", "linux"],
    license: { spdx: "Apache-2.0", type: "permissive" },
    ecosystems: {},
  },
};

function migrate() {
  const catalog = JSON.parse(fs.readFileSync(target, "utf8"));
  let missing = [];

  catalog.pairings = catalog.pairings.map((pairing) => {
    const key = pairing.paidTool.slug;
    const rule = ENRICHMENT[key];
    if (!rule) {
      missing.push(key);
      return pairing;
    }
    return {
      ...pairing,
      relationship: rule.relationship,
      goalTags: [...rule.goalTags],
      alternative: {
        ...pairing.alternative,
        platforms: [...rule.platforms],
        license: { ...rule.license },
        ...(rule.demoUrl ? { demoUrl: rule.demoUrl } : {}),
        ecosystems: { ...rule.ecosystems },
        // Preserve fetched/curated media — re-running the migration after
        // scripts/fetch-screenshots.mjs must never wipe real screenshots.
        screenshots: Array.isArray(pairing.alternative.screenshots)
          ? pairing.alternative.screenshots
          : [],
      },
    };
  });

  if (missing.length > 0) {
    console.error(`FAIL: no enrichment rule for: ${missing.join(", ")}`);
    process.exit(1);
  }

  catalog.version = 2;
  catalog.$comment =
    "Seed tool-to-alternative pairings per PRD section 19. Schema v2 adds platforms/license/" +
    "relationship/goalTags/screenshots/ecosystems/demoUrl (plans/PLAN_PHASE2.md Phase 1). " +
    "pricePerYearUsd = typical list price, annual billing, per user where applicable — estimates, labeled in UI. " +
    "SPDX ids verified against GitHub API / LICENSE files 2026-08-24.";
  fs.writeFileSync(target, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`migrated ${catalog.pairings.length} pairings to schema v2`);
}

migrate();

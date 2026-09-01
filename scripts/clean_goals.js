import fs from "node:fs";
import path from "node:path";

const ALTERNATIVES_PATH = path.resolve("src/data/alternatives.json");
const data = JSON.parse(fs.readFileSync(ALTERNATIVES_PATH, "utf8"));

const goalMap = {
  "AppFlowy-IO/AppFlowy": ["replace-notion-appflowy"],
  "n8n-io/n8n": ["replace-zapier"],
  "rustdesk/rustdesk": ["replace-teamviewer"],
  "grafana/grafana": ["replace-datadog-grafana"],
  "strapi/strapi": ["replace-contentful"],
  "apache/superset": ["replace-tableau"],
  "TryGhost/Ghost": ["replace-substack"],
  "appwrite/appwrite": ["replace-firebase"],
  "meilisearch/meilisearch": ["replace-algolia"],
  "VSCodium/vscodium": ["replace-cursor"],
  "dani-garcia/vaultwarden": ["replace-1password-vaultwarden"],
  "PostHog/posthog": ["replace-mixpanel"],
  "umami-software/umami": ["replace-google-analytics"],
  "documenso/documenso": ["replace-docusign"],
  "bram2w/baserow": ["replace-airtable-baserow"],
  "saleor/saleor": ["replace-shopify-saleor"],
  "knadh/listmonk": ["replace-mailchimp-listmonk"],
  "zadam/trilium": ["replace-evernote-trilium"],
  "taigaio/taiga-back": ["replace-jira-taiga"],
  "valkey-io/valkey": ["replace-redis-enterprise"]
};

for (const p of data.pairings) {
  if (goalMap[p.alternative.repo]) {
    p.goalTags = goalMap[p.alternative.repo];
  }
}

fs.writeFileSync(ALTERNATIVES_PATH, JSON.stringify(data, null, 2), "utf8");
console.log("Cleaned goal tags successfully");

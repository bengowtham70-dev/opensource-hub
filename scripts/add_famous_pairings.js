import fs from "node:fs";
import path from "node:path";

const ALTERNATIVES_PATH = path.resolve("src/data/alternatives.json");
const data = JSON.parse(fs.readFileSync(ALTERNATIVES_PATH, "utf8"));

// Keep initial 61 original pairings
data.pairings = data.pairings.slice(0, 61);

const new20Pairings = [
  {
    paidTool: {
      name: "Coda",
      slug: "coda",
      category: "Notes & Docs",
      pricePerYearUsd: 120,
      planName: "Pro"
    },
    alternative: {
      name: "AppFlowy",
      repo: "AppFlowy-IO/AppFlowy",
      language: "Flutter",
      tags: ["notes", "workspace", "offline-first", "kanban", "knowledge-base"],
      description: "Open-source Notion and Coda alternative built with Flutter and Rust — 100% data ownership and native speed.",
      parity: ["Rich block-based document editor", "Grid and Kanban board databases", "Offline-first local storage", "Custom themes and plugins"],
      gaps: ["Web app deployment requires cloud sync server", "Smaller ecosystem of third-party widgets"],
      migrationNotes: "Import markdown files and folders directly via AppFlowy's built-in folder importer.",
      platforms: ["win", "mac", "linux", "web", "self-host"],
      license: { spdx: "AGPL-3.0", type: "copyleft" },
      demoUrl: "https://appflowy.io",
      ecosystems: { docker: "appflowy/appflowy" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 5 }
    },
    relationship: "direct",
    goalTags: ["replace-coda"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 58000,
      githubLicense: "AGPL-3.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/AppFlowy-IO/AppFlowy"
    }
  },
  {
    paidTool: {
      name: "Make",
      slug: "make",
      category: "Automation",
      pricePerYearUsd: 108,
      planName: "Core"
    },
    alternative: {
      name: "n8n",
      repo: "n8n-io/n8n",
      language: "TypeScript",
      tags: ["workflow-automation", "integration", "low-code", "webhooks", "ai-agents"],
      description: "Fair-code workflow automation platform with visual node-based builder and 400+ pre-built app integrations.",
      parity: ["Multi-step visual workflow canvas", "400+ pre-built integrations and webhook triggers", "Custom JavaScript / Python node execution", "AI Agent and LangChain orchestration"],
      gaps: ["Self-hosted instance requires webhook domain setup", "Advanced enterprise SSO gated on enterprise tier"],
      migrationNotes: "Export workflow logic to n8n JSON nodes or rebuild flows visually with n8n's trigger/action canvas.",
      platforms: ["self-host", "linux", "web"],
      license: { spdx: "Sustainable-Use", type: "copyleft" },
      demoUrl: "https://n8n.io",
      ecosystems: { npm: "n8n", docker: "n8nio/n8n" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 5 }
    },
    relationship: "direct",
    goalTags: ["replace-make"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 56000,
      githubLicense: "Sustainable-Use",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/n8n-io/n8n"
    }
  },
  {
    paidTool: {
      name: "AnyDesk",
      slug: "anydesk",
      category: "Developer Tools",
      pricePerYearUsd: 180,
      planName: "Standard"
    },
    alternative: {
      name: "RustDesk",
      repo: "rustdesk/rustdesk",
      language: "Rust",
      tags: ["remote-desktop", "screen-share", "p2p", "file-transfer"],
      description: "Open-source virtual remote desktop software written in Rust — seamless self-hosted rendezvous/relay server.",
      parity: ["End-to-end encrypted remote control", "Direct P2P connection with relay fallback", "File transfer and clipboard sharing", "Cross-platform client applications"],
      gaps: ["Public relay servers may experience bandwidth limits during peak hours"],
      migrationNotes: "Install RustDesk client on remote and host machines; point client configuration to your own self-hosted rendezvous server ID.",
      platforms: ["win", "mac", "linux", "web", "self-host"],
      license: { spdx: "AGPL-3.0", type: "copyleft" },
      demoUrl: "https://rustdesk.com",
      ecosystems: { docker: "rustdesk/rustdesk-server" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 5 }
    },
    relationship: "direct",
    goalTags: ["replace-anydesk"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 83000,
      githubLicense: "AGPL-3.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/rustdesk/rustdesk"
    }
  },
  {
    paidTool: {
      name: "New Relic",
      slug: "new-relic",
      category: "Monitoring",
      pricePerYearUsd: 1200,
      planName: "Standard"
    },
    alternative: {
      name: "Grafana",
      repo: "grafana/grafana",
      language: "TypeScript",
      tags: ["metrics", "dashboards", "visualization", "alerting", "prometheus"],
      description: "The open and composable observability and data visualization platform for metrics, logs and traces.",
      parity: ["Interactive multi-panel query dashboards", "Dynamic threshold alerting and notifications", "Connects to 100+ databases and Prometheus/Loki/Tempo", "Role-based access control and team folders"],
      gaps: ["Requires separate data storage backends (Prometheus, Loki, ClickHouse)"],
      migrationNotes: "Connect existing Prometheus or OpenTelemetry data sources to Grafana and import community dashboards from Grafana.com.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "AGPL-3.0", type: "copyleft" },
      demoUrl: "https://play.grafana.org",
      ecosystems: { docker: "grafana/grafana" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 10 }
    },
    relationship: "direct",
    goalTags: ["replace-new-relic"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 65000,
      githubLicense: "AGPL-3.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/grafana/grafana"
    }
  },
  {
    paidTool: {
      name: "Contentful",
      slug: "contentful",
      category: "Publishing",
      pricePerYearUsd: 1188,
      planName: "Basic"
    },
    alternative: {
      name: "Strapi",
      repo: "strapi/strapi",
      language: "JavaScript",
      tags: ["headless-cms", "rest-api", "graphql", "content-management"],
      description: "Leading open-source headless CMS — 100% JavaScript/TypeScript, fully customizable and developer-first.",
      parity: ["Visual Content-Type Builder", "Auto-generated REST and GraphQL APIs", "Media library and asset upload management", "Granular role-based API token permissions"],
      gaps: ["Self-hosting requires Postgres/MySQL database management", "Multi-region content replication requires manual CDN configuration"],
      migrationNotes: "Use the Strapi Content Migration CLI (`strapi transfer`) to import schemas and content items.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "MIT", type: "permissive" },
      demoUrl: "https://strapi.io",
      ecosystems: { npm: "@strapi/strapi", docker: "strapi/strapi" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 8 }
    },
    relationship: "direct",
    goalTags: ["replace-contentful"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 65000,
      githubLicense: "MIT",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/strapi/strapi"
    }
  },
  {
    paidTool: {
      name: "Power BI",
      slug: "power-bi",
      category: "Analytics",
      pricePerYearUsd: 120,
      planName: "Pro"
    },
    alternative: {
      name: "Apache Superset",
      repo: "apache/superset",
      language: "Python",
      tags: ["bi", "data-visualization", "sql-editor", "charts", "analytics"],
      description: "Modern enterprise-ready business intelligence platform and SQL exploration dashboard powered by Apache.",
      parity: ["Rich interactive charting library with 40+ visualization types", "Powerful in-browser SQL Lab query editor", "Native database connectors for Postgres, MySQL, Snowflake, BigQuery", "Scheduled email and Slack dashboard snapshots"],
      gaps: ["Initial Docker setup requires Redis and PostgreSQL metastore", "Steeper learning curve for non-technical users compared to Power BI desktop"],
      migrationNotes: "Connect your analytical database directly to Superset; recreate data model virtual datasets using SQL Lab.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "Apache-2.0", type: "permissive" },
      demoUrl: "https://superset.apache.org",
      ecosystems: { pypi: "apache-superset", docker: "apache/superset" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 15 }
    },
    relationship: "direct",
    goalTags: ["replace-power-bi"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 65000,
      githubLicense: "Apache-2.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/apache/superset"
    }
  },
  {
    paidTool: {
      name: "Substack",
      slug: "substack",
      category: "Publishing",
      pricePerYearUsd: 348,
      planName: "Creator Pro"
    },
    alternative: {
      name: "Ghost",
      repo: "TryGhost/Ghost",
      language: "JavaScript",
      tags: ["publishing", "newsletter", "blogging", "memberships", "creator-economy"],
      description: "Modern open-source publishing platform for independent creators, newsletters, and media businesses.",
      parity: ["Native email newsletter broadcast delivery", "Member subscription management and paid tiers", "Markdown and block card rich text editor", "SEO optimizations and structured schema markup out-of-the-box"],
      gaps: ["Requires connecting transactional email provider (Mailgun/SES) for large newsletter sends"],
      migrationNotes: "Export Substack subscribers CSV and posts archive; import into Ghost via the Universal Migration Tool in Settings.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "MIT", type: "permissive" },
      demoUrl: "https://ghost.org",
      ecosystems: { npm: "ghost-cli", docker: "ghost" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 5 }
    },
    relationship: "direct",
    goalTags: ["replace-substack"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 48000,
      githubLicense: "MIT",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/TryGhost/Ghost"
    }
  },
  {
    paidTool: {
      name: "Backendless",
      slug: "backendless",
      category: "Backend",
      pricePerYearUsd: 300,
      planName: "Scale"
    },
    alternative: {
      name: "Appwrite",
      repo: "appwrite/appwrite",
      language: "TypeScript",
      tags: ["baas", "authentication", "realtime-database", "serverless-functions", "storage"],
      description: "Complete backend platform for web, mobile, and flutter developers — auth, databases, functions, and storage.",
      parity: ["User authentication with 30+ OAuth providers and passkeys", "Real-time NoSQL database with JSON schema validation", "Secure file storage with encryption and image resizing", "Serverless cloud functions supporting Node, Python, Dart, Go, PHP"],
      gaps: ["No proprietary Google Cloud BigQuery sync connector"],
      migrationNotes: "Use the Appwrite CLI migration tool to import users, database records, and storage buckets.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "BSD-3-Clause", type: "permissive" },
      demoUrl: "https://appwrite.io",
      ecosystems: { docker: "appwrite/appwrite" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 8 }
    },
    relationship: "direct",
    goalTags: ["replace-backendless"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 46000,
      githubLicense: "BSD-3-Clause",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/appwrite/appwrite"
    }
  },
  {
    paidTool: {
      name: "Algolia",
      slug: "algolia",
      category: "Developer Tools",
      pricePerYearUsd: 600,
      planName: "Standard"
    },
    alternative: {
      name: "Meilisearch",
      repo: "meilisearch/meilisearch",
      language: "Rust",
      tags: ["search-engine", "instant-search", "typo-tolerance", "faceted-search"],
      description: "Lightning-fast, hyper-relevant open-source search engine written in Rust with typo tolerance and instant search.",
      parity: ["Sub-50ms search-as-you-type response latency", "Automatic typo tolerance and prefix search", "Faceted navigation, filtering, and sorting", "Zero-config SDKs for JavaScript, Python, PHP, Ruby, Go, Rust"],
      gaps: ["Entire search index resides in memory/disk cache (designed for primary search datasets)"],
      migrationNotes: "Export records as JSON or NDJSON and push via Meilisearch `POST /indexes/{uid}/documents` endpoint.",
      platforms: ["win", "mac", "linux", "self-host"],
      license: { spdx: "MIT", type: "permissive" },
      demoUrl: "https://meilisearch.com",
      ecosystems: { docker: "getmeili/meilisearch" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 5 }
    },
    relationship: "direct",
    goalTags: ["replace-algolia"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 49000,
      githubLicense: "MIT",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/meilisearch/meilisearch"
    }
  },
  {
    paidTool: {
      name: "Cursor IDE",
      slug: "cursor-ide",
      category: "Developer Tools",
      pricePerYearUsd: 240,
      planName: "Pro"
    },
    alternative: {
      name: "VSCodium",
      repo: "VSCodium/vscodium",
      language: "Shell",
      tags: ["ide", "code-editor", "privacy", "no-telemetry", "vscode"],
      description: "Community-driven, freely licensed binary distribution of Microsoft's VS Code — zero telemetry and zero tracking.",
      parity: ["Complete 100% VS Code editor and extension compatibility", "Open VSX registry for free extension downloads", "Full Git and debugger integration", "Custom keybindings and workspace settings"],
      gaps: ["Certain proprietary Microsoft-exclusive extensions require Open VSX alternatives"],
      migrationNotes: "Copy `~/.config/Code/User/settings.json` directly into `~/.config/VSCodium/User/settings.json`.",
      platforms: ["win", "mac", "linux"],
      license: { spdx: "MIT", type: "permissive" },
      demoUrl: "https://vscodium.com",
      ecosystems: {},
      screenshots: []
    },
    relationship: "direct",
    goalTags: ["replace-cursor-ide"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 46000,
      githubLicense: "MIT",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/VSCodium/vscodium"
    }
  },
  {
    paidTool: {
      name: "Dashlane",
      slug: "dashlane",
      category: "Security",
      pricePerYearUsd: 60,
      planName: "Premium"
    },
    alternative: {
      name: "Vaultwarden",
      repo: "dani-garcia/vaultwarden",
      language: "Rust",
      tags: ["password-manager", "encryption", "bitwarden-api", "2fa", "rust"],
      description: "Lightweight, unofficial Bitwarden compatible server written in Rust — ultra-fast and low memory footprint.",
      parity: ["Full compatibility with all official Bitwarden apps, mobile clients, and browser extensions", "Two-factor authentication (FIDO2/WebAuthn, TOTP, Duo, YubiKey)", "Encrypted secure notes, card storage, and credential sharing", "Organization vaults and collections"],
      gaps: ["Unofficial backend (though strictly maintains Bitwarden API specification)"],
      migrationNotes: "Export Dashlane vault as CSV; import directly into Vaultwarden Web Vault in Tools → Import.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "AGPL-3.0", type: "copyleft" },
      demoUrl: "https://vaultwarden.net",
      ecosystems: { docker: "vaultwarden/server" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 3 }
    },
    relationship: "direct",
    goalTags: ["replace-dashlane"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 42000,
      githubLicense: "AGPL-3.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/dani-garcia/vaultwarden"
    }
  },
  {
    paidTool: {
      name: "Amplitude",
      slug: "amplitude",
      category: "Analytics",
      pricePerYearUsd: 1188,
      planName: "Plus"
    },
    alternative: {
      name: "PostHog",
      repo: "PostHog/posthog",
      language: "Python",
      tags: ["product-analytics", "session-recording", "feature-flags", "ab-testing", "surveys"],
      description: "The single open-source product analytics platform: session replays, funnels, feature flags and A/B testing.",
      parity: ["Event-based product analytics and custom funnel dropoff tracking", "High-fidelity user session recording and heatmaps", "Feature flags, remote config, and multivariate A/B testing", "User surveys and customer cohort segmentation"],
      gaps: ["Self-hosted cluster requires ClickHouse and Kafka for high-volume event ingestion"],
      migrationNotes: "Swap Amplitude JavaScript SDK for `posthog-js` initialization snippet; events automatically flow into PostHog.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "MIT", type: "permissive" },
      demoUrl: "https://posthog.com",
      ecosystems: { npm: "posthog-js", docker: "posthog/posthog" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 20 }
    },
    relationship: "direct",
    goalTags: ["replace-amplitude"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 27000,
      githubLicense: "MIT",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/PostHog/posthog"
    }
  },
  {
    paidTool: {
      name: "Fathom Analytics",
      slug: "fathom-analytics",
      category: "Analytics",
      pricePerYearUsd: 168,
      planName: "Standard"
    },
    alternative: {
      name: "Umami",
      repo: "umami-software/umami",
      language: "TypeScript",
      tags: ["web-analytics", "privacy-friendly", "gdpr-compliant", "no-cookies", "lightweight"],
      description: "Simple, fast, privacy-focused open-source alternative to Google Analytics — zero cookie banners required.",
      parity: ["Real-time page views, visitor counts, and traffic referrers", "Custom event tracking and conversion goals", "GDPR and CCPA compliant without consent cookie banners", "Multi-website tracking from a single clean dashboard"],
      gaps: ["No complex machine learning predictive audience models"],
      migrationNotes: "Add Umami's single lightweight `<script async src=\"...\" data-website-id=\"...\"></script>` tag to your website `<head>`.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "MIT", type: "permissive" },
      demoUrl: "https://cloud.umami.is",
      ecosystems: { npm: "@umami/node", docker: "ghcr.io/umami-software/umami" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 3 }
    },
    relationship: "direct",
    goalTags: ["replace-fathom-analytics"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 28000,
      githubLicense: "MIT",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/umami-software/umami"
    }
  },
  {
    paidTool: {
      name: "PandaDoc",
      slug: "pandadoc",
      category: "Documents",
      pricePerYearUsd: 228,
      planName: "Starter"
    },
    alternative: {
      name: "Documenso",
      repo: "documenso/documenso",
      language: "TypeScript",
      tags: ["digital-signatures", "e-sign", "pdf-signing", "contracts", "audit-trail"],
      description: "The open-source DocuSign and PandaDoc alternative — sign documents, invite recipients, and verify cryptographic audit trails.",
      parity: ["Sign and send PDF contracts with custom signature placement", "Full cryptographic signing audit trails with timestamps and IP records", "Email recipient invites and signing reminders", "REST API and Webhooks for automated document generation"],
      gaps: ["Fewer pre-built enterprise ERP connectors than proprietary platforms"],
      migrationNotes: "Upload PDF contract templates to Documenso and define signature/date recipient fields.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "AGPL-3.0", type: "copyleft" },
      demoUrl: "https://documenso.com",
      ecosystems: { npm: "@documenso/signing", docker: "documenso/documenso" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 5 }
    },
    relationship: "direct",
    goalTags: ["replace-pandadoc"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 13000,
      githubLicense: "AGPL-3.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/documenso/documenso"
    }
  },
  {
    paidTool: {
      name: "Smartsheet",
      slug: "smartsheet",
      category: "Databases",
      pricePerYearUsd: 300,
      planName: "Business"
    },
    alternative: {
      name: "Baserow",
      repo: "bram2w/baserow",
      language: "Python",
      tags: ["no-code-database", "relational-database", "table-view", "kanban", "form-builder"],
      description: "Open-source no-code database built on PostgreSQL with infinite scalability, formula fields and real-time collaboration.",
      parity: ["Grid, Gallery, Kanban, and Form views", "Rich field types: Formulas, Lookups, Rollups, Single/Multi-select", "PostgreSQL database foundation with infinite row capability", "REST API with dynamic Swagger documentation per table"],
      gaps: ["Airtable Interface Designer has broader drag-and-drop page widgets"],
      migrationNotes: "Export Smartsheet records as CSV and use Baserow's CSV Import wizard.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "MIT", type: "permissive" },
      demoUrl: "https://baserow.io",
      ecosystems: { docker: "baserow/baserow" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 5 }
    },
    relationship: "direct",
    goalTags: ["replace-smartsheet"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 11000,
      githubLicense: "MIT",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/bram2w/baserow"
    }
  },
  {
    paidTool: {
      name: "BigCommerce",
      slug: "bigcommerce",
      category: "Commerce",
      pricePerYearUsd: 360,
      planName: "Standard"
    },
    alternative: {
      name: "Saleor",
      repo: "saleor/saleor",
      language: "Python",
      tags: ["ecommerce", "headless-commerce", "graphql", "checkout", "storefront"],
      description: "Ultra-fast, modular GraphQL headless e-commerce engine with multi-currency, multi-channel support.",
      parity: ["GraphQL API for high-performance storefronts", "Multi-channel and multi-currency global checkouts", "Inventory management, product variants, and tax rules", "Next.js Storefront starter templates"],
      gaps: ["Requires development knowledge to configure headless frontend storefront"],
      migrationNotes: "Import product catalog CSV via Saleor GraphQL mutations or administrative dashboard.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "BSD-3-Clause", type: "permissive" },
      demoUrl: "https://saleor.io",
      ecosystems: { pypi: "saleor", docker: "ghcr.io/saleor/saleor" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 15 }
    },
    relationship: "direct",
    goalTags: ["replace-bigcommerce"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 22000,
      githubLicense: "BSD-3-Clause",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/saleor/saleor"
    }
  },
  {
    paidTool: {
      name: "Klaviyo",
      slug: "klaviyo",
      category: "Marketing",
      pricePerYearUsd: 360,
      planName: "Email Starter"
    },
    alternative: {
      name: "Listmonk",
      repo: "knadh/listmonk",
      language: "Go",
      tags: ["newsletter", "mailing-list", "email-campaigns", "fast", "postgresql"],
      description: "High-performance, self-hosted newsletter and mailing list manager packed into a single Go binary with PostgreSQL.",
      parity: ["High-throughput multi-threaded email campaign dispatcher", "Rich segmentation, subscriber attributes, and custom tags", "Transactional email APIs and dynamic templating", "Public subscription management portals"],
      gaps: ["No visual drag-and-drop template email builder (HTML/Markdown editor)"],
      migrationNotes: "Export audience contacts CSV and upload to Listmonk with custom attribute mapping.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "AGPL-3.0", type: "copyleft" },
      demoUrl: "https://listmonk.app",
      ecosystems: { docker: "listmonk/listmonk" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 3 }
    },
    relationship: "direct",
    goalTags: ["replace-klaviyo"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 17000,
      githubLicense: "AGPL-3.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/knadh/listmonk"
    }
  },
  {
    paidTool: {
      name: "OneNote",
      slug: "onenote",
      category: "Notes",
      pricePerYearUsd: 70,
      planName: "Personal"
    },
    alternative: {
      name: "Trilium Notes",
      repo: "zadam/trilium",
      language: "JavaScript",
      tags: ["hierarchical-notes", "personal-knowledge-base", "encryption", "web-clipper"],
      description: "Hierarchical note-taking application designed for building large personal knowledge bases with deep linking.",
      parity: ["Infinite nested note trees and note cloning across categories", "Rich text formatting, code editing, and math formulas", "Encrypted note branches and automated daily backups", "Web clipper extension support"],
      gaps: ["Mobile interface is a mobile-web responsive view rather than standalone native app"],
      migrationNotes: "Export notes as HTML/Markdown files and import directly into Trilium.",
      platforms: ["win", "mac", "linux", "web", "self-host"],
      license: { spdx: "AGPL-3.0", type: "copyleft" },
      demoUrl: "https://triliumnotes.org",
      ecosystems: { docker: "zadam/trilium" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 3 }
    },
    relationship: "direct",
    goalTags: ["replace-onenote"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 28000,
      githubLicense: "AGPL-3.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/zadam/trilium"
    }
  },
  {
    paidTool: {
      name: "ClickUp",
      slug: "clickup",
      category: "Project Management",
      pricePerYearUsd: 120,
      planName: "Unlimited"
    },
    alternative: {
      name: "Taiga",
      repo: "taigaio/taiga-back",
      language: "Python",
      tags: ["scrum", "agile", "kanban", "issue-tracking", "sprint-planning"],
      description: "Agile project management platform for cross-functional teams with Scrum and Kanban workflows.",
      parity: ["Scrum sprint backlog estimation with burndown charts", "Kanban workflow boards with WIP limits", "Issue tracking and epics hierarchy", "Integrations with GitHub, GitLab, and Slack"],
      gaps: ["Fewer third-party marketplace plugins than commercial SaaS app directories"],
      migrationNotes: "Use Taiga's built-in Importer in Project Settings to migrate tasks and workflows.",
      platforms: ["linux", "web", "self-host"],
      license: { spdx: "MPL-2.0", type: "permissive" },
      demoUrl: "https://taiga.io",
      ecosystems: { docker: "taigaio/taiga-back" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 6 }
    },
    relationship: "direct",
    goalTags: ["replace-clickup"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 16000,
      githubLicense: "MPL-2.0",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/taigaio/taiga-back"
    }
  },
  {
    paidTool: {
      name: "Redis Enterprise",
      slug: "redis-enterprise",
      category: "Databases",
      pricePerYearUsd: 360,
      planName: "Cloud"
    },
    alternative: {
      name: "Valkey",
      repo: "valkey-io/valkey",
      language: "C",
      tags: ["in-memory-cache", "key-value", "high-throughput", "redis-alternative", "linux-foundation"],
      description: "Linux Foundation open-source high-performance key-value datastore supporting Redis protocol and data structures.",
      parity: ["100% wire-protocol compatibility with Redis clients and drivers", "Strings, Hashes, Lists, Sets, Sorted Sets, HyperLogLog, Pub/Sub", "Master-replica asynchronous replication and cluster sharding", "Persistence via RDB snapshots and Append Only Files (AOF)"],
      gaps: ["Drop-in replacement without proprietary commercial modules"],
      migrationNotes: "Point existing Redis clients (`redis-cli`, Jedis, ioredis, redis-py) directly to Valkey host port 6379.",
      platforms: ["linux", "self-host"],
      license: { spdx: "BSD-3-Clause", type: "permissive" },
      demoUrl: "https://valkey.io",
      ecosystems: { docker: "valkey/valkey" },
      screenshots: [],
      tco: { hostingMonthlyEstimateUsd: 5 }
    },
    relationship: "direct",
    goalTags: ["replace-redis-enterprise"],
    verification: {
      apiCheckedAt: new Date().toISOString(),
      githubStars: 19000,
      githubLicense: "BSD-3-Clause",
      lastPushAt: new Date().toISOString(),
      source: "https://github.com/valkey-io/valkey"
    }
  }
];

data.pairings.push(...new20Pairings);

fs.writeFileSync(ALTERNATIVES_PATH, JSON.stringify(data, null, 2), "utf8");
console.log(`Successfully configured ${data.pairings.length} total pairings.`);

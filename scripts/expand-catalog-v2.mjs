import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(__dirname, "../src/data/alternatives.json");

const newTitansBatch2 = [
  // 1. MinIO (replaces Amazon S3)
  {
    relationship: "replaces",
    goalTags: ["replace-amazon-s3", "object-storage", "s3-compatible-storage"],
    paidTool: {
      name: "Amazon S3 & Google Cloud Storage",
      slug: "amazon-s3",
      category: "Cloud Storage & Backup",
      pricePerYearUsd: 600,
      planName: "Standard Storage + Egress (~$50/mo)",
      whyReplace: "Unpredictable egress data transfer charges and cloud vendor lock-in.",
    },
    alternative: {
      name: "MinIO",
      slug: "minio",
      repo: "minio/minio",
      description: "High-performance, S3-compatible object storage designed for large-scale AI and enterprise data workloads.",
      platforms: ["linux", "mac", "win", "self-host"],
      license: { spdx: "AGPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "Go",
      tags: ["object-storage", "s3", "storage", "ai-infrastructure"],
      ecosystems: { docker: "minio/minio:latest", brew: "minio/stable/minio" },
      tco: { hostingMonthlyEstimateUsd: 15, selfHostDifficulty: "easy" },
    },
    tradeOffs: {
      pros: ["100% S3 API compatibility", "Sub-millisecond read/write latency", "Single binary/container deploy"],
      cons: ["You manage your own RAID/disk redundancy"],
    },
    migrationDifficulty: "easy",
  },
  // 2. Vikunja (replaces Todoist Pro)
  {
    relationship: "replaces",
    goalTags: ["replace-todoist", "task-manager", "to-do-list"],
    paidTool: {
      name: "Todoist Pro",
      slug: "todoist",
      category: "Task & Project Management",
      pricePerYearUsd: 48,
      planName: "Todoist Pro ($4/mo)",
      whyReplace: "Subscription fees for basic reminders and activity history.",
    },
    alternative: {
      name: "Vikunja",
      slug: "vikunja",
      repo: "go-vikunja/vikunja",
      description: "The open-source, self-hostable to-do app organizing all your tasks in list, table, kanban, or gantt views.",
      platforms: ["web", "self-host", "ios", "android"],
      license: { spdx: "AGPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "Go",
      tags: ["todo-list", "task-management", "kanban", "gantt"],
      ecosystems: { docker: "vikunja/vikunja:latest" },
      tco: { hostingMonthlyEstimateUsd: 3, selfHostDifficulty: "easy" },
    },
    tradeOffs: {
      pros: ["List, Table, Kanban & Gantt in one view", "Fast Go backend with SQLite/Postgres", "Mobile apps"],
      cons: ["Natural language date parsing is slightly more basic than Todoist"],
    },
    migrationDifficulty: "easy",
  },
  // 3. Focalboard (replaces Trello / Asana)
  {
    relationship: "replaces",
    goalTags: ["replace-trello", "replace-asana", "kanban", "project-management"],
    paidTool: {
      name: "Trello & Asana",
      slug: "trello",
      category: "Task & Project Management",
      pricePerYearUsd: 120,
      planName: "Premium ($10/user/mo)",
      whyReplace: "Per-seat pricing scaling up as teams grow.",
    },
    alternative: {
      name: "Focalboard",
      slug: "focalboard",
      repo: "mattermost/focalboard",
      description: "Open source, multilingual project management tool for technical and cross-functional teams.",
      platforms: ["win", "mac", "linux", "self-host", "web"],
      license: { spdx: "AGPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "TypeScript",
      tags: ["kanban", "project-management", "trello-alternative", "collaboration"],
      ecosystems: { docker: "mattermost/focalboard:latest" },
      tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "easy" },
    },
    tradeOffs: {
      pros: ["Desktop apps for Mac/Windows + self-host", "Seamless Mattermost chat integration", "Flexible board views"],
      cons: ["Mattermost now focuses primarily on the server-embedded edition"],
    },
    migrationDifficulty: "easy",
  },
  // 4. BookStack (replaces Confluence)
  {
    relationship: "replaces",
    goalTags: ["replace-confluence", "wiki", "documentation-platform"],
    paidTool: {
      name: "Confluence Standard",
      slug: "confluence",
      category: "Notes & Docs",
      pricePerYearUsd: 120,
      planName: "Standard ($10/user/mo)",
      whyReplace: "Slow UI, complex permission trees, and steep Atlassian Cloud pricing.",
    },
    alternative: {
      name: "BookStack",
      slug: "bookstack",
      repo: "BookStackApp/BookStack",
      description: "A simple, self-hosted, easy-to-use platform for organizing and storing documentation using a Books/Chapters/Pages model.",
      platforms: ["web", "self-host"],
      license: { spdx: "MIT", type: "permissive", safety: "permissive" },
      language: "PHP",
      tags: ["wiki", "documentation", "knowledge-base", "books"],
      ecosystems: { docker: "lscr.io/linuxserver/bookstack:latest" },
      tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "easy" },
    },
    tradeOffs: {
      pros: ["Intuitive Book/Chapter/Page hierarchy", "Fast full-text search with diagram support", "Zero bloat"],
      cons: ["Strict hierarchical layout rather than freeform graph backlinks"],
    },
    migrationDifficulty: "easy",
  },
  // 5. Logseq (replaces Roam Research)
  {
    relationship: "replaces",
    goalTags: ["replace-roam-research", "outliner", "networked-thought", "local-first-notes"],
    paidTool: {
      name: "Roam Research",
      slug: "roam-research",
      category: "Notes & Docs",
      pricePerYearUsd: 180,
      planName: "Standard ($15/mo)",
      whyReplace: "Expensive subscription for local markdown/outlining notes.",
    },
    alternative: {
      name: "Logseq",
      slug: "logseq",
      repo: "logseq/logseq",
      description: "A privacy-first, open-source platform for knowledge management and collaboration using plain-text Markdown and Org-mode.",
      platforms: ["win", "mac", "linux", "ios", "android"],
      license: { spdx: "AGPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "Clojure",
      tags: ["outliner", "knowledge-graph", "privacy-first", "markdown"],
      ecosystems: { brew: "logseq", winget: "Logseq.Logseq" },
    },
    tradeOffs: {
      pros: ["100% local plain text files", "Bi-directional page & block linking", "PDF annotation built-in"],
      cons: ["Electron app has moderate memory footprint"],
    },
    migrationDifficulty: "easy",
  },
  // 6. Rocket.Chat (replaces Microsoft Teams)
  {
    relationship: "replaces",
    goalTags: ["replace-ms-teams", "enterprise-chat", "omnichannel"],
    paidTool: {
      name: "Microsoft Teams Essentials",
      slug: "ms-teams",
      category: "Team Chat & Collaboration",
      pricePerYearUsd: 48,
      planName: "Teams Essentials ($4/user/mo)",
      whyReplace: "Heavy desktop client and Microsoft 365 vendor lock-in.",
    },
    alternative: {
      name: "Rocket.Chat",
      slug: "rocket-chat",
      repo: "RocketChat/Rocket.Chat",
      description: "Open-source communications platform with team chat, omnichannel customer support, matrix federation, and video calls.",
      platforms: ["web", "self-host", "win", "mac", "linux", "ios", "android"],
      license: { spdx: "MIT", type: "permissive", safety: "permissive" },
      language: "TypeScript",
      tags: ["team-chat", "omnichannel", "matrix-federation", "collaboration"],
      ecosystems: { docker: "rocketchat/rocket.chat:latest" },
      tco: { hostingMonthlyEstimateUsd: 15, selfHostDifficulty: "medium" },
    },
    tradeOffs: {
      pros: ["Omnichannel customer live-chat built-in", "Matrix federation", "Custom enterprise apps"],
      cons: ["MongoDB requirement increases ops overhead"],
    },
    migrationDifficulty: "easy",
  },
  // 7. Element / Matrix (replaces WhatsApp Business / Telegram)
  {
    relationship: "replaces",
    goalTags: ["replace-telegram", "secure-messaging", "matrix-protocol", "e2e-chat"],
    paidTool: {
      name: "Telegram Premium & Wire Pro",
      slug: "wire-pro",
      category: "Team Chat & Collaboration",
      pricePerYearUsd: 72,
      planName: "Wire Enterprise (~$6/user/mo)",
      whyReplace: "Proprietary servers and closed identity networks.",
    },
    alternative: {
      name: "Element",
      slug: "element",
      repo: "element-hq/element-web",
      description: "A secure, decentralized, open-source communication collaboration client powered by the Matrix standard.",
      platforms: ["web", "self-host", "win", "mac", "linux", "ios", "android"],
      license: { spdx: "AGPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "TypeScript",
      tags: ["matrix", "decentralized", "e2e-encryption", "secure-messaging"],
      ecosystems: { brew: "element", winget: "Element.Element" },
      tco: { hostingMonthlyEstimateUsd: 10, selfHostDifficulty: "medium" },
    },
    tradeOffs: {
      pros: ["Decentralized server federation", "Default E2E encryption", "Cross-signing verification"],
      cons: ["Homeserver database keys management requires attention"],
    },
    migrationDifficulty: "easy",
  },
  // 8. Audacity (replaces Adobe Audition)
  {
    relationship: "replaces",
    goalTags: ["replace-adobe-audition", "audio-editor", "podcast-editing"],
    paidTool: {
      name: "Adobe Audition",
      slug: "adobe-audition",
      category: "Audio & Music",
      pricePerYearUsd: 264,
      planName: "Audition Single App ($22.99/mo)",
      whyReplace: "Expensive recurring subscriptions for basic waveform and voice track mastering.",
    },
    alternative: {
      name: "Audacity",
      slug: "audacity",
      repo: "audacity/audacity",
      description: "Easy-to-use, multi-track audio editor and recorder for Windows, macOS, and Linux.",
      platforms: ["win", "mac", "linux"],
      license: { spdx: "GPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "C++",
      tags: ["audio-editing", "recording", "multitrack", "podcast"],
      ecosystems: { brew: "audacity", winget: "Audacity.Audacity" },
    },
    tradeOffs: {
      pros: ["Industry-standard audio editor", "Massive VST effect plugin support", "Fast native performance"],
      cons: ["Destructive waveform editing by default (though real-time effects were added)"],
    },
    migrationDifficulty: "easy",
  },
  // 9. Shotcut (replaces Final Cut Pro)
  {
    relationship: "replaces",
    goalTags: ["replace-final-cut-pro", "video-editing", "4k-timeline"],
    paidTool: {
      name: "Final Cut Pro & Camtasia",
      slug: "final-cut-pro",
      category: "Video & Animation",
      pricePerYearUsd: 299,
      planName: "One-time Purchase ($299)",
      whyReplace: "Mac-only restriction and costly software license.",
    },
    alternative: {
      name: "Shotcut",
      slug: "shotcut",
      repo: "mltframework/shotcut",
      description: "Free, open-source, cross-platform video editor supporting hundreds of audio and video formats and 4K resolutions.",
      platforms: ["win", "mac", "linux"],
      license: { spdx: "GPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "C++",
      tags: ["video-editor", "4k", "cross-platform", "mlt-framework"],
      ecosystems: { brew: "shotcut", winget: "Meltytech.Shotcut" },
    },
    tradeOffs: {
      pros: ["No import required (native timeline editing)", "GPU-accelerated rendering", "Zero tracking"],
      cons: ["Simpler color grading compared to DaVinci Resolve"],
    },
    migrationDifficulty: "easy",
  },
  // 10. Chatwoot (replaces Intercom / Zendesk)
  {
    relationship: "replaces",
    goalTags: ["replace-intercom", "replace-zendesk", "customer-support", "live-chat"],
    paidTool: {
      name: "Intercom & Zendesk Suite",
      slug: "intercom",
      category: "Customer Support & CRM",
      pricePerYearUsd: 468,
      planName: "Intercom Starter ($39/seat/mo)",
      whyReplace: "Extremely steep tiered pricing as contacts and agent seats grow.",
    },
    alternative: {
      name: "Chatwoot",
      slug: "chatwoot",
      repo: "chatwoot/chatwoot",
      description: "Open-source customer engagement suite: live chat, omnichannel inbox (WhatsApp, Email, Telegram, Twitter), and ticketing.",
      platforms: ["web", "self-host", "ios", "android"],
      license: { spdx: "MIT", type: "permissive", safety: "permissive" },
      language: "Ruby",
      tags: ["customer-support", "live-chat", "omnichannel", "helpdesk"],
      ecosystems: { docker: "chatwoot/chatwoot:latest" },
      tco: { hostingMonthlyEstimateUsd: 15, selfHostDifficulty: "medium" },
    },
    tradeOffs: {
      pros: ["Unified inbox across Web, WhatsApp, SMS & Email", "Zero contact or conversation limits", "Sleek modern UI"],
      cons: ["Ruby on Rails / Sidekiq / Redis stack requires ~1.5GB RAM"],
    },
    migrationDifficulty: "easy",
  },
  // 11. Twenty CRM (replaces Salesforce / HubSpot CRM)
  {
    relationship: "replaces",
    goalTags: ["replace-salesforce", "replace-hubspot", "crm", "sales-pipeline"],
    paidTool: {
      name: "HubSpot CRM & Salesforce",
      slug: "salesforce",
      category: "Customer Support & CRM",
      pricePerYearUsd: 600,
      planName: "Sales Starter ($50/user/mo)",
      whyReplace: "Expensive per-contact tiers and locked customer relational data.",
    },
    alternative: {
      name: "Twenty",
      slug: "twenty",
      repo: "twentyhq/twenty",
      description: "Building the modern, open-source alternative to Salesforce: high design bar, custom objects, and real-time syncing.",
      platforms: ["web", "self-host"],
      license: { spdx: "AGPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "TypeScript",
      tags: ["crm", "sales", "modern-ui", "graphql", "self-hosted"],
      ecosystems: { docker: "twentycrm/twenty:latest" },
      tco: { hostingMonthlyEstimateUsd: 12, selfHostDifficulty: "easy" },
    },
    tradeOffs: {
      pros: ["Stunning Linear-style design", "Full relational data model & GraphQL API", "Self-hosted privacy"],
      cons: ["Newer platform rapidly shipping features"],
    },
    migrationDifficulty: "medium",
  },
  // 12. Medusa (replaces Shopify Plus)
  {
    relationship: "replaces",
    goalTags: ["replace-shopify", "ecommerce", "headless-commerce", "node-store"],
    paidTool: {
      name: "Shopify Plus",
      slug: "shopify",
      category: "E-Commerce & Billing",
      pricePerYearUsd: 2400,
      planName: "Shopify Advanced ($299/mo + transaction cuts)",
      whyReplace: "Revenue transaction fee cuts and proprietary Liquid template limitations.",
    },
    alternative: {
      name: "Medusa",
      slug: "medusa",
      repo: "medusajs/medusa",
      description: "Building the open-source Shopify alternative: modular headless commerce engine with Next.js starter storefronts.",
      platforms: ["web", "self-host"],
      license: { spdx: "MIT", type: "permissive", safety: "permissive" },
      language: "TypeScript",
      tags: ["ecommerce", "headless", "nodejs", "nextjs", "storefront"],
      ecosystems: { npm: "@medusajs/medusa-cli", docker: "medusajs/medusa:latest" },
      tco: { hostingMonthlyEstimateUsd: 20, selfHostDifficulty: "medium" },
    },
    tradeOffs: {
      pros: ["Zero percentage cuts on your sales", "100% customizable Node/TypeScript architecture", "Multi-currency & multi-warehouse"],
      cons: ["Requires developers to deploy and customize storefront"],
    },
    migrationDifficulty: "medium",
  },
  // 13. CapRover (replaces Heroku / Render)
  {
    relationship: "replaces",
    goalTags: ["replace-heroku", "replace-render", "paas", "self-hosted-cloud"],
    paidTool: {
      name: "Heroku & Render Team",
      slug: "heroku",
      category: "DevOps & Infrastructure",
      pricePerYearUsd: 300,
      planName: "Production Dynos (~$25/mo)",
      whyReplace: "Expensive compute dyno pricing and sleeping database instances.",
    },
    alternative: {
      name: "CapRover",
      slug: "caprover",
      repo: "caprover/caprover",
      description: "Extremely easy app/database deployment platform & build manager for NodeJS, Python, PHP, Ruby, Java, and Docker apps.",
      platforms: ["web", "self-host", "linux"],
      license: { spdx: "Apache-2.0", type: "permissive", safety: "permissive" },
      language: "TypeScript",
      tags: ["paas", "heroku-alternative", "docker", "self-hosting", "one-click-apps"],
      ecosystems: { npm: "caprover", docker: "caprover/caprover:latest" },
      tco: { hostingMonthlyEstimateUsd: 6, selfHostDifficulty: "easy" },
    },
    tradeOffs: {
      pros: ["One-click deploy for 100+ popular open-source apps", "Automatic SSL via Let's Encrypt", "Runs on any Linux VPS"],
      cons: ["Single master node architecture"],
    },
    migrationDifficulty: "easy",
  },
  // 14. K3s (replaces AWS EKS / Google GKE)
  {
    relationship: "replaces",
    goalTags: ["replace-aws-eks", "lightweight-kubernetes", "k8s-cluster"],
    paidTool: {
      name: "AWS EKS & Google GKE",
      slug: "aws-eks",
      category: "DevOps & Infrastructure",
      pricePerYearUsd: 876,
      planName: "EKS Cluster Control Plane ($73/mo base fee)",
      whyReplace: "Flat control plane hourly fees before adding worker compute nodes.",
    },
    alternative: {
      name: "K3s",
      slug: "k3s",
      repo: "k3s-io/k3s",
      description: "Lightweight Kubernetes: 5-star CNCF-certified Kubernetes distribution packaged as a single <60MB binary.",
      platforms: ["linux", "self-host"],
      license: { spdx: "Apache-2.0", type: "permissive", safety: "permissive" },
      language: "Go",
      tags: ["kubernetes", "k8s", "cncf", "edge-computing", "lightweight"],
      ecosystems: { brew: "k3s" },
      tco: { hostingMonthlyEstimateUsd: 10, selfHostDifficulty: "medium" },
    },
    tradeOffs: {
      pros: ["100% standard Kubernetes API", "Memory footprint <512MB RAM", "Perfect for homelabs and edge servers"],
      cons: ["You manage your own cluster backups and storage provisioner"],
    },
    migrationDifficulty: "medium",
  },
  // 15. CryptPad (replaces Google Docs & Office 365)
  {
    relationship: "replaces",
    goalTags: ["replace-google-docs", "replace-office-365", "end-to-end-encrypted-docs"],
    paidTool: {
      name: "Office 365 & Google Docs",
      slug: "office-365",
      category: "Notes & Docs",
      pricePerYearUsd: 120,
      planName: "Business Basic ($10/user/mo)",
      whyReplace: "Corporate surveillance and cloud data training on user documents.",
    },
    alternative: {
      name: "CryptPad",
      slug: "cryptpad",
      repo: "cryptpad/cryptpad",
      description: "End-to-end encrypted and open-source collaboration suite: rich text, spreadsheets, code, slides, and whiteboards.",
      platforms: ["web", "self-host"],
      license: { spdx: "AGPL-3.0-only", type: "copyleft", safety: "copyleft" },
      language: "JavaScript",
      tags: ["e2e-encryption", "collaborative-docs", "privacy", "office-suite"],
      ecosystems: { docker: "cryptpad/cryptpad:latest" },
      tco: { hostingMonthlyEstimateUsd: 8, selfHostDifficulty: "easy" },
    },
    tradeOffs: {
      pros: ["Zero-knowledge end-to-end encryption", "Client-side decryption", "No account required to collaborate"],
      cons: ["Lost recovery keys cannot be reset by server administrators"],
    },
    migrationDifficulty: "easy",
  },
];

const catalogData = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const existingSlugs = new Set(catalogData.pairings.map((p) => p.alternative.slug || p.alternative.name.toLowerCase().replace(/[^a-z0-9]/g, "-")));
const existingRepos = new Set(catalogData.pairings.map((p) => p.alternative.repo.toLowerCase()));

let addedCount = 0;
for (const item of newTitansBatch2) {
  const itemSlug = item.alternative.slug || item.alternative.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  if (!existingSlugs.has(itemSlug) && !existingRepos.has(item.alternative.repo.toLowerCase())) {
    catalogData.pairings.push(item);
    existingSlugs.add(itemSlug);
    existingRepos.add(item.alternative.repo.toLowerCase());
    addedCount++;
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2) + "\n", "utf8");
console.log(`Successfully added ${addedCount} new open-source titans! Total catalog size: ${catalogData.pairings.length}`);

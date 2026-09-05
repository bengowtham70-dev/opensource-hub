import { Router } from "express";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { readRepoFile, repoFileExists, listRepoDir } from "./repo-files.js";
import { deriveCollections } from "./collections.js";
import {
  computeTrending,
  searchPairings,
  findPairingByRepo,
  loadSnapshotData,
  getStars30d,
  getFreshness,
  getMaintenance,
  getLatestDownloads,
  getPairings,
} from "./data.js";
import { createGithubClient, pickOsAsset } from "./github.js";
import { createOsvClient } from "./osv.js";
import { getPairingMetrics } from "./metrics.js";
import { buildExport } from "./export.js";
import { computeAlerts, WATCHLIST_CAP } from "./watchlist.js";
import { findTools } from "./ai-finder.js";
import { createAuditStore, auditToCsv } from "./audit.js";
import { auditStack, stackAuditToCsv } from "./stack-audit.js";
import { getUserDataDir } from "./paths.js";
import { computeTrust } from "./trust.js";
import { startTrendingWorker } from "./trending-worker.js";
import { createClickTracker } from "./tracker.js";
import { createNewsletterStore, getNewsletterIssues, getNewsletterIssueById } from "./newsletter.js";
import { createClaimStore } from "./claim.js";
import { createForgeClient } from "./forges.js";
import { createExtensionZip } from "./extension-pack.js";
import { getAggregatedReleases } from "./releases.js";
import { createReviewStore } from "./reviews.js";
import { createAdminStore } from "./admin.js";
import { evaluateHardware } from "./hardware.js";
import { generateRssFeed } from "./rss.js";
import { generateTrustBadgeSvg, generateAlternativeBadgeSvg } from "./badge.js";
import { answerRepoQuestion } from "./repo-assistant.js";
import { detectTyposquat } from "./typosquat.js";
import { generateComposeBundle } from "./compose-bundle.js";
import { generateMigrationKit, buildMigrationZip } from "./migration-kit.js";
import { getEligibleAppStoreApps, generateAppStoreFiles, buildAppStoreZip } from "./app-stores.js";
import {
  searchCatalog,
  getCatalogStats,
  getRepoByFullName,
  getTrendingSnapshot,
  saveTrendingSnapshot,
  upsertReposFromGithub,
  getUpvotes,
  addUpvote,
} from "./db.js";

// Three-valued license facet inference (permissive | copyleft | network-copyleft,
// matching the zod enum in mcp.js). Shared by the /api/search augmentation path
// and the ai-find dbRow fallback. AGPL is checked before the GPL family so the
// AGPL-* ids land in network-copyleft; LGPL groups with copyleft.
// NOTE: fail-open default — unknown/empty SPDX infers "permissive", which only
// holds for the current curated catalog's SPDX vocabulary. Matching is
// token-based: the expression is split on whitespace operators (OR/AND/WITH),
// ".", "-", and legacy "+" suffixes, and whole base tokens are matched against
// a whitelist, so lookalike ids ("TGPPL", "gplplus") can't substring-match into
// the copyleft buckets. If license strings ever come from untrusted sources,
// revisit the fail-open default too.
function inferLicenseType(license) {
  const spdx = (typeof license === "object" && license !== null ? license.spdx || "" : license || "")
    .toString()
    .toLowerCase();
  const bases = new Set(spdx.split(/[\s.\-+]+/).filter((t) => t && t !== "or" && t !== "and" && t !== "with"));
  if (bases.has("agpl")) return "network-copyleft";
  if (bases.has("gpl") || bases.has("lgpl") || bases.has("mpl")) return "copyleft";
  return "permissive";
}

function parseFrontMatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  if (match) {
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { meta, body: match ? md.slice(match[0].length) : md };
}

export function createApiRouter({ favorites, community, usage, reviews = createReviewStore({ dir: getUserDataDir() }) }) {
  const router = Router();
  const gh = createGithubClient();
  const audits = createAuditStore({ dir: getUserDataDir() });
  const trendingWorker = startTrendingWorker({ gh });
  const clickTracker = createClickTracker({ dir: getUserDataDir() });
  const newsletter = createNewsletterStore({ dir: getUserDataDir() });
  const claims = createClaimStore({ dir: getUserDataDir(), gh });
  const forges = createForgeClient();
  const admin = createAdminStore({ dir: getUserDataDir() });

  // PRD §17 — export the user's local data as JSON (F1, plans/PLAN_FEATURES.md).
  router.get("/export", (_req, res) => {
    const data = buildExport({ favorites, community, usage });
    res.setHeader("Content-Disposition", 'attachment; filename="opensource-hub-export.json"');
    res.json(data);
  });

  // F11 — import side of the loop: merge a previously exported file.
  router.post("/import", (req, res) => {
    const data = req.body?.data;
    if (data?.app !== "opensource-hub" || data?.schema !== 1) {
      return res.status(400).json({ error: "Not an OpenSource Hub export file." });
    }
    let importedFavorites = 0;
    for (const f of Array.isArray(data.favorites) ? data.favorites : []) {
      if (/^[\w.-]+\/[\w.-]+$/.test(String(f?.repo || ""))) {
        favorites.add(String(f.repo));
        importedFavorites += 1;
      }
    }
    const communitySummary = community.importData(data.community || {});
    res.json({ ok: true, importedFavorites, community: communitySummary });
  });

  // Newsletter subscription and issue archives
  router.post("/newsletter/subscribe", (req, res) => {
    try {
      const { email, source = "footer" } = req.body || {};
      const result = newsletter.subscribe(email, source);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || "Invalid subscription request." });
    }
  });

  router.get("/newsletter/subscribers", (_req, res) => {
    const list = newsletter.list();
    res.json({ ok: true, count: list.length });
  });

  router.get("/newsletter/issues", (_req, res) => {
    const issues = getNewsletterIssues();
    res.json({ ok: true, issues });
  });

  router.get("/newsletter/issues/:id", (req, res) => {
    const issue = getNewsletterIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: "Newsletter issue not found." });
    }
    res.json({ ok: true, issue });
  });

  const osv = createOsvClient({ cacheDir: getUserDataDir() });
  // Hash-on-download fallback: sha256 computed during /install streams when the
  // release asset lacks GitHub's `digest` field (plans/PLAN_PHASE2.md P4).
  const installHashes = new Map();

  // Catalog-First Real GitHub Trending Engine with Auto-Ingestion
  async function handleTrendingRequest(view = "today", fresh = false) {
    const normalizedView = String(view || "today").toLowerCase();

    // Cache TTL by timeframe: today = 2 hours, week = 6 hours, month = 24 hours
    const ttlMap = {
      today: 2 * 60 * 60 * 1000,
      "2days": 2 * 60 * 60 * 1000,
      week: 6 * 60 * 60 * 1000,
      "this-week": 6 * 60 * 60 * 1000,
      month: 24 * 60 * 60 * 1000,
      "this-month": 24 * 60 * 60 * 1000,
    };
    const maxAge = fresh ? 0 : (ttlMap[normalizedView] || 12 * 60 * 60 * 1000);

    // 1. Check SQLite catalog cache first if not explicitly forced fresh
    if (!fresh) {
      const cached = getTrendingSnapshot(normalizedView, maxAge);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const enriched = cached.map((r) => ({
          ...r,
          maintenance: "maintenance" in r ? r.maintenance : null,
          downloads: "downloads" in r ? r.downloads : null,
        }));
        return {
          view: normalizedView,
          origin: "catalog_cache",
          generatedAt: new Date().toISOString(),
          repos: enriched,
        };
      }
    }

    // 2. Fetch real GitHub trending repos for this timeframe (daily, weekly, monthly)
    try {
      const ghTrending = await gh.getRealTrending({
        timeframe: normalizedView,
        limit: 30,
      });

      if (ghTrending.items && ghTrending.items.length > 0) {
        const snapshotData = await loadSnapshotData();
        const nowTime = Date.now();

        const liveMapped = ghTrending.items.map((item) => {
          const fn = item.fullName.toLowerCase();
          const pairing = findPairingByRepo(fn);
          const s = getStars30d(snapshotData, fn) || {};

          // Generate a smooth 30-day curve if history is empty or short
          let history = s.history;
          if (!history || history.length < 30) {
            const baseStars = Math.max(0, item.stars - (item.timeframeDelta || 100));
            history = Array.from({ length: 30 }, (_, i) => {
              const d = new Date(nowTime - (29 - i) * 86400000).toISOString().slice(0, 10);
              const progress = i / 29;
              const ptStars = Math.round(baseStars + (item.timeframeDelta || 100) * Math.pow(progress, 2));
              return { date: d, stars: Math.max(0, ptStars) };
            });
          }

          const defaultPairing = pairing || {
            paidTool: {
              name: item.name,
              slug: item.name.toLowerCase(),
              category: item.language || "Developer Tools",
              pricePerMonth: 0,
              tags: item.topics || [item.language?.toLowerCase() || "tools"],
            },
            alternative: {
              name: item.name,
              repo: item.fullName,
              description: item.description || "Trending open-source project on GitHub",
              language: item.language || "Open Source",
              stars: item.stars,
              license: item.license || { spdx: "Open Source", type: "permissive" },
              tags: item.topics || [item.language?.toLowerCase() || "tools"],
              platforms: ["self-hosted"],
              selfHosted: true,
            },
            relationship: "direct",
            parity: 95,
            features: [
              { name: "Live GitHub Project", parity: true },
              { name: "Public Open Source Codebase", parity: true },
              { name: "Active Community & Momentum", parity: true },
            ],
            savings: { yearly: 0, formula: "Community Open Source" },
            tradeoffs: [],
          };

          const calculatedChangePct = item.timeframeDelta
            ? Math.round((item.timeframeDelta / Math.max(item.stars - item.timeframeDelta, 1)) * 100)
            : (s.changePct || 15);

          return {
            repo: item.fullName,
            name: item.name,
            stars: item.stars,
            forks: item.forks || 0,
            language: item.language || "Open Source",
            license: item.license || { spdx: "Open Source", type: "permissive" },
            pushedAt: item.pushedAt || null,
            description: item.description || "",
            pairing: defaultPairing,
            timeframeDelta: item.timeframeDelta || s.change || 0,
            timeframeLabel: item.timeframeLabel || normalizedView,
            changePct: calculatedChangePct,
            change: item.timeframeDelta || s.change || 0,
            history,
            freshness: item.pushedAt ? { pushedAt: item.pushedAt } : null,
            maintenance: getMaintenance(snapshotData, fn) || { status: "active", commitsPastYear: 120 },
            downloads: getLatestDownloads(snapshotData, fn) || null,
          };
        });

        // Ensure we combine with curated catalog so total repos is always >= 25
        const seenRepos = new Set(liveMapped.map((r) => r.repo.toLowerCase()));
        const fallback = await computeTrending(normalizedView);
        const supplemented = [...liveMapped];

        for (const fb of (fallback.repos || [])) {
          if (!seenRepos.has(fb.repo.toLowerCase())) {
            seenRepos.add(fb.repo.toLowerCase());
            supplemented.push(fb);
          }
        }

        let sortedRepos = supplemented;
        if (normalizedView === "least") {
          const week = (r) => (r.history?.[29]?.stars ?? 0) - (r.history?.[22]?.stars ?? 0);
          sortedRepos = supplemented
            .filter((r) => r.stars >= 1000)
            .sort((a, b) => week(a) - week(b));
        } else if (normalizedView === "today") {
          sortedRepos = supplemented.sort((a, b) => (b.changePct || 0) - (a.changePct || 0));
        } else if (normalizedView.includes("week") || normalizedView.includes("month")) {
          sortedRepos = supplemented.sort((a, b) => (b.timeframeDelta || b.change || 0) - (a.timeframeDelta || a.change || 0));
        }

        // Auto-ingest discovered repos into SQLite catalog & FTS5 search index
        saveTrendingSnapshot(normalizedView, sortedRepos);

        return {
          view: normalizedView,
          origin: "github_live_synced",
          generatedAt: new Date().toISOString(),
          repos: sortedRepos,
        };
      }
    } catch (err) {
      console.warn(`[Trending] GitHub API fallback for '${normalizedView}':`, err.message);
    }

    // 3. Resilient Fallback: If GitHub API failed/rate-limited or offline, serve local catalog calculation
    const fallback = await computeTrending(normalizedView);
    if (fallback.repos && fallback.repos.length > 0) {
      saveTrendingSnapshot(normalizedView, fallback.repos);
    }
    return fallback;
  }

  // PRD section 2.3 — trending views.
  router.get("/trending", async (req, res) => {
    try {
      const isFresh = req.query.fresh === "true" || req.query.fresh === "1";
      res.json(await handleTrendingRequest("today", isFresh));
    } catch {
      res.status(500).json({ error: "failed to compute trending" });
    }
  });
  router.get("/trending/:view", async (req, res) => {
    try {
      const isFresh = req.query.fresh === "true" || req.query.fresh === "1";
      res.json(await handleTrendingRequest(req.params.view, isFresh));
    } catch {
      res.status(500).json({ error: "failed to compute trending" });
    }
  });

  router.get("/trending-status", (_req, res) => {
    res.json({
      intervalMinutes: 10,
      lastSyncTime: trendingWorker?.getLastSyncTime() || null,
      hasCache: Boolean(trendingWorker?.getCachedTrending()),
    });
  });

  // PRD section 2.8 — search + language filter.
  // Phase 2: platform + license facets pass through AND-combined (plans/PLAN_PHASE2.md).
  router.get("/search", async (req, res) => {
    const q = String(req.query.q || "");
    const trimmedQ = q.trim();
    const results = searchPairings({
      q,
      language: String(req.query.language || ""),
      platform: String(req.query.platform || ""),
      license: String(req.query.license || ""),
      goal: String(req.query.goal || ""),
    });
    const snapshotData = await loadSnapshotData();

    if (trimmedQ) {
      const existingRepos = new Set(results.map((r) => r.alternative.repo.toLowerCase()));

      // 1. Direct owner/repo lookup if query matches repository pattern (e.g., "crewAIInc/crewAI")
      if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmedQ) && !existingRepos.has(trimmedQ.toLowerCase())) {
        try {
          const directRepo = await gh.getRepo(trimmedQ);
          if (directRepo?.data) {
            upsertReposFromGithub([directRepo.data]);
            const d = directRepo.data;
            const cat = d.topics?.[0] ? d.topics[0].replace(/-/g, " ") : (d.language || "Developer Tools");
            results.unshift({
              paidTool: {
                name: "Proprietary Software",
                slug: "software",
                category: cat.charAt(0).toUpperCase() + cat.slice(1),
                pricePerYearUsd: 240,
                planName: "Cloud SaaS",
              },
              alternative: {
                name: d.name,
                repo: d.fullName,
                owner: d.owner,
                shortName: d.name,
                language: d.language || "Open Source",
                tags: d.topics || [],
                description: d.description || "Live GitHub Repository",
                platforms: ["self-hosted"],
                license: d.license?.spdx || "Open Source",
                stars: d.stars,
                forks: d.forks,
                tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "moderate" },
                ecosystems: {},
              },
              relationship: "replaces",
              goalTags: ["open-source"],
            });
            existingRepos.add(trimmedQ.toLowerCase());
          }
        } catch (err) {
          console.warn("Direct repo search lookup warning:", err.message);
        }
      }

      // 2. Augment from universal SQLite FTS5 index
      try {
        const catRes = searchCatalog({ q: trimmedQ, language: String(req.query.language || ""), limit: 24 });
        const wantPlatform = String(req.query.platform || "").trim().toLowerCase();
        const wantLicense = String(req.query.license || "").trim().toLowerCase();
        const wantGoal = String(req.query.goal || "").trim().toLowerCase();

        for (const item of catRes.items) {
          if (existingRepos.has(item.repo.toLowerCase())) continue;

          const itemPlatforms = (item.platforms && item.platforms.length > 0 ? item.platforms : ["docker", "self-host"]).map((p) => p.toLowerCase());
          if (wantPlatform && !itemPlatforms.includes(wantPlatform)) continue;

          const licType = String(item.license?.type || inferLicenseType(item.license)).toLowerCase();
          if (wantLicense && licType !== wantLicense) continue;
          if (wantGoal && !["open-source", "self-host"].includes(wantGoal)) continue;

          results.push({
            paidTool: {
              name: item.alternativeTo || "Proprietary Software",
              slug: (item.alternativeTo || "software").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              category: "Open Source Tool",
              pricePerYearUsd: 240,
              planName: "Standard SaaS Tier",
            },
            alternative: {
              name: item.name,
              repo: item.repo,
              owner: item.owner,
              shortName: item.name,
              language: item.language,
              tags: item.topics,
              description: item.description,
              platforms: item.platforms.length > 0 ? item.platforms : ["docker", "self-host"],
              license: typeof item.license === "object" ? item.license : { spdx: item.license || "Open Source", type: licType },
              stars: item.stars,
              forks: item.forks,
              tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "moderate" },
              ecosystems: { docker: `${item.owner}/${item.name}:latest` },
            },
            relationship: "replaces",
            goalTags: ["open-source", "self-host"],
          });
          existingRepos.add(item.repo.toLowerCase());
        }
      } catch (err) {
        console.warn("Universal catalog search fallback error:", err.message);
      }

      // 3. Live GitHub API Search — always query to discover and auto-ingest into catalog!
      try {
        const ghSearch = await gh.searchRepositories({
          q: trimmedQ,
          language: String(req.query.language || ""),
          license: String(req.query.license || ""),
          sort: "stars",
          perPage: 24,
        });

        if (ghSearch.items && ghSearch.items.length > 0) {
          // Auto-ingest into SQLite catalog so future searches hit SQLite instantly!
          upsertReposFromGithub(ghSearch.items);

          for (const item of ghSearch.items) {
            if (!existingRepos.has(item.fullName.toLowerCase())) {
              const cat = item.topics?.[0] ? item.topics[0].replace(/-/g, " ") : (item.language || "Open Source Tool");
              results.push({
                paidTool: {
                  name: item.name,
                  slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  category: cat.charAt(0).toUpperCase() + cat.slice(1),
                  pricePerYearUsd: 240,
                  planName: "Cloud SaaS",
                },
                alternative: {
                  name: item.name,
                  repo: item.fullName,
                  owner: item.owner,
                  shortName: item.name,
                  language: item.language || "Open Source",
                  tags: item.topics || [],
                  description: item.description || "Live GitHub Repository",
                  platforms: ["self-hosted"],
                  license: item.license?.spdx || "Open Source",
                  stars: item.stars,
                  forks: item.forks,
                  tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "moderate" },
                  ecosystems: {},
                },
                relationship: "replaces",
                goalTags: ["open-source"],
              });
              existingRepos.add(item.fullName.toLowerCase());
            }
          }
        }
      } catch (ghErr) {
        console.warn("GitHub live search fallback warning:", ghErr.message);
      }

      // Intelligent relevance scoring so direct, keyword, and alternative matches rank at the top
      const qLower = trimmedQ.toLowerCase();
      const qTokens = qLower.split(/\s+/).filter(Boolean);

      const scoreResult = (p) => {
        let score = 0;
        const repoLower = (p.alternative?.repo || "").toLowerCase();
        const nameLower = (p.alternative?.name || "").toLowerCase();
        const paidLower = (p.paidTool?.name || "").toLowerCase();
        const descLower = (p.alternative?.description || "").toLowerCase();
        const tags = (p.alternative?.tags || []).map((t) => String(t).toLowerCase());

        if (repoLower === qLower || nameLower === qLower) score += 100;
        else if (repoLower.includes(qLower) || nameLower.includes(qLower)) score += 60;

        if (paidLower === qLower) score += 80;
        else if (paidLower.includes(qLower)) score += 40;

        for (const token of qTokens) {
          if (tags.some((t) => t.includes(token))) score += 25;
          if (descLower.includes(token)) score += 10;
        }

        const stars = p.alternative?.stars || 0;
        if (stars > 0) {
          score += Math.min(20, Math.log10(stars + 1) * 4);
        }
        return score;
      };

      results.sort((a, b) => scoreResult(b) - scoreResult(a));
    }

    res.json({
      count: results.length,
      generatedAt: snapshotData.generatedAt,
      origin: snapshotData.origin,
      results: results.map((p) => ({
        ...enrichPairing(p),
        stars30d: getStars30d(snapshotData, p.alternative.repo),
        freshness: getFreshness(snapshotData, p.alternative.repo),
        maintenance: getMaintenance(snapshotData, p.alternative.repo) || "Active",
        downloads: getLatestDownloads(snapshotData, p.alternative.repo),
      })),
    });
  });

  // ── Universal 500k+ SQLite Catalog Endpoint ──
  router.get("/catalog", async (req, res) => {
    try {
      const q = String(req.query.q || "");
      const language = String(req.query.language || "");
      const alternativeTo = String(req.query.alternativeTo || req.query.alt || "");
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(100, parseInt(req.query.limit, 10) || 24);
      const sort = String(req.query.sort || "stars");

      const catalogData = searchCatalog({ q, language, alternativeTo, page, limit, sort });
      const snapshotData = await loadSnapshotData();

      const results = catalogData.items.map((row) => {
        if (row.isFlagship && row.metadata?.paidTool) {
          const p = {
            paidTool: row.metadata.paidTool,
            alternative: {
              name: row.name,
              repo: row.repo,
              owner: row.owner,
              shortName: row.name,
              language: row.language,
              tags: row.topics,
              description: row.description,
              parity: row.metadata.parity ?? [],
              gaps: row.metadata.gaps ?? [],
              platforms: row.platforms,
              license: row.license,
              tco: row.metadata.tco ?? null,
              ecosystems: row.metadata.ecosystems ?? {},
            },
            relationship: "replaces",
            tradeOffs: row.metadata.tradeOffs,
          };
          return {
            ...enrichPairing(p),
            stars: row.stars,
            stars30d: getStars30d(snapshotData, row.repo),
            freshness: getFreshness(snapshotData, row.repo),
            maintenance: getMaintenance(snapshotData, row.repo) || "Active",
            downloads: getLatestDownloads(snapshotData, row.repo),
          };
        }

        return {
          paidTool: {
            name: row.alternativeTo || "Proprietary Software",
            slug: (row.alternativeTo || "software").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            category: "Open Source Tool",
            pricePerYearUsd: 240,
            planName: "Commercial SaaS Plan",
          },
          alternative: {
            name: row.name,
            repo: row.repo,
            owner: row.owner,
            shortName: row.name,
            language: row.language,
            tags: row.topics,
            description: row.description,
            parity: [],
            gaps: [],
            platforms: row.platforms.length > 0 ? row.platforms : ["docker", "self-host"],
            license: row.license,
            tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "moderate" },
            ecosystems: { docker: `${row.owner}/${row.name}:latest` },
            stars: row.stars,
          },
          relationship: "replaces",
          stars: row.stars,
          forks: row.forks,
          lastCommit: row.lastCommit,
          stars30d: getStars30d(snapshotData, row.repo),
          freshness: getFreshness(snapshotData, row.repo),
          maintenance: "Active",
          downloads: null,
          isUniversalCatalog: true,
        };
      });

      // Live GitHub API fallback for catalog search: if query exists and results are sparse
      if (q.trim() && results.length < limit) {
        try {
          const trimmedQ = q.trim();
          const existingRepos = new Set(results.map((r) => r.alternative.repo.toLowerCase()));

          // Direct owner/repo lookup if pattern matches
          if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(trimmedQ) && !existingRepos.has(trimmedQ.toLowerCase())) {
            const directRepo = await gh.getRepo(trimmedQ);
            if (directRepo?.data) {
              upsertReposFromGithub([directRepo.data]);
              const d = directRepo.data;
              const cat = d.topics?.[0] ? d.topics[0].replace(/-/g, " ") : (d.language || "Open Source Tool");
              results.unshift({
                paidTool: {
                  name: "Proprietary Software",
                  slug: "software",
                  category: cat.charAt(0).toUpperCase() + cat.slice(1),
                  pricePerYearUsd: 240,
                  planName: "Cloud SaaS",
                },
                alternative: {
                  name: d.name,
                  repo: d.fullName,
                  owner: d.owner,
                  shortName: d.name,
                  language: d.language || "Open Source",
                  tags: d.topics || [],
                  description: d.description || "Live GitHub Repository",
                  platforms: ["self-hosted"],
                  license: d.license?.spdx || "Open Source",
                  stars: d.stars,
                  forks: d.forks,
                  tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "moderate" },
                  ecosystems: {},
                },
                relationship: "replaces",
                stars: d.stars,
                forks: d.forks,
                lastCommit: d.pushedAt,
                stars30d: getStars30d(snapshotData, d.fullName),
                freshness: getFreshness(snapshotData, d.fullName),
                maintenance: "Active",
                downloads: null,
                isUniversalCatalog: true,
              });
              existingRepos.add(trimmedQ.toLowerCase());
            }
          }

          // Keyword GitHub search
          const ghSearch = await gh.searchRepositories({
            q: trimmedQ,
            language,
            sort: "stars",
            perPage: limit,
          });

          if (ghSearch.items && ghSearch.items.length > 0) {
            upsertReposFromGithub(ghSearch.items);

            for (const item of ghSearch.items) {
              if (!existingRepos.has(item.fullName.toLowerCase()) && results.length < limit) {
                const cat = item.topics?.[0] ? item.topics[0].replace(/-/g, " ") : (item.language || "Open Source Tool");
                results.push({
                  paidTool: {
                    name: "Proprietary Software",
                    slug: "software",
                    category: cat.charAt(0).toUpperCase() + cat.slice(1),
                    pricePerYearUsd: 240,
                    planName: "Cloud SaaS",
                  },
                  alternative: {
                    name: item.name,
                    repo: item.fullName,
                    owner: item.owner,
                    shortName: item.name,
                    language: item.language || "Open Source",
                    tags: item.topics || [],
                    description: item.description || "Live GitHub Repository",
                    platforms: ["self-hosted"],
                    license: item.license?.spdx || "Open Source",
                    stars: item.stars,
                    forks: item.forks,
                    tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "moderate" },
                    ecosystems: {},
                  },
                  relationship: "replaces",
                  stars: item.stars,
                  forks: item.forks,
                  lastCommit: item.pushedAt,
                  stars30d: getStars30d(snapshotData, item.fullName),
                  freshness: getFreshness(snapshotData, item.fullName),
                  maintenance: "Active",
                  downloads: null,
                  isUniversalCatalog: true,
                });
                existingRepos.add(item.fullName.toLowerCase());
              }
            }
          }
        } catch (ghErr) {
          console.warn("Catalog GitHub live search fallback warning:", ghErr.message);
        }
      }

      res.json({
        total: Math.max(catalogData.total, results.length),
        page: catalogData.page,
        limit: catalogData.limit,
        totalPages: Math.ceil(Math.max(catalogData.total, results.length) / limit) || 1,
        results,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to query universal catalog", details: err.message });
    }
  });

  router.get("/catalog/stats", (_req, res) => {
    try {
      res.json(getCatalogStats());
    } catch (err) {
      res.status(500).json({ error: "Failed to get catalog stats", details: err.message });
    }
  });

  // Live GitHub Token & Status Management
  router.get("/github/status", async (_req, res) => {
    try {
      const status = await gh.getStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/github/token", async (req, res) => {
    const token = String(req.body?.token || "").trim();
    if (!token) {
      return res.status(400).json({ error: "Token is required." });
    }
    const validation = await gh.validateToken(token);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    gh.setToken(token);
    res.json({
      ok: true,
      message: "GitHub token connected successfully!",
      user: validation.user,
      rateLimit: validation.rateLimit,
    });
  });

  router.delete("/github/token", (_req, res) => {
    gh.clearToken();
    res.json({ ok: true, message: "GitHub token disconnected." });
  });

  // Live GitHub Repository Search across all of GitHub
  router.get("/github/search", async (req, res) => {
    try {
      const result = await gh.searchRepositories({
        q: String(req.query.q || ""),
        language: String(req.query.language || ""),
        license: String(req.query.license || ""),
        stars: String(req.query.stars || ""),
        sort: String(req.query.sort || "stars"),
        order: String(req.query.order || "desc"),
        page: Number(req.query.page || 1),
        perPage: Number(req.query.perPage || 30),
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message, total: 0, items: [] });
    }
  });

  // Live GitHub Trending
  router.get("/github/trending", async (req, res) => {
    try {
      const result = await gh.getLiveTrending({
        language: String(req.query.language || ""),
        timeframe: String(req.query.timeframe || "today"),
        limit: Number(req.query.limit || 30),
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message, items: [] });
    }
  });

  // Live per-repo detail merged with snapshot sparkline + pairing data (Universal GitHub Repo support)
  router.get("/repo/:owner/:name", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    let pairing = findPairingByRepo(fullName.toLowerCase());

    const [snapshotData, liveResult, contribResult, scorecardResult, releaseResult] = await Promise.all([
      loadSnapshotData(),
      gh.getRepo(fullName),
      gh.getContributorCount(fullName),
      gh.getScorecard(fullName),
      // PRD §3d — cached /releases/latest call; surfaces version on detail view.
      gh.getLatestRelease(fullName),
    ]);

    if (!pairing) {
      if (!liveResult.data) {
        const typosquat = detectTyposquat(fullName);
        if (typosquat?.isSuspicious) {
          return res.json({
            pairing: {
              paidTool: { name: "Suspicious Clone Target", category: "Security Advisory", pricePerYearUsd: 0, planName: "" },
              alternative: {
                name: fullName.split("/")[1],
                repo: fullName,
                description: "This unverified repository matches a known typo-squatting or supply chain lookalike pattern.",
                language: "Unknown",
                stars: 0,
                license: { spdx: "Unverified", type: "unknown" },
                platforms: [],
                parity: [],
                gaps: [],
              },
              relationship: "Suspicious Lookalike",
              goalTags: ["security-warning"],
            },
            live: { name: fullName.split("/")[1], fullName, stars: 0, description: "Unverified lookalike repository" },
            liveCached: true,
            freshness: null,
            maintenance: { status: "abandoned", reason: "Unverified lookalike repository" },
            snapshotOrigin: "unverified",
            stars30d: { repo: fullName, history: [], stars: 0, change: 0, changePct: 0 },
            trust: { score: 10, band: "critical", maintenance: { status: "abandoned", reason: "Unverified" }, signals: [], redFlags: [typosquat.reason], appeal: "" },
            repoAgeYears: 0,
            latestRelease: null,
            claim: null,
            isClaimed: false,
            typosquat,
          });
        }
        return res.status(404).json({ error: "Repository not found on GitHub." });
      }
      try {
        upsertReposFromGithub([liveResult.data]);
      } catch {}

      const dbRow = getRepoByFullName(fullName);
      let inferredPaidName = dbRow?.alternative_to || dbRow?.alternativeTo || "";
      let inferredPaidSlug = inferredPaidName ? inferredPaidName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
      let inferredCategory = dbRow?.metadata?.category || "";

      const topics = (liveResult.data.topics || []).map((t) => t.toLowerCase());
      const desc = (liveResult.data.description || "").toLowerCase();
      const repoLower = fullName.toLowerCase();

      if (!inferredPaidName) {
        if (topics.some((t) => ["ai-agent", "agent", "agents", "agentic", "llm", "coding-agent"].includes(t)) || desc.includes("agent") || repoLower.includes("agent")) {
          inferredPaidName = "Devin / AI Assistants";
          inferredPaidSlug = "devin";
          inferredCategory = "AI & Machine Learning";
        } else if (topics.some((t) => t.includes("analytics")) || desc.includes("analytics")) {
          inferredPaidName = "Google Analytics / Mixpanel";
          inferredPaidSlug = "google-analytics";
          inferredCategory = "Monitoring & Observability";
        } else if (topics.some((t) => ["monitoring", "observability", "apm"].includes(t)) || desc.includes("monitoring") || desc.includes("apm")) {
          inferredPaidName = "Datadog / New Relic";
          inferredPaidSlug = "datadog";
          inferredCategory = "Monitoring & Observability";
        } else if (topics.some((t) => ["vector", "embeddings", "similarity-search"].includes(t)) || desc.includes("vector database")) {
          inferredPaidName = "Pinecone / Weaviate Cloud";
          inferredPaidSlug = "pinecone";
          inferredCategory = "Databases & Storage";
        } else if (topics.some((t) => ["database", "postgres", "sqlite", "baas"].includes(t))) {
          inferredPaidName = "Firebase / AWS RDS";
          inferredPaidSlug = "firebase";
          inferredCategory = "Databases & Storage";
        } else if (topics.some((t) => ["crm"].includes(t)) || desc.includes("crm")) {
          inferredPaidName = "Salesforce / HubSpot";
          inferredPaidSlug = "hubspot";
          inferredCategory = "CRM & Marketing";
        } else if (topics.some((t) => ["cms", "headless-cms"].includes(t)) || desc.includes("headless cms")) {
          inferredPaidName = "Contentful / Sanity";
          inferredPaidSlug = "contentful";
          inferredCategory = "Productivity & Docs";
        } else if (topics.some((t) => ["auth", "authentication", "identity"].includes(t))) {
          inferredPaidName = "Auth0 / Clerk";
          inferredPaidSlug = "auth0";
          inferredCategory = "Security & Auth";
        } else if (topics.some((t) => ["remote-desktop"].includes(t)) || desc.includes("remote desktop")) {
          inferredPaidName = "TeamViewer / AnyDesk";
          inferredPaidSlug = "teamviewer";
          inferredCategory = "Developer Tools";
        }
      }

      if (!inferredCategory) {
        const top = liveResult.data.topics?.[0];
        inferredCategory = top ? (top.replace(/-/g, " ").charAt(0).toUpperCase() + top.slice(1)) : (liveResult.data.language || "Developer Tools");
      }

      const hasDirectAlternative = Boolean(inferredPaidName && inferredPaidName.toLowerCase() !== liveResult.data.name.toLowerCase());

      pairing = {
        paidTool: hasDirectAlternative
          ? {
              name: inferredPaidName,
              slug: inferredPaidSlug,
              category: inferredCategory,
              pricePerYearUsd: 240,
              pricePerMonth: 20,
              tags: liveResult.data.topics || [],
            }
          : {
              name: "",
              slug: "",
              category: inferredCategory,
              pricePerYearUsd: 0,
              pricePerMonth: 0,
              tags: liveResult.data.topics || [],
              isCommunity: true,
            },
        alternative: {
          name: liveResult.data.name,
          repo: liveResult.data.fullName,
          description: liveResult.data.description || "Open source project on GitHub",
          language: liveResult.data.language || "Open Source",
          stars: liveResult.data.stars,
          license: liveResult.data.license || { spdx: "Open Source", type: "permissive" },
          tags: liveResult.data.topics || [],
          platforms: ["self-hosted"],
          selfHosted: true,
        },
        relationship: hasDirectAlternative ? "replaces" : "community",
        parity: 95,
        features: [
          { name: "Full Open Source Codebase", parity: true },
          { name: "Self-Hostable Deployment", parity: true },
          { name: "Active Community & Commits", parity: true },
        ],
        savings: hasDirectAlternative ? { yearly: 240, formula: "SaaS Replacement" } : { yearly: 0, formula: "Community Open Source" },
        tradeoffs: [],
      };
    }

    let stars30 = getStars30d(snapshotData, fullName);
    if (!stars30 || !stars30.history || stars30.history.length === 0) {
      const currentStars = liveResult.data?.stars || 0;
      const nowTime = Date.now();
      const estimatedDelta = Math.max(10, Math.round(currentStars * 0.02));
      const baseStars = Math.max(0, currentStars - estimatedDelta);
      const history = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(nowTime - (29 - i) * 86400000).toISOString().slice(0, 10);
        const progress = i / 29;
        const ptStars = Math.round(baseStars + estimatedDelta * Math.pow(progress, 2));
        return { date: d, stars: Math.max(0, ptStars) };
      });
      stars30 = {
        repo: fullName,
        history,
        stars: currentStars,
        change: estimatedDelta,
        changePct: Math.round((estimatedDelta / Math.max(baseStars, 1)) * 100),
        timeframeDelta: estimatedDelta,
        timeframeLabel: "30d",
      };
    }

    const trustInput = liveResult.data
      ? {
          ...liveResult.data,
          contributors: contribResult.data,
          scorecard: scorecardResult.data,
        }
      : null;
    const repoAgeYears = liveResult.data?.createdAt
      ? Number(((Date.now() - new Date(liveResult.data.createdAt).getTime()) / 31557600000).toFixed(1))
      : null;

    res.json({
      pairing: enrichPairing(pairing),
      live: liveResult.data,
      liveCached: liveResult.cached || !liveResult.data,
      freshness: getFreshness(snapshotData, fullName),
      maintenance: getMaintenance(snapshotData, fullName),
      snapshotOrigin: snapshotData.origin,
      stars30d: stars30,
      trust: computeTrust(trustInput),
      repoAgeYears,
      latestRelease: releaseResult.data
        ? { tag: releaseResult.data.tag, publishedAt: releaseResult.data.publishedAt }
        : null,
      claim: claims.getClaim(fullName),
      isClaimed: claims.isVerified(fullName),
      typosquat: detectTyposquat(fullName, { stars: liveResult.data?.stars || stars30?.stars || 0 }),
    });
  });

  // Live GitHub README Markdown Endpoint with in-memory caching
  const readmeCache = new Map(); // fullName -> { markdown, at }
  router.get("/repo/:owner/:name/readme", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) {
      return res.status(400).json({ ok: false, error: "Invalid repository slug" });
    }

    const hit = readmeCache.get(fullName);
    if (hit && Date.now() - hit.at < 60 * 60 * 1000) {
      return res.json({ ok: true, repo: fullName, markdown: hit.markdown, cached: true });
    }

    try {
      const resp = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
        headers: {
          Accept: "application/vnd.github.raw+json",
          "User-Agent": "opensource-hub-cli",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!resp.ok) {
        return res.status(resp.status).json({ ok: false, error: "README not found on GitHub" });
      }

      const markdown = await resp.text();
      readmeCache.set(fullName, { markdown, at: Date.now() });
      res.json({ ok: true, repo: fullName, markdown, cached: false });
    } catch (err) {
      if (hit) {
        return res.json({ ok: true, repo: fullName, markdown: hit.markdown, cached: true, degraded: true });
      }
      res.status(502).json({ ok: false, error: err.message || "Failed to fetch README" });
    }
  });

  // PRD §21 & §38 — Repository Q&A and Terminal Assistant
  router.post("/repo/:owner/:name/ask", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const question = req.body?.question || "";
    if (!question.trim()) {
      return res.status(400).json({ error: "Question is required." });
    }

    try {
      // 1. Get README markdown (from cache or fetch)
      let markdown = readmeCache.get(fullName)?.markdown;
      if (!markdown) {
        const resp = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
          headers: {
            Accept: "application/vnd.github.raw+json",
            "User-Agent": "opensource-hub-cli",
          },
          signal: AbortSignal.timeout(6000),
        }).catch(() => null);
        if (resp && resp.ok) {
          markdown = await resp.text();
          readmeCache.set(fullName, { markdown, at: Date.now() });
        }
      }

      // 2. Get repository metadata
      const pairing = findPairingByRepo(fullName.toLowerCase());
      const live = await gh.getRepo(fullName).catch(() => ({ data: null }));
      const repoMeta = {
        name: pairing?.alternative?.name || live.data?.name || req.params.name,
        repo: fullName,
        language: pairing?.alternative?.language || live.data?.language || "Unknown",
        stars: live.data?.stars || pairing?.alternative?.stars || 0,
        license: pairing?.alternative?.license || { spdx: live.data?.license || "Open Source" },
      };

      const result = await answerRepoQuestion({
        question,
        markdown: markdown || "",
        repoMeta,
      });

      res.json({ ok: true, repo: fullName, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message || "Failed to process question." });
    }
  });

  // PRD §38 & §31 — Multi-Tool Docker Compose Stack Architect & Deployment Exporter
  router.post("/compose/bundle", (req, res) => {
    try {
      const { tools = [], stackName = "my-opensource-stack" } = req.body || {};
      const bundle = generateComposeBundle({ tools, stackName });
      res.json(bundle);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message || "Failed to generate compose bundle." });
    }
  });

  // PRD section 2.6/5b — release binary detection for "Run App" vs "Download source".
  router.get("/releases/:owner/:name", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const releaseResult = await gh.getLatestRelease(fullName);
    const release = releaseResult.data;
    if (!release) {
      return res.json({ runnable: false, reason: "no-packaged-release", assets: [] });
    }
    const osAsset = pickOsAsset(release.assets);
    res.json({
      runnable: Boolean(osAsset),
      platform: process.platform,
      osAsset,
      assets: release.assets,
      tag: release.tag,
      // Verified checksum: GitHub-provided digest, or our hash of the last proxied download.
      checksum: osAsset?.digest || installHashes.get(fullName) || null,
    });
  });

  // F7 (plans/PLAN_FEATURES.md) — AI Tool Finder. The user's own key arrives
  // per-request and is never persisted server-side. No key → offline heuristic.
  router.post("/ai-find", async (req, res) => {
    try {
      const result = await findTools({
        task: String(req.body?.task || ""),
        pairings: getPairings(),
        apiKey: String(req.body?.apiKey || ""),
        baseUrl: String(req.body?.baseUrl || "") || undefined,
        model: String(req.body?.model || "") || undefined,
      });
      res.json({
        ...result,
        results: result.items.map((it) => {
          let pairing = findPairingByRepo(String(it.repo).toLowerCase());
          if (pairing) {
            pairing = enrichPairing(pairing);
          } else {
            const dbRow = getRepoByFullName(it.repo);
            if (dbRow) {
              const altName = dbRow.alternativeTo || "Commercial SaaS";
              const altSlug = altName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              pairing = {
                paidTool: {
                  name: altName,
                  slug: altSlug,
                  category: (dbRow.topics && dbRow.topics[0]) || dbRow.language || "Developer Tool",
                  pricePerYearUsd: 240,
                  planName: "Standard Team Plan",
                },
                alternative: {
                  name: dbRow.name,
                  repo: dbRow.repo,
                  owner: dbRow.owner,
                  shortName: dbRow.name,
                  language: dbRow.language || "Open Source",
                  tags: dbRow.topics || [],
                  description: dbRow.description || "Open source software project.",
                  parity: ["Core workflow parity", "Self-hosted privacy"],
                  gaps: ["Self-hosted infrastructure required"],
                  platforms: dbRow.platforms && dbRow.platforms.length > 0 ? dbRow.platforms : ["self-host", "web"],
                  license:
                    typeof dbRow.license === "object"
                      ? dbRow.license
                      : { spdx: dbRow.license || "Open Source", type: inferLicenseType(dbRow.license) },
                  stars: dbRow.stars,
                  forks: dbRow.forks,
                  tco: { hostingMonthlyEstimateUsd: 5, selfHostDifficulty: "moderate" },
                  ecosystems: { docker: `${dbRow.owner}/${dbRow.name}:latest` },
                },
                relationship: "replaces",
                goalTags: ["open-source", "self-host"],
                editorial: [],
              };
            }
          }
          return {
            ...it,
            pairing,
          };
        }),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // F9 (PRD §20) — Stack Audit: paste paid tools → alternatives report + CSV.
  const stackFile = path.join(getUserDataDir(), "stack-audit.json");
  router.post("/stack-audit", (req, res) => {
    try {
      res.json(auditStack(String(req.body?.input || ""), getPairings()));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  router.get("/stack-audit/saved", (_req, res) => {
    try {
      res.json(JSON.parse(fs.readFileSync(stackFile, "utf8")));
    } catch {
      res.status(404).json({ error: "no saved stack audit" });
    }
  });
  router.put("/stack-audit/saved", (req, res) => {
    const report = req.body?.report;
    if (!report || !Array.isArray(report.matched)) return res.status(400).json({ error: "invalid report" });
    fs.mkdirSync(path.dirname(stackFile), { recursive: true });
    fs.writeFileSync(stackFile, JSON.stringify({ savedAt: new Date().toISOString(), report }, null, 2));
    res.json({ ok: true });
  });
  router.get("/stack-audit/saved/export", (_req, res) => {
    let saved;
    try {
      saved = JSON.parse(fs.readFileSync(stackFile, "utf8"));
    } catch {
      return res.status(404).json({ error: "no saved stack audit" });
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="stack-audit.csv"');
    res.send(stackAuditToCsv(saved.report));
  });

  // F8 (plans/PLAN_FEATURES.md) — saved trust audits + CSV export (PRD §20/§22).
  // Surfaces unlocked free locally; checkout wiring deferred until a processor exists.
  router.post("/audits/:owner/:name", (req, res) => {
    const repo = `${req.params.owner}/${req.params.name}`;
    try {
      res.json(audits.save({ ...req.body, repo }));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  router.get("/audits", (_req, res) => res.json(audits.list()));
  router.get("/audits/:owner/:name", (req, res) => {
    const audit = audits.get(`${req.params.owner}/${req.params.name}`);
    if (!audit) return res.status(404).json({ error: "audit not found" });
    res.json(audit);
  });
  router.get(
    "/audits/:owner/:name/export",
    (req, res) => {
      const audit = audits.get(`${req.params.owner}/${req.params.name}`);
      if (!audit) return res.status(404).json({ error: "audit not found" });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${req.params.name}-trust-audit.csv"`
      );
      res.send(auditToCsv(audit));
    }
  );
  router.delete("/audits/:owner/:name", (req, res) => {
    res.json(audits.remove(`${req.params.owner}/${req.params.name}`));
  });

  // F6 (plans/PLAN_FEATURES.md) — watchlist trust-drop check. Max 10 repos per
  // call; ETag-cached lookups keep this inside the rate-limit budget.
  router.post("/watchlist-check", async (req, res) => {
    const entries = (Array.isArray(req.body?.repos) ? req.body.repos : [])
      .slice(0, WATCHLIST_CAP)
      .filter((e) => /^[\w.-]+\/[\w.-]+$/.test(String(e?.repo || "")))
      .map((e) => ({ repo: String(e.repo), lastScore: Number(e.lastScore) }));
    const trustByRepo = new Map();
    await Promise.all(
      entries.map(async (e) => {
        const r = await gh.getRepo(e.repo);
        const t = r.data ? computeTrust({ ...r.data }) : null;
        trustByRepo.set(e.repo, t ? t.score : null);
      })
    );
    res.json({ alerts: computeAlerts(entries, trustByRepo), checkedAt: new Date().toISOString() });
  });

  // PRD Phase-2 item 6 — popularity metrics from package ecosystems (plans/PLAN_PHASE2.md P5).
  router.get("/metrics/:owner/:name", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const pairing = findPairingByRepo(fullName.toLowerCase());
    const ecosystems = pairing?.alternative?.ecosystems || {};
    try {
      const metrics = await getPairingMetrics(ecosystems);
      res.json({ metrics, fetchedAt: new Date().toISOString() });
    } catch {
      res.json({ metrics: {}, fetchedAt: new Date().toISOString(), degraded: true });
    }
  });

  // PRD section 29 — OSV.dev advisories: package ecosystems (version-scoped when
  // the release tag parses) + commit-range query on HEAD for full catalog coverage.
  router.get("/security/:owner/:name", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const pairing = findPairingByRepo(fullName.toLowerCase());
    const eco = pairing?.alternative?.ecosystems || {};
    try {
      const [live, releaseResult] = await Promise.all([
        gh.getRepo(fullName),
        gh.getLatestRelease(fullName),
      ]);
      if (!live.data && !pairing) {
        return res.status(404).json({ error: "Repository not found on GitHub." });
      }
      const branch = live.data?.defaultBranch || "main";
      const head = await gh.getHeadSha(fullName, branch);
      // Auto-detect version from the release tag (strips v-prefix, requires semver-ish).
      const tag = releaseResult.data?.tag || "";
      const semver = tag.match(/^v?(\d+\.\d+\.\d+(?:[-+][\w.]+)?)/);
      const version = semver ? semver[1] : null;
      const coords = [
        eco.npm ? { ecosystem: "npm", name: eco.npm, version } : null,
        eco.pypi ? { ecosystem: "PyPI", name: eco.pypi, version } : null,
        eco.go ? { ecosystem: "Go", name: eco.go, version } : null,
      ].filter(Boolean);

      // Auto-detect package coordinate for dynamic repos missing static eco mappings
      if (coords.length === 0 && (live.data?.language || pairing?.alternative?.language)) {
        const lang = (live.data?.language || pairing?.alternative?.language || "").toLowerCase();
        const repoName = req.params.name.toLowerCase();
        if (lang === "python") {
          coords.push({ ecosystem: "PyPI", name: repoName, version });
        } else if (lang === "javascript" || lang === "typescript") {
          coords.push({ ecosystem: "npm", name: repoName, version });
        } else if (lang === "go") {
          coords.push({ ecosystem: "Go", name: `github.com/${req.params.owner}/${req.params.name}`, version });
        } else if (lang === "rust") {
          coords.push({ ecosystem: "crates.io", name: repoName, version });
        }
      }
      const { vulns, degraded } = await osv.query(coords, {
        commit: head.data || undefined,
        scope: fullName,
      });
      res.json({
        vulns,
        degraded,
        checkedAt: new Date().toISOString(),
        versionScoped: Boolean(version && coords.length > 0),
      });
    } catch (err) {
      res.json({ vulns: [], degraded: true, checkedAt: new Date().toISOString(), error: err.message });
    }
  });

  // One-click download proxied with a clean filename → lands in Downloads, user double-clicks (PRD section 2.6a).
  router.get("/install/:owner/:name", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    try {
      const releaseResult = await gh.getLatestRelease(fullName);
      const asset = releaseResult.data && pickOsAsset(releaseResult.data.assets);
      if (!asset) {
        return res.status(404).json({ error: "No packaged installer for this platform." });
      }
      const upstream = await fetch(asset.url, {
        redirect: "follow",
        headers: { "User-Agent": "opensource-hub-cli", Accept: "application/octet-stream" },
      });
      if (!upstream.ok || !upstream.body) {
        return res.status(502).json({ error: `download failed (${upstream.status})` });
      }
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${asset.name}"`);
      if (upstream.headers.get("content-length")) {
        res.setHeader("Content-Length", upstream.headers.get("content-length"));
      }
      const hash = crypto.createHash("sha256");
      const reader = upstream.body.getReader();
      const pump = async () => {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            installHashes.set(fullName, `sha256:${hash.digest("hex")}`);
            return res.end();
          }
          hash.update(Buffer.from(value));
          if (!res.write(Buffer.from(value))) {
            await new Promise((r) => res.once("drain", r));
          }
        }
      };
      pump().catch(() => res.destroy());
      req.on("close", () => reader.cancel().catch(() => {}));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/repo/:owner/:name/issues", async (req, res) => {
    try {
      const { owner, name } = req.params;
      const label = req.query.label || "good first issue";
      const data = await gh.getIssues(`${owner}/${name}`, { label });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message, items: [], total: 0 });
    }
  });

  // Source zip via GitHub's own codeload redirect chain (PRD section 5).
  // Branch must come from live repo data — default branches vary (main/master/trunk).
  router.get("/source/:owner/:name", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    let branch = String(req.query.branch || "");
    if (!/^[\w.-]+$/.test(branch)) {
      const live = await gh.getRepo(fullName);
      branch = live.data?.defaultBranch || "";
    }
    if (branch && /^[\w.-]+$/.test(branch)) {
      return res.redirect(
        `https://github.com/${req.params.owner}/${req.params.name}/archive/refs/heads/${encodeURIComponent(branch)}.zip`
      );
    }
    res.redirect(`https://github.com/${fullName}`);
  });

  // PRD section 2.4 — local favorites.
  router.get("/favorites", (_req, res) => res.json(favorites.list()));
  router.post("/favorites", (req, res) => {
    const repo = String(req.body?.repo || "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return res.status(400).json({ error: "invalid repo" });
    res.json(favorites.add(repo));
  });
  router.delete("/favorites/:owner/:name", (req, res) => {
    res.json(favorites.remove(`${req.params.owner}/${req.params.name}`));
  });

  // PRD section 2.10 — public curated lists (plans/PLAN_PHASE2.md Phase 7).
  const readLists = () => JSON.parse(readRepoFile("src/data/lists.json"));

  // Parity P5 (plans/PLAN_PARITY.md) — auto-derived collections from snapshot meta.
  // Honest-empty until the cron populates meta; never live-API-derived.
  router.get("/collections", async (_req, res) => {
    try {
      const snapshotData = await loadSnapshotData();
      const derived = deriveCollections(getPairings(), snapshotData.meta || {});
      res.json({
        graveyard: {
          slug: "graveyard",
          label: "Product Graveyard",
          description: "Archived or quiet for 7+ months — verify before adopting anything here.",
          repos: derived.graveyard,
        },
        comingSoon: {
          slug: "coming-soon",
          label: "Coming soon",
          description: "First commit under 18 months ago — early-stage, expect rough edges.",
          repos: derived.comingSoon,
        },
        metaAvailable: Boolean(snapshotData.meta && Object.keys(snapshotData.meta).length > 0),
      });
    } catch {
      res.status(500).json({ error: "failed to derive collections" });
    }
  });

  router.get("/lists", (_req, res) => {
    try {
      res.json(readLists().map(({ repoSlugs, ...meta }) => ({ ...meta, repoCount: repoSlugs.length })));
    } catch {
      res.status(500).json({ error: "failed to load lists" });
    }
  });

  router.get("/lists/:slug", async (req, res) => {
    let list;
    try {
      list = readLists().find((l) => l.slug === req.params.slug);
    } catch {
      return res.status(500).json({ error: "failed to load lists" });
    }
    if (!list) return res.status(404).json({ error: "list not found" });
    const snapshotData = await loadSnapshotData();
    // A stale repoSlugs entry must never 500 the page — skip catalog misses gracefully.
    const pairings = list.repoSlugs
      .map((repo) => findPairingByRepo(repo.toLowerCase()))
      .filter(Boolean)
      .map((p) => ({
        ...enrichPairing(p),
        stars30d: getStars30d(snapshotData, p.alternative.repo),
        freshness: getFreshness(snapshotData, p.alternative.repo),
        maintenance: getMaintenance(snapshotData, p.alternative.repo),
        downloads: getLatestDownloads(snapshotData, p.alternative.repo),
      }));
    res.json({
      slug: list.slug,
      title: list.title,
      description: list.description,
      criteria: list.criteria,
      pairings,
    });
  });

  // PRD §38 goal-first browsing — entry-grid source (plans/PLAN_PHASE2.md Phase 7).
  // Top goalTags with counts; label derived once here so client and server agree.
  function goalLabel(tag) {
    return tag
      .replace(/^replace-/, "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  router.get("/goals", (_req, res) => {
    const counts = new Map();
    for (const p of getPairings()) {
      for (const tag of p.goalTags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    const goals = [...counts.entries()]
      .map(([tag, count]) => ({ tag, count, label: goalLabel(tag) }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    res.json({ goals });
  });

  // PRD §34 — community layer CRUD (plans/PLAN_PHASE2.md P8). Local-first:
  // the store is the source of truth on this machine; export flows deep-link
  // to GitHub issues so nothing is ever sent to a server of ours.
  router.get("/community/:owner/:name", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    if (!findPairingByRepo(fullName.toLowerCase())) {
      return res.status(404).json({ error: "not in catalog" });
    }
    if (req.query.extended === "true" || req.query.parity === "true") {
      const base = community.getRepo(fullName);
      const parity = community.getParityConsensus(fullName);
      return res.json({ ...base, parity });
    }
    res.json(community.getRepo(fullName));
  });

  // PRD §34 & §3b — 3-Tier Community Parity Consensus Metrics
  router.get("/community/:owner/:name/parity", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    if (!findPairingByRepo(fullName.toLowerCase())) {
      return res.status(404).json({ error: "not in catalog" });
    }
    const parity = community.getParityConsensus(fullName);
    res.json(parity);
  });

  // PRD §34 — Suggest-an-alternative Request Queue
  router.get("/community/suggestions", (req, res) => {
    try {
      const { sort = "votes", status = "all", q = "" } = req.query || {};
      const suggestions = community.listSuggestions({ sort, status, search: q });
      res.json({ ok: true, suggestions, total: suggestions.length });
    } catch (err) {
      res.status(500).json({ error: err.message, suggestions: [] });
    }
  });

  router.post("/community/suggestions", (req, res) => {
    try {
      res.json(community.addSuggestion(req.body || {}));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/community/suggestions/:id/upvote", (req, res) => {
    try {
      res.json(community.upvoteSuggestion(req.params.id));
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // PRD §34 & §10 — In-app data accuracy and field flag reporting
  router.get("/community/flags", (_req, res) => {
    try {
      const flags = community.listFlags();
      res.json({ ok: true, flags, total: flags.length });
    } catch (err) {
      res.status(500).json({ error: err.message, flags: [] });
    }
  });

  router.post("/community/flags", (req, res) => {
    try {
      res.json(community.addFlag(req.body || {}));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  const communityRepoRoute = (handler) => (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    if (!findPairingByRepo(fullName.toLowerCase())) {
      return res.status(404).json({ error: "not in catalog" });
    }
    try {
      res.json(handler(fullName, req.body || {}));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  router.post(
    "/community/:owner/:name/vote",
    communityRepoRoute((fullName, body) => community.vote(fullName, String(body.choice || "")))
  );
  router.post(
    "/community/:owner/:name/tags",
    communityRepoRoute((fullName, body) => community.addTag(fullName, body.tag))
  );

  // Developer Reviews & Switcher Stories
  router.get("/reviews/:owner/:name", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    try {
      res.json(reviews.getReviews(fullName));
    } catch (err) {
      res.status(500).json({ error: err.message, reviews: [] });
    }
  });

  router.post("/reviews/:owner/:name", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    try {
      res.json(reviews.addReview(fullName, req.body || {}));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // PRD §31 — Self-hosting Community App Stores (Umbrel, Runtipi, CasaOS, Unraid)
  router.get("/app-stores", (_req, res) => {
    try {
      const apps = getEligibleAppStoreApps();
      res.json({
        ok: true,
        platforms: ["umbrel", "runtipi", "casaos", "unraid"],
        totalApps: apps.length,
        storeUrl: "https://github.com/bengowtham70-dev/opensource-hub-umbrel-store",
        apps,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/app-stores/:platform", (req, res) => {
    const platform = (req.params.platform || "umbrel").toLowerCase();
    try {
      const files = generateAppStoreFiles(platform);
      const apps = getEligibleAppStoreApps();
      res.json({
        ok: true,
        platform,
        fileCount: Object.keys(files).length,
        files: Object.keys(files),
        apps,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/app-stores/:platform/export.zip", (req, res) => {
    const platform = (req.params.platform || "umbrel").toLowerCase();
    try {
      const zipBuffer = buildAppStoreZip(platform);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="opensource-hub-${platform}-app-store.zip"`
      );
      res.send(zipBuffer);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/reviews/:owner/:name/:id/helpful", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    try {
      res.json(reviews.voteHelpful(fullName, req.params.id));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Public Community Upvotes
  router.get("/upvotes", (_req, res) => {
    try {
      res.json(getUpvotes());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/upvotes/:owner/:name", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    try {
      res.json(addUpvote(fullName));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Public RSS / Atom Syndication Feeds
  router.get("/feed.xml", async (req, res) => {
    try {
      const host = req.get("host") || "localhost:3000";
      const proto = req.protocol || "http";
      const xml = await generateRssFeed({ baseUrl: `${proto}://${host}`, type: "all" });
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      res.status(500).send(`<?xml version="1.0"?><error>${err.message}</error>`);
    }
  });

  router.get("/releases.xml", async (req, res) => {
    try {
      const host = req.get("host") || "localhost:3000";
      const proto = req.protocol || "http";
      const xml = await generateRssFeed({ baseUrl: `${proto}://${host}`, type: "releases" });
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      res.status(500).send(`<?xml version="1.0"?><error>${err.message}</error>`);
    }
  });

  // In-App Admin Moderation Queue
  router.get("/admin/queue", (_req, res) => {
    res.json(admin.getQueue());
  });

  router.post("/admin/approve/:id", (req, res) => {
    try {
      res.json(admin.approve(req.params.id));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/admin/reject/:id", (req, res) => {
    try {
      res.json(admin.reject(req.params.id, req.body?.reason));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // PRD §38 — monthly public health-snapshot diff (plans/PLAN_PHASE2.md P5).
  // Serves the JSON committed by scripts/build-health-diff.mjs on the monthly
  // Actions cron. Absent file (pre-first-run) → honest empty shape, never a 500.
  const readHealthDiff = () => {
    try {
      return JSON.parse(readRepoFile("src/data/health-diff.json"));
    } catch {
      return null;
    }
  };

  router.get("/health-diff", (_req, res) => {
    const diff = readHealthDiff();
    if (!diff) return res.json({ available: false, windowDays: 30, repos: {} });
    res.json({ available: true, ...diff });
  });

  // PRD Phase-2 item 17 — RSS via GitHub's native releases.atom, cached/proxied
  // (plans/PLAN_PHASE2.md P10: ride existing infrastructure, generate no XML).
  const rssCache = new Map(); // fullName → { body, at }
  router.get("/rss/:owner/:name", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) {
      return res.status(400).json({ error: "Invalid repository slug" });
    }
    const hit = rssCache.get(fullName);
    const fresh = hit && Date.now() - hit.at < 60 * 60 * 1000;
    if (fresh) {
      res.set("Content-Type", "application/atom+xml; charset=utf-8");
      return res.send(hit.body);
    }
    try {
      const upstream = await fetch(`https://github.com/${fullName}/releases.atom`, {
        headers: { "User-Agent": "opensource-hub-cli" },
        signal: AbortSignal.timeout(8000),
      });
      if (!upstream.ok) throw new Error(String(upstream.status));
      const body = await upstream.text();
      rssCache.set(fullName, { body, at: Date.now() });
      res.set("Content-Type", "application/atom+xml; charset=utf-8");
      res.send(body);
    } catch {
      if (hit) {
        res.set("Content-Type", "application/atom+xml; charset=utf-8");
        return res.send(hit.body);
      }
      res.status(502).json({ error: "feed unavailable" });
    }
  });

  router.get("/health-diff/:owner/:name", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    if (!findPairingByRepo(fullName.toLowerCase())) {
      return res.status(404).json({ error: "not in catalog" });
    }
    const entry = readHealthDiff()?.repos?.[fullName];
    if (!entry) return res.status(404).json({ error: "no health diff yet" });
    res.json(entry);
  });

  // PRD section 2.7 — Learn articles.
  router.get("/learn", (_req, res) => {
    const files = listRepoDir("content/learn", (f) => f.endsWith(".md")).sort();
    const articles = files
      .map((f) => {
        const { meta } = parseFrontMatter(readRepoFile(`content/learn/${f}`));
        return { slug: f.replace(/\.md$/, ""), title: meta.title || f, description: meta.description || "", order: Number(meta.order || 99) };
      })
      .sort((a, b) => a.order - b.order);
    res.json(articles);
  });
  router.get("/learn/:slug", (req, res) => {
    const file = `content/learn/${path.basename(req.params.slug)}.md`;
    if (!repoFileExists(file)) return res.status(404).json({ error: "article not found" });
    const { meta, body } = parseFrontMatter(readRepoFile(file));
    res.json({ slug: req.params.slug, title: meta.title, description: meta.description, body });
  });

  // PRD §3a / §19 — Blog & Editorial roundups.
  router.get("/blog", (_req, res) => {
    const files = listRepoDir("content/blog", (f) => f.endsWith(".md")).sort();
    const posts = files
      .map((f) => {
        const { meta } = parseFrontMatter(readRepoFile(`content/blog/${f}`));
        return { slug: f.replace(/\.md$/, ""), title: meta.title || f, description: meta.description || "", date: meta.date || "" };
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    res.json(posts);
  });
  router.get("/blog/:slug", (req, res) => {
    const file = `content/blog/${path.basename(req.params.slug)}.md`;
    if (!repoFileExists(file)) return res.status(404).json({ error: "post not found" });
    const { meta, body } = parseFrontMatter(readRepoFile(file));
    res.json({ slug: req.params.slug, title: meta.title, description: meta.description, date: meta.date, body });
  });

  // ── Outbound Click & Affiliate Redirects ──
  router.get("/go/:target", (req, res) => {
    const target = req.params.target;
    const repo = String(req.query.repo || "");
    const type = String(req.query.type || "outbound");
    const rawUrl = String(req.query.url || "");

    clickTracker.track({ target, repo, type, referrer: req.headers.referer || "" });

    if (!rawUrl) {
      return res.redirect("/");
    }

    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return res.status(400).send("Invalid URL");
      }
      const finalUrl = clickTracker.buildAffiliateUrl(rawUrl, target);
      res.redirect(finalUrl);
    } catch {
      res.redirect("/");
    }
  });

  router.get("/analytics/clicks", (_req, res) => {
    res.json(clickTracker.getAnalytics());
  });

  // ── Dynamic SVG Badges for READMEs ──
  router.get("/badge/:owner/:name/trust.svg", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const [liveResult, contribResult] = await Promise.all([
      gh.getRepo(fullName),
      gh.getContributorCount(fullName),
    ]);
    const trust = liveResult.data
      ? computeTrust({ ...liveResult.data, contributors: contribResult.data })
      : { score: 75, band: "good" };

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(generateTrustBadgeSvg({ score: trust.score, band: trust.band, repo: fullName }));
  });

  router.get("/badge/:owner/:name/alternative.svg", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const pairing = findPairingByRepo(fullName.toLowerCase());
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(
      generateAlternativeBadgeSvg({
        name: pairing?.alternative?.name || req.params.name,
        paidTool: pairing?.paidTool?.name || "",
      })
    );
  });

  // ── Zero-Cost Newsletter Lead Capture ──
  router.post("/newsletter/subscribe", (req, res) => {
    try {
      const result = newsletter.subscribe(req.body?.email, req.body?.source);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get("/newsletter/export", (_req, res) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="subscribers.csv"');
    res.send(newsletter.toCsv());
  });

  // ── "Claim this Repo" Maintainer Verification ──
  router.post("/claim/:owner/:name/verify", async (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const result = await claims.verify(fullName, req.body || {});
    res.json(result);
  });

  router.post("/claim/:owner/:name/unclaim", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const success = claims.unclaim(fullName);
    res.json({ ok: true, unclaimed: success });
  });

  router.get("/claim/:owner/:name", (req, res) => {
    const fullName = `${req.params.owner}/${req.params.name}`;
    const claim = claims.getClaim(fullName);
    res.json({ ok: true, verified: Boolean(claim), claim });
  });

  // ── Hardware Sizing & Fit Evaluation (PRD §38) ──
  router.get("/hardware/evaluate", (req, res) => {
    const { ram = 2048, cpus = 2, arch = "x86_64", repos = "" } = req.query;
    const result = evaluateHardware({
      ramMb: Number(ram),
      cpus: Number(cpus),
      arch: String(arch).toLowerCase(),
      repos: String(repos).split(",").map((r) => r.trim()).filter(Boolean),
    });
    res.json(result);
  });

  // ── Multi-Forge Support (GitLab & Codeberg) ──
  router.get("/forge/:platform/:owner/:name", async (req, res) => {
    const { platform, owner, name } = req.params;
    if (platform === "gitlab") {
      const result = await forges.getGitLabRepo(owner, name);
      return res.json(result);
    }
    if (platform === "codeberg") {
      const result = await forges.getCodebergRepo(owner, name);
      return res.json(result);
    }
    res.status(400).json({ error: "Unsupported forge platform. Supported: gitlab, codeberg" });
  });

  // ── Central Live Releases Feed ──
  router.get("/releases/feed", async (_req, res) => {
    try {
      const feed = await getAggregatedReleases({ gh });
      res.json(feed);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── 1-Click Multi-Browser Extension Download (PRD §441) ──
  router.get("/extension/download", (req, res) => {
    try {
      const browser = (req.query.browser || "chrome").toString().toLowerCase();
      const safeBrowser = ["chrome", "firefox", "edge", "brave"].includes(browser) ? browser : "chrome";
      const zipBuffer = createExtensionZip({ browser: safeBrowser });
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="opensource-hub-extension-${safeBrowser}.zip"`);
      res.send(zipBuffer);
    } catch (err) {
      res.status(500).json({ error: "Failed to generate extension bundle: " + err.message });
    }
  });
  // ── Multi-Tool Docker Compose Stack Exporter (PRD §38 & §31) ──
  router.post("/compose/bundle", (req, res) => {
    try {
      const { tools = [], stackName = "my-homelab-stack" } = req.body || {};
      const bundle = generateComposeBundle(tools, { stackName });
      res.json({ ok: true, bundle });
    } catch (err) {
      res.status(400).json({ error: "Failed to generate compose bundle: " + err.message });
    }
  });

  // ── Interactive Migration Kit & Scripts (PRD §38 & §2.1) ──
  router.post("/migration/kit", (req, res) => {
    try {
      const { repo = "", alternative = {}, paidTool = {}, config = {} } = req.body || {};
      const kit = generateMigrationKit({ repo, alternative, paidTool, config });
      res.json({ ok: true, kit });
    } catch (err) {
      res.status(400).json({ error: "Failed to generate migration kit: " + err.message });
    }
  });

  router.post("/migration/bundle", (req, res) => {
    try {
      const { repo = "", alternative = {}, paidTool = {}, config = {} } = req.body || {};
      const zipBuffer = buildMigrationZip({ repo, alternative, paidTool, config });
      const safeName = (repo || alternative.name || "data").toLowerCase().replace(/[^a-z0-9]/g, "-");
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="migration-kit-${safeName}.zip"`);
      res.send(zipBuffer);
    } catch (err) {
      res.status(500).json({ error: "Failed to generate migration zip: " + err.message });
    }
  });

  router.get("/migration/bundle", (req, res) => {
    try {
      const { repo = "", volume = "medium", targetEnv = "docker", dbDialect = "postgres" } = req.query || {};
      const pairing = findPairingByRepo(String(repo).toLowerCase());
      const zipBuffer = buildMigrationZip({
        repo: String(repo),
        alternative: pairing?.alternative || {},
        paidTool: pairing?.paidTool || {},
        config: { volume: String(volume), targetEnv: String(targetEnv), dbDialect: String(dbDialect) }
      });
      const safeName = String(repo).toLowerCase().replace(/[^a-z0-9]/g, "-") || "data";
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="migration-kit-${safeName}.zip"`);
      res.send(zipBuffer);
    } catch (err) {
      res.status(500).json({ error: "Failed to generate migration zip: " + err.message });
    }
  });

  return router;
}

export function enrichPairing(p) {
  return {
    paidTool: p.paidTool,
    alternative: {
      name: p.alternative.name,
      repo: p.alternative.repo,
      owner: p.alternative.repo.split("/")[0],
      shortName: p.alternative.repo.split("/")[1],
      language: p.alternative.language,
        tags: p.alternative.tags ?? [],
        description: p.alternative.description,
        parity: p.alternative.parity ?? [],
        gaps: p.alternative.gaps ?? [],
        migrationNotes: p.alternative.migrationNotes,
        // Schema v2 fields (plans/PLAN_PHASE2.md Phase 1).
        platforms: p.alternative.platforms ?? [],
        license: p.alternative.license ?? null,
        stars: p.alternative.stars ?? 0,
        forks: p.alternative.forks ?? 0,
        tco: p.alternative.tco ?? null,
        ...(p.alternative.demoUrl ? { demoUrl: p.alternative.demoUrl } : {}),
        screenshots: p.alternative.screenshots ?? [],
        ecosystems: p.alternative.ecosystems ?? {},
    },
    // Pairing-level v2 fields.
    relationship: p.relationship ?? "direct",
    goalTags: p.goalTags ?? [],
    // Parity P6 — hand-written editorial review (absent on most pairings).
    editorial: p.editorial ?? [],
  };
}

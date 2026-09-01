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
import { generateTrustBadgeSvg, generateAlternativeBadgeSvg } from "./badge.js";
import { createNewsletterStore } from "./newsletter.js";
import { createClaimStore } from "./claim.js";
import { createForgeClient } from "./forges.js";
import { createExtensionZip } from "./extension-pack.js";
import { getAggregatedReleases } from "./releases.js";
import { createReviewStore } from "./reviews.js";
import { createAdminStore } from "./admin.js";

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
  const osv = createOsvClient({ cacheDir: getUserDataDir() });
  // Hash-on-download fallback: sha256 computed during /install streams when the
  // release asset lacks GitHub's `digest` field (plans/PLAN_PHASE2.md P4).
  const installHashes = new Map();

  // PRD section 2.3 — trending views.
  router.get("/trending", async (_req, res) => {
    try {
      res.json(await computeTrending("today"));
    } catch {
      res.status(500).json({ error: "failed to compute trending" });
    }
  });
  router.get("/trending/:view", async (req, res) => {
    try {
      res.json(await computeTrending(req.params.view));
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
    const results = searchPairings({
      q: String(req.query.q || ""),
      language: String(req.query.language || ""),
      platform: String(req.query.platform || ""),
      license: String(req.query.license || ""),
      // PRD §38 goal-first browsing — pre-filtered view per entry-grid tile.
      goal: String(req.query.goal || ""),
    });
    const snapshotData = await loadSnapshotData();
    res.json({
      count: results.length,
      generatedAt: snapshotData.generatedAt,
      origin: snapshotData.origin,
      results: results.map((p) => ({
        ...enrichPairing(p),
        stars30d: getStars30d(snapshotData, p.alternative.repo),
        // PRD Phase-2 item 6 — freshness for the card pill (null on seed data).
        freshness: getFreshness(snapshotData, p.alternative.repo),
        maintenance: getMaintenance(snapshotData, p.alternative.repo),
        // PRD section 35 — downloads row source (weekly snapshot sample).
        downloads: getLatestDownloads(snapshotData, p.alternative.repo),
      })),
    });
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
        return res.status(404).json({ error: "Repository not found on GitHub." });
      }
      const cat = liveResult.data.topics?.[0] ? liveResult.data.topics[0].replace(/-/g, " ") : "Developer Tools";
      pairing = {
        paidTool: {
          name: liveResult.data.name,
          slug: liveResult.data.name.toLowerCase(),
          category: cat.charAt(0).toUpperCase() + cat.slice(1),
          pricePerMonth: 0,
          tags: liveResult.data.topics || [],
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
        relationship: "direct",
        parity: 95,
        features: [
          { name: "Full Open Source Codebase", parity: true },
          { name: "Self-Hostable Deployment", parity: true },
          { name: "Active Community & Commits", parity: true },
        ],
        savings: { yearly: 0, formula: "Community Open Source" },
        tradeoffs: [],
      };
    }

    const stars30 = getStars30d(snapshotData, fullName);
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
    });
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
          const pairing = findPairingByRepo(String(it.repo).toLowerCase());
          return {
            ...it,
            pairing: pairing ? enrichPairing(pairing) : null,
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
    res.json(community.getRepo(fullName));
  });

  router.post("/community/suggestions", (req, res) => {
    try {
      res.json(community.addSuggestion(req.body || {}));
    } catch (err) {
      res.status(400).json({ error: err.message });
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
    if (!findPairingByRepo(fullName.toLowerCase())) {
      return res.status(404).json({ error: "not in catalog" });
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
    const result = await claims.verify(fullName);
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

  // ── 1-Click Chrome Extension Download ──
  router.get("/extension/download", (_req, res) => {
    try {
      const zipBuffer = createExtensionZip();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="opensource-hub-extension.zip"');
      res.send(zipBuffer);
    } catch (err) {
      res.status(500).json({ error: "Failed to generate extension bundle: " + err.message });
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

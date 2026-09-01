import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApiRouter } from "./routes.js";
import { createFavoritesStore } from "./store.js";
import { createCommunityStore } from "./community.js";
import { createUsageStore } from "./usage.js";
import { createReviewStore } from "./reviews.js";
import { getUserDataDir } from "./paths.js";
import { readRepoFile, repoFileExists, listRepoDir, isEmbeddedMode } from "./repo-files.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "../..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
};

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  const favorites = createFavoritesStore();
  const community = createCommunityStore();
  const reviews = createReviewStore();
  // PRD §16 — strictly local usage counters (privacy.html discloses this).
  // One instance shared by the router (export) and the increment/readback below.
  const usage = createUsageStore({ dir: getUserDataDir() });
  usage.increment();
  app.use("/api", createApiRouter({ favorites, community, usage, reviews }));

  // plans/PLAN_PHASE2.md Phase 9 — dashboard assets come either from disk
  // (npm install, PRD section 5) or from the embedded payload inside a
  // Bun-compiled single-file binary (PRD section 30). Same routes either way.
  const diskDist = path.join(projectRoot, "dist", "client");
  const hasBuild = isEmbeddedMode()
    ? repoFileExists("dist/client/index.html")
    : fs.existsSync(path.join(diskDist, "index.html"));

  if (hasBuild && !isEmbeddedMode()) {
    app.use(express.static(diskDist, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    // SPA fallback — dashboard routes like /repo/:owner/:name resolve to index.html.
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(diskDist, "index.html"));
    });
  } else if (hasBuild) {
    const send = (res, key) => {
      res.setHeader("Content-Type", MIME[path.extname(key)] || "application/octet-stream");
      res.send(readRepoFile(key));
    };
    const assetNames = new Set(listRepoDir("dist/client"));
    app.get(/^(?!\/api\/).*/, (req, res) => {
      const rel = decodeURIComponent(req.path.replace(/^\/+/, ""));
      const key =
        rel && assetNames.has(rel) ? `dist/client/${rel}` : "dist/client/index.html";
      send(res, key);
    });
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, built: hasBuild });
  });

  app.get("/api/usage", (_req, res) => res.json(usage.get()));

  return { app, hasBuild };
}

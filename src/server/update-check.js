// PRD section 14 / PLAN_PHASE2 Phase 9 — CLI in-app update notifier.
// Compares the installed version against the npm registry with a 24h TTL
// disk cache in the user-data dir. Every failure path is silent: an offline
// machine, an unpublished package (404), or a malformed response must never
// print anything or slow startup down.
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export function parseVersion(v) {
  const m = String(v || "")
    .trim()
    .replace(/^v/i, "")
    .match(/^(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

export function isNewer(current, latest) {
  const c = parseVersion(current);
  const l = parseVersion(latest);
  if (!c || !l) return false;
  for (let i = 0; i < 3; i += 1) {
    if (l[i] !== c[i]) return l[i] > c[i];
  }
  return false;
}

export async function checkForUpdate({
  currentVersion,
  packageName = "opensource-hub",
  cacheDir,
  ttlMs = DEFAULT_TTL_MS,
  fetchImpl = globalThis.fetch,
  now = Date.now,
} = {}) {
  const cacheFile = path.join(cacheDir, "update-check.json");
  let cached = null;
  try {
    cached = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch {
    /* first run or corrupt cache — treated as no cache */
  }

  let latest = typeof cached?.latest === "string" ? cached.latest : null;
  const expired = !cached?.checkedAt || now() - cached.checkedAt > ttlMs;
  if (!latest || expired) {
    try {
      const res = await fetchImpl(`https://registry.npmjs.org/${packageName}/latest`, {
        headers: { "User-Agent": "opensource-hub-cli" },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const json = await res.json();
        if (typeof json.version === "string") {
          latest = json.version;
          try {
            fs.mkdirSync(cacheDir, { recursive: true });
            fs.writeFileSync(cacheFile, JSON.stringify({ checkedAt: now(), latest }));
          } catch {
            /* cache write is best-effort */
          }
        }
      }
    } catch {
      // Network down / timeout: fall back to whatever cache we had (possibly none).
    }
  }

  if (!latest || !isNewer(currentVersion, latest)) return null;
  return { currentVersion, latest };
}

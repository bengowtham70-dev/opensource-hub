// PRD section 2.9 — populate `screenshots` in alternatives.json from each
// repo's own README images (the most honest source: what the project shows
// of itself). Keyless GitHub REST; GITHUB_TOKEN raises the rate limit if set.
// Every candidate URL is HEAD-validated before being written — no dead links
// ever reach the catalog. Usage: node scripts/fetch-screenshots.mjs [--force]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "src", "data", "alternatives.json");
const FORCE = process.argv.includes("--force");
const MAX_PER_REPO = 3;

// README imagery that is metadata, not screenshots.
const BAD_URL = /shields\.io|badge|travis|circleci|codecov|coveralls|npmjs\.com|pypi\/badge|discord|matrix\.to|opencollective|buymeacoffee|paypal|snyk|deepwiki|release-please|github\.com\/.*\/workflows|contrib\.rocks|allcontributors/i;
// App icons / logos are branding, not screenshots (e.g. Assets/LinuxIcons/...).
const BAD_PATH = /(^|\/)(icons?|logos?|brands?|branding|favicon|splash|sponsors?|backers?|donors?)(\/|$)|favicon|\b\d{3}x\d{3}\b/i;

function getRepos(data) {
  return [...new Set(data.pairings.map((p) => p.alternative.repo))];
}

function extractImages(markdown, baseUrl) {
  const found = [];
  const push = (src, alt) => {
    try {
      const url = new URL(src, baseUrl).toString();
      if (!/^https?:/.test(url)) return;
      if (!/\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url)) return; // screenshots are raster; svg = badges/logos
      if (BAD_URL.test(url)) return;
      if (BAD_PATH.test(new URL(url).pathname)) return;
      found.push({ src: url, alt: (alt || "").trim().slice(0, 120) });
    } catch {
      /* unparseable URL — skip */
    }
  };
  for (const m of markdown.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) push(m[2], m[1]);
  for (const m of markdown.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    const alt = m[0].match(/alt=["']([^"']*)["']/i)?.[1];
    push(m[1], alt || "");
  }
  // De-duplicate by src, keep first occurrences.
  const seen = new Set();
  return found.filter((f) => !seen.has(f.src) && seen.add(f.src)).slice(0, MAX_PER_REPO + 2); // headroom before validation
}

async function validate(url) {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    if (res.ok) return true;
    // Some raw hosts reject HEAD — retry with a ranged GET as fallback.
    const get = await fetch(url, { headers: { Range: "bytes=0-64" }, signal: AbortSignal.timeout(8000) });
    return get.ok;
  } catch {
    return false;
  }
}

async function fetchReadme(repo, headers) {
  // Preferred: raw.githubusercontent HEAD ref — default branch, no API rate limit.
  for (const name of ["README.md", "readme.md", "Readme.md", "README.rst"]) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/${name}`, {
        headers: { "User-Agent": "opensource-hub-screenshots" },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        return { markdown: await res.text(), baseUrl: `https://raw.githubusercontent.com/${repo}/HEAD/` };
      }
    } catch {
      /* try next */
    }
  }
  // Fallback: REST readme endpoint (handles exotic names/branches; rate limited).
  const res = await fetch(`https://api.github.com/repos/${repo}/readme`, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`readme ${res.status}${res.status === 403 ? " (rate limit? set GITHUB_TOKEN)" : ""}`);
  const json = await res.json();
  return { markdown: Buffer.from(json.content, "base64").toString("utf8"), baseUrl: json.download_url };
}

// Hard per-repo deadline — a wedged DNS/TLS handshake must never stall the
// whole batch (AbortSignal.timeout alone cannot cancel the DNS lookup phase).
function withDeadline(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms).unref()
    ),
  ]);
}

const REPO_DEADLINE_MS = 25000;

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "opensource-hub-screenshots",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const data = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const repos = getRepos(data);
  let updated = 0;
  let checked = 0;

  for (const repo of repos) {
    const pairing = data.pairings.find((p) => p.alternative.repo === repo);
    if (!pairing) continue;
    if (!FORCE && Array.isArray(pairing.alternative.screenshots) && pairing.alternative.screenshots.length > 0) {
      continue;
    }
    checked += 1;
    try {
      const valid = await withDeadline(
        (async () => {
          const { markdown, baseUrl } = await withDeadline(fetchReadme(repo, headers), 12000, `${repo} readme`);
          const candidates = extractImages(markdown, baseUrl);
          const found = [];
          for (const c of candidates) {
            if (found.length >= MAX_PER_REPO) break;
            if (await withDeadline(validate(c.src), 8000, `${repo} validate`)) found.push(c);
          }
          return found;
        })(),
        REPO_DEADLINE_MS,
        repo
      );
      if (valid.length > 0) {
        // Schema contract: every screenshot carries descriptive alt text —
        // fall back to a generated caption when the README author omitted it.
        pairing.alternative.screenshots = valid.map((s, i) => ({
          ...s,
          alt: s.alt || `${pairing.alternative.name} screenshot ${i + 1}`,
        }));
        updated += 1;
        console.log(`  ✓ ${repo}: ${valid.length} screenshot(s)`);
      } else {
        console.log(`  · ${repo}: no valid README imagery`);
      }
    } catch (err) {
      console.log(`  ⚠ ${repo}: ${err.message}`);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nDone — ${updated}/${checked} repos gained screenshots.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

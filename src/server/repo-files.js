import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// plans/PLAN_PHASE2.md Phase 9 — single-file binary support (PRD section 30).
// A Bun-compiled executable has no real project directory on disk, so runtime
// fs reads of catalog/learn/client files fail. The release pipeline therefore
// generates payload.generated.js (gitignored) containing every needed file,
// and this module becomes the single resolution point:
//   npm install  → real fs reads, exactly as before (zero regression)
//   bun binary   → reads served from the registered in-binary payload map
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "../..");

let payload = null;

export function registerPayload(map) {
  payload = map;
}

// Called once at boot (run()); no-op for npm installs where the generated
// module was never shipped. Dynamic literal specifier so bundlers keep it.
export async function initEmbeddedPayload() {
  if (payload) return;
  try {
    await import("./payload.generated.js");
  } catch {
    /* normal npm install — everything lives on disk */
  }
}

export function isEmbeddedMode() {
  return payload !== null;
}

function normalize(rel) {
  return rel.split(path.sep).join("/");
}

// Read a project-root-relative file: disk first, embedded payload second.
export function readRepoFile(rel) {
  const key = normalize(rel);
  if (!payload) {
    return fs.readFileSync(path.join(projectRoot, key), "utf8");
  }
  const hit = payload[key];
  if (hit === undefined) {
    throw new Error(`embedded asset missing: ${key}`);
  }
  return hit;
}

export function repoFileExists(rel) {
  const key = normalize(rel);
  return payload ? Object.prototype.hasOwnProperty.call(payload, key) : fs.existsSync(path.join(projectRoot, key));
}

// Directory listing across both modes (used for content/learn).
export function listRepoDir(rel, filterFn = () => true) {
  const prefix = `${normalize(rel)}/`;
  if (payload) {
    return Object.keys(payload)
      .filter((k) => k.startsWith(prefix))
      .filter(filterFn)
      .map((k) => k.slice(prefix.length));
  }
  return fs.readdirSync(path.join(projectRoot, prefix)).filter(filterFn);
}

export { projectRoot };

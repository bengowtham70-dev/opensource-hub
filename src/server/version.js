import { readRepoFile } from "./repo-files.js";

// plans/PLAN_PHASE2.md Phase 9 — version resolution works both on disk (npm)
// and inside Bun-compiled binaries (embedded payload), PRD section 30.
export function getPackageVersion() {
  try {
    return JSON.parse(readRepoFile("package.json")).version;
  } catch {
    return "0.0.0";
  }
}

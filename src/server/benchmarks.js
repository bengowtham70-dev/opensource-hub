import fs from "node:fs";
import path from "node:path";
import { readRepoFile } from "./repo-files.js";

let benchmarksCache = null;

export function getBenchmarksData() {
  if (!benchmarksCache) {
    try {
      const raw = readRepoFile("src/data/benchmarks.json");
      benchmarksCache = JSON.parse(raw);
    } catch {
      benchmarksCache = { benchmarks: {} };
    }
  }
  return benchmarksCache.benchmarks || {};
}

export function getRepoBenchmark(repo) {
  const data = getBenchmarksData();
  const clean = String(repo).toLowerCase();
  if (data[clean]) return { ...data[clean], isVerifiedSpec: true };

  const shortName = clean.includes("/") ? clean.split("/")[1] : clean;
  for (const [key, val] of Object.entries(data)) {
    if (key.endsWith(`/${shortName}`) || key === shortName) {
      return { ...val, isVerifiedSpec: true };
    }
  }
  return null;
}

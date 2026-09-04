import benchmarksData from "../../../src/data/benchmarks.json";

const BENCHMARKS = benchmarksData.benchmarks || {};

/**
 * Get verified benchmarks for a repo or generate sensible architectural estimates.
 * @param {string} repo - e.g. "supabase/supabase" or "pocketbase/pocketbase"
 * @param {object} [fallbackMeta] - optional metadata from tool pairing (language, platforms)
 */
export function getToolBenchmarks(repo = "", fallbackMeta = {}) {
  const cleanRepo = String(repo).toLowerCase();
  
  // Direct match
  if (BENCHMARKS[cleanRepo]) {
    return {
      ...BENCHMARKS[cleanRepo],
      isVerifiedSpec: true,
    };
  }

  // Check by repository name match (e.g. "supabase" or "pocketbase")
  const shortName = cleanRepo.includes("/") ? cleanRepo.split("/")[1] : cleanRepo;
  for (const [key, data] of Object.entries(BENCHMARKS)) {
    if (key.endsWith(`/${shortName}`) || key === shortName) {
      return {
        ...data,
        isVerifiedSpec: true,
      };
    }
  }

  // Graceful heuristic fallback based on language & platforms
  const lang = (fallbackMeta.language || "").toLowerCase();
  const isGo = lang.includes("go");
  const isRust = lang.includes("rust");
  const isPython = lang.includes("python");
  const isJava = lang.includes("java");
  const isJs = lang.includes("javascript") || lang.includes("typescript");

  const isDesktop = (fallbackMeta.platforms || []).includes("win") || (fallbackMeta.platforms || []).includes("mac");
  const isSelfHost = (fallbackMeta.platforms || []).includes("self-host") || (fallbackMeta.platforms || []).includes("docker");

  let idleRamMb = 350;
  let containerSizeMb = 300;
  let coldStartMs = 1500;
  let dbEngine = "Embedded SQLite / Optional PostgreSQL";
  let arch = "Client-Server Web App";
  let difficultyRating = 2;

  if (isGo || isRust) {
    idleRamMb = 60;
    containerSizeMb = 75;
    coldStartMs = 120;
    arch = "Single Compiled Binary";
    difficultyRating = 1;
  } else if (isJs) {
    idleRamMb = isDesktop ? 180 : 250;
    containerSizeMb = 220;
    coldStartMs = 850;
    arch = isDesktop ? "Desktop Local-First App" : "Node.js Web App";
  } else if (isPython) {
    idleRamMb = 450;
    containerSizeMb = 400;
    coldStartMs = 2200;
    arch = "Python WSGI/ASGI Service";
  } else if (isJava) {
    idleRamMb = 1200;
    containerSizeMb = 550;
    coldStartMs = 4500;
    arch = "JVM Microservice Stack";
    difficultyRating = 3;
  }

  return {
    databaseEngine: dbEngine,
    runtime: fallbackMeta.language ? `${fallbackMeta.language} Runtime` : "Compiled Native",
    idleRamMb,
    containerSizeMb,
    coldStartMs,
    architecture: arch,
    protocols: ["REST", "WebSockets"],
    auth: ["Native JWT", "OAuth2"],
    offlineFirst: isDesktop,
    difficultyRating,
    idealFor: "Standard self-hosted deployment with moderate operational footprint.",
    isVerifiedSpec: false,
  };
}

export function formatRam(mb) {
  if (!mb && mb !== 0) return "—";
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export function formatImageSize(mb) {
  if (!mb && mb !== 0) return "—";
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export function formatBootTime(ms) {
  if (!ms && ms !== 0) return "—";
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)} s`;
  }
  return `${ms} ms`;
}

export function computeSavingsRatio(mbA, mbB) {
  if (!mbA || !mbB || mbA === mbB) return null;
  const smaller = Math.min(mbA, mbB);
  const larger = Math.max(mbA, mbB);
  const pct = Math.round(((larger - smaller) / larger) * 100);
  return {
    smallerMb: smaller,
    largerMb: larger,
    pctSavings: pct,
    ratio: (larger / smaller).toFixed(1),
  };
}

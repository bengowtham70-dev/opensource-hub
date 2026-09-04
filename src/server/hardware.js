import { getRepoBenchmark } from "./benchmarks.js";

export const BASE_OS_RAM_MB = 200;

export const LIGHTWEIGHT_SWAPS = {
  "supabase/supabase": {
    target: "pocketbase/pocketbase",
    name: "PocketBase",
    reason: "Uses single SQLite binary requiring only 25MB RAM instead of multi-container Postgres stack.",
    ramSavingsMb: 1511,
  },
  "mattermost/mattermost": {
    target: "zulip/zulip",
    name: "Zulip",
    reason: "Significantly leaner memory footprint with threaded conversations.",
    ramSavingsMb: 200,
  },
  "bram2w/baserow": {
    target: "nocodb/nocodb",
    name: "NocoDB",
    reason: "Leaner Node.js core with lower idle RAM footprint for spreadsheet databases.",
    ramSavingsMb: 644,
  },
  "bitwarden/server": {
    target: "dani-garcia/vaultwarden",
    name: "Vaultwarden",
    reason: "Lightweight Rust rewrite of Bitwarden backend consuming ~45MB instead of ~2GB MSSQL.",
    ramSavingsMb: 2000,
  },
};

export function findSwap(repo) {
  if (!repo) return null;
  const clean = String(repo).toLowerCase().trim();
  if (LIGHTWEIGHT_SWAPS[clean]) return LIGHTWEIGHT_SWAPS[clean];
  const short = clean.includes("/") ? clean.split("/")[1] : clean;
  for (const [key, val] of Object.entries(LIGHTWEIGHT_SWAPS)) {
    if (key.endsWith(`/${short}`) || key === short) return val;
  }
  return null;
}

export function evaluateHardware({ ramMb = 2048, cpus = 2, arch = "x86_64", repos = [] }) {
  const repoList = Array.isArray(repos) ? repos : typeof repos === "string" ? repos.split(",").map(r => r.trim()).filter(Boolean) : [];

  const toolBreakdown = repoList.map((repo) => {
    const b = getRepoBenchmark(repo) || {};
    const ram = b.idleRamMb || 250;
    const size = b.containerSizeMb || 200;
    const supportedArchs = ["x86_64", "arm64"];
    const isArchOk = supportedArchs.includes(arch);
    const swap = findSwap(repo);

    return {
      repo,
      name: repo.split("/")[1] || repo,
      idleRamMb: ram,
      containerSizeMb: size,
      runtime: b.runtime,
      databaseEngine: b.databaseEngine,
      difficultyRating: b.difficultyRating,
      supportedArchs,
      isArchOk,
      swap,
    };
  });

  const totalAppRamMb = toolBreakdown.reduce((acc, t) => acc + t.idleRamMb, 0);
  const totalRequiredMb = BASE_OS_RAM_MB + totalAppRamMb;
  const headroomMb = ramMb - totalRequiredMb;
  const headroomPct = Math.round((headroomMb / ramMb) * 100);
  const allArchOk = toolBreakdown.every((t) => t.isArchOk);

  let status = "PERFECT_FIT";
  let label = "Runs Smoothly (Great Headroom)";
  let tone = "trust";

  if (!allArchOk) {
    status = "UNSUPPORTED_ARCH";
    label = "Architecture Incompatible";
    tone = "critical";
  } else if (headroomMb < 0) {
    status = "INSUFFICIENT_RAM";
    label = "Insufficient RAM (High OOM Risk)";
    tone = "critical";
  } else if (headroomPct < 25) {
    status = "TIGHT_FIT";
    label = "Tight Fit (Modest Headroom)";
    tone = "caution";
  }

  return {
    ramMb: Number(ramMb),
    cpus: Number(cpus),
    arch,
    baseOsRamMb: BASE_OS_RAM_MB,
    totalAppRamMb,
    totalRequiredMb,
    headroomMb,
    headroomPct,
    status,
    label,
    tone,
    toolBreakdown,
    activeSwaps: toolBreakdown.filter((t) => t.swap && (status === "INSUFFICIENT_RAM" || status === "TIGHT_FIT")),
  };
}

export function evaluateHardwareFit({ tool, repos, ram_mb, ramMb, cpus = 2, arch = "x86_64" }) {
  const ram = ramMb ?? ram_mb ?? 2048;
  const targetRepos = repos || (tool ? [tool] : []);
  const hw = evaluateHardware({ ramMb: ram, cpus, arch, repos: targetRepos });
  const allSwaps = hw.toolBreakdown.map((t) => t.swap).filter(Boolean);
  return {
    verdict: hw.label,
    status: hw.status,
    tone: hw.tone,
    ramMb: hw.ramMb,
    cpus: hw.cpus,
    arch: hw.arch,
    totalRequiredMb: hw.totalRequiredMb,
    headroomMb: hw.headroomMb,
    headroomPct: hw.headroomPct,
    swaps: allSwaps,
    toolBreakdown: hw.toolBreakdown,
  };
}


import { getToolBenchmarks } from "./benchmarks";

export const HARDWARE_PRESETS = [
  {
    id: "raspberry-pi-4",
    name: "Raspberry Pi 4 / 5",
    sub: "4GB ARM64",
    ramMb: 4096,
    cpus: 4,
    arch: "arm64",
    description: "Low-power ARM single-board computer for 24/7 homelabs.",
  },
  {
    id: "entry-vps",
    name: "Entry Cloud VPS ($4/mo)",
    sub: "1GB x86_64",
    ramMb: 1024,
    cpus: 1,
    arch: "x86_64",
    description: "Hetzner CX22 or DigitalOcean $4 basic cloud droplet.",
  },
  {
    id: "standard-vps",
    name: "Standard Cloud VPS ($8/mo)",
    sub: "2GB x86_64",
    ramMb: 2048,
    cpus: 2,
    arch: "x86_64",
    description: "2GB RAM, 2 vCPUs balanced cloud virtual server.",
  },
  {
    id: "mac-apple-silicon",
    name: "Apple Silicon Mac",
    sub: "8GB ARM64",
    ramMb: 8192,
    cpus: 8,
    arch: "arm64",
    description: "M1/M2/M3 local development and testing environment.",
  },
  {
    id: "homelab-mini-pc",
    name: "Homelab Mini PC",
    sub: "16GB x86_64",
    ramMb: 16384,
    cpus: 4,
    arch: "x86_64",
    description: "Intel N100 / Beelink dedicated 16GB home server.",
  },
];

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
  "toeverything/affine": {
    target: "appflowy-io/appflowy",
    name: "AppFlowy",
    reason: "Native Rust/Flutter client with local-first offline storage.",
    ramSavingsMb: 350,
  },
};

export const BASE_OS_RAM_MB = 200;

export function evaluateHardwareFit({ ramMb = 2048, cpus = 2, arch = "x86_64", tools = [] }) {
  const toolList = Array.isArray(tools) ? tools : [tools].filter(Boolean);
  
  const toolBreakdown = toolList.map((t) => {
    const repo = typeof t === "string" ? t : t.repo || t.alternative?.repo || "";
    const name = typeof t === "string" ? (t.split("/")[1] || t) : (t.name || t.alternative?.name || repo);
    const benchmark = getToolBenchmarks(repo, typeof t === "object" ? t : {});
    const ram = benchmark.idleRamMb || 250;
    const size = benchmark.containerSizeMb || 200;
    const supportedArchs = benchmark.supportedArchs || ["x86_64", "arm64"];
    const isArchOk = supportedArchs.includes(arch);
    const swap = LIGHTWEIGHT_SWAPS[repo.toLowerCase()] || null;

    return {
      repo,
      name,
      idleRamMb: ram,
      containerSizeMb: size,
      runtime: benchmark.runtime || "Container",
      databaseEngine: benchmark.databaseEngine || "Embedded",
      difficultyRating: benchmark.difficultyRating || 2,
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
  let summary = `Plenty of memory headroom (${Math.max(0, headroomPct)}% free) for cache, database buffers, and traffic spikes.`;

  if (!allArchOk) {
    status = "UNSUPPORTED_ARCH";
    label = "Architecture Incompatible";
    tone = "critical";
    summary = `One or more selected containers do not publish official ${arch.toUpperCase()} image builds.`;
  } else if (headroomMb < 0) {
    status = "INSUFFICIENT_RAM";
    label = "Insufficient RAM (High OOM Risk)";
    tone = "critical";
    summary = `Workload requires at least ${totalRequiredMb} MB. Host will freeze or trigger Linux OOM-killer shutdowns.`;
  } else if (headroomPct < 25) {
    status = "TIGHT_FIT";
    label = "Tight Fit (Modest Headroom)";
    tone = "caution";
    summary = `Workload will boot with ${Math.max(0, headroomPct)}% headroom, but high traffic or background jobs risk swap thrashing.`;
  }

  // Calculate estimated peak concurrent requests before paging
  let estConcurrency = 0;
  if (headroomMb > 0) {
    const hasPythonOrJvm = toolBreakdown.some((t) => t.runtime.includes("Python") || t.runtime.includes("Java"));
    const isAllGoOrRust = toolBreakdown.every((t) => t.runtime.includes("Go") || t.runtime.includes("Rust"));
    if (isAllGoOrRust) {
      estConcurrency = Math.min(2500, Math.round((headroomMb * 1.5) + (cpus * 150)));
    } else if (hasPythonOrJvm) {
      estConcurrency = Math.min(800, Math.round((headroomMb * 0.4) + (cpus * 40)));
    } else {
      estConcurrency = Math.min(1500, Math.round((headroomMb * 0.8) + (cpus * 80)));
    }
  }

  const activeSwaps = toolBreakdown.filter((t) => t.swap && (status === "INSUFFICIENT_RAM" || status === "TIGHT_FIT"));

  return {
    ramMb,
    cpus,
    arch,
    baseOsRamMb: BASE_OS_RAM_MB,
    totalAppRamMb,
    totalRequiredMb,
    headroomMb,
    headroomPct,
    status,
    label,
    tone,
    summary,
    estConcurrency,
    toolBreakdown,
    activeSwaps,
  };
}

export function generateSafeCompose({ ramMb = 2048, tools = [] }) {
  const toolList = Array.isArray(tools) ? tools : [tools].filter(Boolean);
  const evaluation = evaluateHardwareFit({ ramMb, tools: toolList });
  
  const services = {};
  for (const t of evaluation.toolBreakdown) {
    const slug = t.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    // Allocate proportional safe limit (at least 1.5x idle, never exceeding 80% host RAM)
    const memLimitMb = Math.min(Math.round(t.idleRamMb * 1.6), Math.round(ramMb * 0.8));
    services[slug] = {
      image: `${slug}:latest`,
      container_name: `osh_${slug}`,
      restart: "unless-stopped",
      deploy: {
        resources: {
          limits: {
            memory: `${memLimitMb}M`,
          },
          reservations: {
            memory: `${t.idleRamMb}M`,
          },
        },
      },
    };
  }

  let yaml = "version: '3.8'\n\nservices:\n";
  for (const [sName, sCfg] of Object.entries(services)) {
    yaml += `  ${sName}:\n`;
    yaml += `    image: ${sCfg.image}\n`;
    yaml += `    container_name: ${sCfg.container_name}\n`;
    yaml += `    restart: unless-stopped\n`;
    yaml += `    deploy:\n`;
    yaml += `      resources:\n`;
    yaml += `        limits:\n`;
    yaml += `          memory: ${sCfg.deploy.resources.limits.memory}\n`;
    yaml += `        reservations:\n`;
    yaml += `          memory: ${sCfg.deploy.resources.reservations.memory}\n\n`;
  }

  return yaml.trim();
}

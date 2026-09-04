import { useState } from "react";
import { Link, useInRouterContext } from "react-router-dom";
import { Cpu, HardDrive, Database, Clock, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Server, Layers } from "lucide-react";
import { evaluateHardwareFit } from "../lib/hardware-calc";
import { formatRam } from "../lib/benchmarks";

export function deriveSelfHostSpecs(alternative = {}) {
  const language = (alternative.language || "").toLowerCase();
  const platforms = Array.isArray(alternative.platforms) ? alternative.platforms : [];
  const isWebOnly = platforms.includes("web") && platforms.length === 1;
  const isDesktop = platforms.some((p) => ["windows", "macos", "linux"].includes(p));

  let difficulty = "Beginner";
  let difficultyTone = "text-trust border-trust/30 bg-trust/10";
  let difficultyDesc = "Single binary or lightweight app. Instant setup in < 2 minutes.";
  let ram = "< 256 MB";
  let db = "SQLite / Embedded (Zero config)";
  let setupTime = "~2 mins";

  if (language.includes("rust") || language.includes("go") || language.includes("c++")) {
    difficulty = "Beginner";
    difficultyTone = "text-trust border-trust/30 bg-trust/10";
    ram = "128 MB – 256 MB";
    db = "SQLite / Embedded";
    setupTime = "~2 mins";
  } else if (language.includes("typescript") || language.includes("javascript") || language.includes("python")) {
    difficulty = "Intermediate";
    difficultyTone = "text-caution border-caution/30 bg-caution/10";
    difficultyDesc = "Runs via Docker Compose or Node.js runtime. Needs lightweight database.";
    ram = "512 MB – 1 GB";
    db = "PostgreSQL / SQLite";
    setupTime = "~5 mins";
  } else if (language.includes("java") || language.includes("c#") || language.includes("php")) {
    difficulty = "Intermediate";
    difficultyTone = "text-caution border-caution/30 bg-caution/10";
    ram = "1 GB – 2 GB";
    db = "PostgreSQL / MySQL";
    setupTime = "~10 mins";
  }

  if (isDesktop && !isWebOnly) {
    difficulty = "Beginner (Desktop App)";
    difficultyTone = "text-trust border-trust/30 bg-trust/10";
    difficultyDesc = "Standard native desktop installer. No server administration required.";
    ram = "< 512 MB";
    db = "Local SQLite / Flat Files";
    setupTime = "Instant";
  }

  return {
    difficulty,
    difficultyTone,
    difficultyDesc,
    ram,
    db,
    setupTime,
    archs: ["x86_64 (amd64)", "ARM64 (Apple Silicon / Pi)"],
  };
}

const QUICK_MACHINES = [
  { id: "pi", label: "Raspberry Pi 4", ramMb: 4096, cpus: 4, arch: "arm64" },
  { id: "vps1", label: "1GB Cloud VPS", ramMb: 1024, cpus: 1, arch: "x86_64" },
  { id: "vps2", label: "2GB Cloud VPS", ramMb: 2048, cpus: 2, arch: "x86_64" },
  { id: "pc", label: "Local PC (8GB)", ramMb: 8192, cpus: 8, arch: "x86_64" },
];

export default function SelfHostSpecs({ alternative = {} }) {
  const inRouter = useInRouterContext();
  const specs = deriveSelfHostSpecs(alternative);
  const [selectedMachine, setSelectedMachine] = useState(QUICK_MACHINES[1]); // Default 1GB VPS

  const quickEval = evaluateHardwareFit({
    ramMb: selectedMachine.ramMb,
    cpus: selectedMachine.cpus,
    arch: selectedMachine.arch,
    tools: [alternative.repo || alternative.name || ""],
  });

  return (
    <section className="card-elevated p-6 mt-6 relative overflow-hidden" aria-label="Self-Host Hardware & Difficulty Specs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-8 rounded-lg bg-ember/10 text-ember border border-ember/20">
            <Cpu size={18} />
          </span>
          <div>
            <h2 className="font-display text-display-md text-ink">Self-Host Specs &amp; Hardware</h2>
            <p className="text-[12.5px] text-faint">Operational requirements before deploying to production.</p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold ${specs.difficultyTone}`}>
          <CheckCircle2 size={13} />
          {specs.difficulty}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
        {/* RAM */}
        <div className="p-3.5 rounded-xl border border-line bg-surface/70">
          <div className="flex items-center gap-2 text-faint text-[12px] mb-1">
            <HardDrive size={14} className="text-dim" />
            <span>RAM Needed</span>
          </div>
          <p className="font-display text-lg font-semibold text-ink">{specs.ram}</p>
          <p className="text-[11px] text-faint mt-0.5">Idle to moderate workload</p>
        </div>

        {/* Database */}
        <div className="p-3.5 rounded-xl border border-line bg-surface/70">
          <div className="flex items-center gap-2 text-faint text-[12px] mb-1">
            <Database size={14} className="text-dim" />
            <span>Database Storage</span>
          </div>
          <p className="font-display text-base font-semibold text-ink truncate" title={specs.db}>{specs.db}</p>
          <p className="text-[11px] text-faint mt-0.5">Persistent disk volume</p>
        </div>

        {/* Setup Time */}
        <div className="p-3.5 rounded-xl border border-line bg-surface/70">
          <div className="flex items-center gap-2 text-faint text-[12px] mb-1">
            <Clock size={14} className="text-dim" />
            <span>Setup Duration</span>
          </div>
          <p className="font-display text-lg font-semibold text-ink">{specs.setupTime}</p>
          <p className="text-[11px] text-faint mt-0.5">Automated deployment</p>
        </div>

        {/* Architectures */}
        <div className="p-3.5 rounded-xl border border-line bg-surface/70">
          <div className="flex items-center gap-2 text-faint text-[12px] mb-1">
            <Cpu size={14} className="text-dim" />
            <span>Target Architectures</span>
          </div>
          <p className="font-display text-sm font-semibold text-ink">amd64 / ARM64</p>
          <p className="text-[11px] text-faint mt-0.5">Native multi-arch support</p>
        </div>
      </div>

      {/* Interactive Can I Run This Quick Checker */}
      <div className="mt-5 p-4 rounded-xl border border-line bg-elevated/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-ink flex items-center gap-1.5">
            <Server size={14} className="text-ember" />
            <span>Can I Run This on My Machine?</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {QUICK_MACHINES.map((qm) => (
              <button
                key={qm.id}
                type="button"
                onClick={() => setSelectedMachine(qm)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedMachine.id === qm.id
                    ? "bg-surface text-ink border-ink dark:border-white shadow-2xs"
                    : "bg-surface/50 border-line text-faint hover:text-ink hover:bg-surface"
                }`}
              >
                {qm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Result Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-line/60">
          <div className="flex items-center gap-2">
            {quickEval.tone === "trust" ? (
              <CheckCircle2 size={16} className="text-trust" />
            ) : quickEval.tone === "caution" ? (
              <AlertTriangle size={16} className="text-caution" />
            ) : (
              <ShieldAlert size={16} className="text-critical" />
            )}
            <span className="text-ink font-medium">
              <strong>{quickEval.label}:</strong> {quickEval.summary}
            </span>
          </div>

          {inRouter ? (
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Link
                to={`/stacks/builder?add=${encodeURIComponent(alternative.repo || alternative.name || "")}`}
                className="btn-tactile text-xs font-semibold px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-elevated text-ink inline-flex items-center gap-1.5 shadow-2xs"
                title="Add to multi-service Docker Compose stack"
              >
                <Layers size={12} className="text-trust" />
                <span>Add to Stack</span>
              </Link>
              <Link
                to={`/hardware?tool=${encodeURIComponent(alternative.name || "")}`}
                className="btn-tactile text-xs font-semibold text-ember hover:underline inline-flex items-center gap-1"
              >
                <span>Full Sizing Simulator</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <a
                href={`/stacks/builder?add=${encodeURIComponent(alternative.repo || alternative.name || "")}`}
                className="btn-tactile text-xs font-semibold px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-elevated text-ink inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Layers size={12} className="text-trust" />
                <span>Add to Stack</span>
              </a>
              <a
                href={`/hardware?tool=${encodeURIComponent(alternative.name || "")}`}
                className="btn-tactile text-xs font-semibold text-ember hover:underline inline-flex items-center gap-1"
              >
                <span>Full Sizing Simulator</span>
                <ArrowRight size={12} />
              </a>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-[12px] text-faint flex items-center gap-1.5">
        <span className="text-dim font-medium">Deployment note:</span> {specs.difficultyDesc}
      </p>
    </section>
  );
}

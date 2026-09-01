import { Cpu, HardDrive, Database, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

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

export default function SelfHostSpecs({ alternative = {} }) {
  const specs = deriveSelfHostSpecs(alternative);

  return (
    <section className="card-elevated p-6 mt-6 relative overflow-hidden" aria-label="Self-Host Hardware & Difficulty Specs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-8 rounded-lg bg-ember/10 text-ember border border-ember/20">
            <Cpu size={18} />
          </span>
          <div>
            <h2 className="font-display text-display-md text-ink">Self-Host Specs & Hardware</h2>
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

      <p className="mt-3 text-[12px] text-faint flex items-center gap-1.5">
        <span className="text-dim font-medium">Deployment note:</span> {specs.difficultyDesc}
      </p>
    </section>
  );
}

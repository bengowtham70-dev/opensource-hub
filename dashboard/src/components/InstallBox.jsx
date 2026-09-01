import { useState } from "react";
import { Copy, Check, Terminal, Layers, Box, Cpu, Download } from "lucide-react";

export default function InstallBox({ repo = "", alternative = {}, defaultTab = "" }) {
  const [copied, setCopied] = useState(false);
  const ecosystems = alternative.ecosystems || {};
  const [owner, name] = repo.split("/");
  const cleanName = (alternative.name || name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Generate commands for all available package managers
  const commands = [];

  // 1. Docker
  const dockerImg = ecosystems.docker || `${cleanName}/${cleanName}`;
  commands.push({
    id: "docker",
    label: "Docker",
    icon: "🐳",
    cmd: `docker run -d -p 8080:8080 --name ${cleanName} ${dockerImg}`,
    secondaryCmd: `curl -sSL https://raw.githubusercontent.com/${repo}/main/docker-compose.yml | docker compose -f - up -d`,
    desc: "1-Click local container deployment",
  });

  // 2. Homebrew
  const brewPkg = ecosystems.brew || cleanName;
  commands.push({
    id: "brew",
    label: "Homebrew",
    icon: "🍺",
    cmd: `brew install ${brewPkg}`,
    desc: "macOS & Linux package manager",
  });

  // 3. Windows Winget / Scoop
  const wingetPkg = ecosystems.winget || `${owner}.${alternative.name || name}`;
  commands.push({
    id: "winget",
    label: "Winget",
    icon: "🪟",
    cmd: `winget install ${wingetPkg}`,
    desc: "Windows Package Manager CLI",
  });

  // 4. Language SDK (NPM / PyPI / Cargo / Go)
  if (ecosystems.npm || alternative.language === "TypeScript" || alternative.language === "JavaScript") {
    commands.push({
      id: "npm",
      label: "NPM",
      icon: "📦",
      cmd: `npm i -g ${ecosystems.npm || cleanName}`,
      desc: "Node.js global CLI / package",
    });
  } else if (ecosystems.pypi || alternative.language === "Python") {
    commands.push({
      id: "pypi",
      label: "Pip",
      icon: "🐍",
      cmd: `pip install ${ecosystems.pypi || cleanName}`,
      desc: "Python package index",
    });
  } else if (ecosystems.cargo || alternative.language === "Rust") {
    commands.push({
      id: "cargo",
      label: "Cargo",
      icon: "🦀",
      cmd: `cargo install ${ecosystems.cargo || cleanName}`,
      desc: "Rust package manager",
    });
  } else if (alternative.language === "Go") {
    commands.push({
      id: "go",
      label: "Go",
      icon: "🐹",
      cmd: `go install github.com/${repo}@latest`,
      desc: "Go toolchain binary install",
    });
  }

  // 5. Git / Source clone
  commands.push({
    id: "git",
    label: "Source",
    icon: "⚡",
    cmd: `git clone https://github.com/${repo}.git && cd ${name || cleanName}`,
    desc: "Compile & run from source",
  });

  const [activeTab, setActiveTab] = useState(defaultTab || commands[0]?.id || "docker");
  const current = commands.find((c) => c.id === activeTab) || commands[0];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="card-elevated rounded-2xl bg-surface border border-line p-5 space-y-4 shadow-sm" aria-label="Installation commands">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink grid place-items-center">
            <Terminal size={14} className="text-accent" />
          </div>
          <span className="font-display text-sm sm:text-base font-bold text-ink">
            Run &amp; Install {alternative.name || name}
          </span>
        </div>
        <span className="text-[11px] text-faint">
          {current?.desc}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {commands.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`btn-tactile px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isActive
                  ? "bg-ink text-surface dark:bg-surface dark:text-ink border-transparent shadow-xs"
                  : "border-line bg-elevated/50 text-dim hover:text-ink hover:bg-elevated"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Command Box with 1-click Copy */}
      <div className="relative group rounded-xl border border-line bg-ink text-zinc-100 dark:bg-black/80 p-3.5 flex items-center justify-between gap-3 font-mono text-xs overflow-hidden">
        <div className="overflow-x-auto whitespace-nowrap scrollbar-none flex-1 pr-2">
          <span className="text-accent mr-2 select-none">$</span>
          <span className="tnum selection:bg-accent selection:text-white">{current?.cmd}</span>
        </div>

        <button
          type="button"
          onClick={() => handleCopy(current?.cmd)}
          className="btn-tactile px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-sans text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 shadow-sm border border-zinc-700 cursor-pointer"
          title="Copy command to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} className="text-trust" />
              <span className="text-trust">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {current?.secondaryCmd && (
        <div className="text-[11px] text-faint flex items-center justify-between gap-2 pt-1">
          <span className="truncate">Compose: <code className="text-dim">{current.secondaryCmd}</code></span>
          <button
            type="button"
            onClick={() => handleCopy(current.secondaryCmd)}
            className="text-ember hover:underline shrink-0 font-medium cursor-pointer"
          >
            Copy Compose
          </button>
        </div>
      )}
    </div>
  );
}

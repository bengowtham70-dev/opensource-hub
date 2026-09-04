import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Cpu,
  Server,
  HardDrive,
  Laptop,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Users,
  Plus,
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { getPairings } from "../lib/seed";
import BrandLogo, { repoBrand } from "../components/BrandLogo";
import {
  HARDWARE_PRESETS,
  evaluateHardwareFit,
  generateSafeCompose,
  BASE_OS_RAM_MB,
} from "../lib/hardware-calc";
import { formatRam } from "../lib/benchmarks";

const POPULAR_TOOLS = [
  { repo: "pocketbase/pocketbase", name: "PocketBase", icon: "pocketbase" },
  { repo: "supabase/supabase", name: "Supabase", icon: "supabase" },
  { repo: "dani-garcia/vaultwarden", name: "Vaultwarden", icon: "bitwarden" },
  { repo: "penpot/penpot", name: "Penpot", icon: "penpot" },
  { repo: "umami-software/umami", name: "Umami", icon: "umami" },
  { repo: "mattermost/mattermost", name: "Mattermost", icon: "mattermost" },
  { repo: "nocodb/nocodb", name: "NocoDB", icon: "nocodb" },
  { repo: "usebruno/bruno", name: "Bruno", icon: "bruno" },
  { repo: "go-gitea/gitea", name: "Gitea", icon: "gitea" },
];

export default function HardwarePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allPairings, setAllPairings] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState("entry-vps");
  const [ramMb, setRamMb] = useState(1024);
  const [cpus, setCpus] = useState(1);
  const [arch, setArch] = useState("x86_64");
  const [selectedRepos, setSelectedRepos] = useState(["supabase/supabase"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [copiedCompose, setCopiedCompose] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);

  useEffect(() => {
    getPairings().then((p) => {
      setAllPairings(p || []);
      // Handle ?tool= URL parameter
      const initialTool = searchParams.get("tool");
      if (initialTool) {
        const found = p.find(
          (item) =>
            item.alternative.repo.toLowerCase().includes(initialTool.toLowerCase()) ||
            item.alternative.name.toLowerCase() === initialTool.toLowerCase()
        );
        if (found) {
          setSelectedRepos([found.alternative.repo]);
        }
      }
    }).catch(() => setAllPairings([]));
  }, [searchParams]);

  // Handle hardware preset selection
  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setRamMb(preset.ramMb);
    setCpus(preset.cpus);
    setArch(preset.arch);
  };

  // Perform live sizing evaluation
  const evaluation = useMemo(() => {
    return evaluateHardwareFit({
      ramMb,
      cpus,
      arch,
      tools: selectedRepos,
    });
  }, [ramMb, cpus, arch, selectedRepos]);

  // Filter catalog items for adding tools
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPairings
      .filter(
        (p) =>
          !selectedRepos.includes(p.alternative.repo) &&
          (p.alternative.name.toLowerCase().includes(q) ||
            p.alternative.repo.toLowerCase().includes(q) ||
            p.paidTool.name.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [allPairings, selectedRepos, searchQuery]);

  const addTool = (repo) => {
    if (!selectedRepos.includes(repo)) {
      setSelectedRepos((prev) => [...prev, repo]);
    }
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  const removeTool = (repo) => {
    setSelectedRepos((prev) => prev.filter((r) => r !== repo));
  };

  const applySwap = (swap) => {
    setSelectedRepos((prev) => {
      const idx = prev.findIndex((r) => r.toLowerCase() === swap.fromRepo.toLowerCase());
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = swap.target;
        return next;
      }
      return [...prev, swap.target];
    });
  };

  const composeYaml = useMemo(() => {
    return generateSafeCompose({ ramMb, tools: selectedRepos });
  }, [ramMb, selectedRepos]);

  const handleCopyCompose = () => {
    navigator.clipboard.writeText(composeYaml);
    setCopiedCompose(true);
    setTimeout(() => setCopiedCompose(false), 2000);
  };

  const handleDownloadCompose = () => {
    const blob = new Blob([composeYaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "docker-compose.hardware-safe.yml";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1300px] px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Back Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-faint hover:text-ink transition-colors btn-tactile"
        >
          <ArrowLeft size={15} />
          <span>Back to Directory</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-trust/10 border border-trust/30 text-trust shadow-2xs">
          <Cpu size={14} />
          <span>Self-Hosted Sizing Engine · PRD §38</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink">
          Can I Run This?
        </h1>
        <p className="text-dim text-sm sm:text-base max-w-[75ch] leading-relaxed">
          Simulate self-hosting memory headroom, CPU concurrency capacity, and ARM64/x86 compatibility before spinning up containers on your hardware.
        </p>
      </div>

      {/* Preset Hardware Environments */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-faint">
          1. Choose Machine Preset:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {HARDWARE_PRESETS.map((p) => {
            const isSelected = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "bg-surface border-ink dark:border-white shadow-md ring-2 ring-ink/10 dark:ring-white/10"
                    : "bg-surface border-line hover:border-line-strong hover:bg-elevated shadow-2xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">{p.name}</span>
                    {isSelected && <CheckCircle2 size={15} className="text-trust" />}
                  </div>
                  <span className="text-[11px] font-semibold text-ember block mt-0.5">{p.sub}</span>
                </div>
                <p className="text-[10.5px] text-faint leading-snug">{p.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Hardware Tuning Sliders */}
      <div className="card-elevated p-6 bg-surface border border-line rounded-2xl shadow-card grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RAM Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="ram-slider" className="text-xs font-bold uppercase tracking-wider text-dim flex items-center gap-1.5">
              <Server size={14} className="text-ember" />
              <span>System RAM:</span>
            </label>
            <span className="font-mono text-sm font-bold text-ink bg-elevated px-2.5 py-0.5 rounded-lg border border-line">
              {formatRam(ramMb)}
            </span>
          </div>
          <input
            id="ram-slider"
            type="range"
            min={512}
            max={32768}
            step={512}
            value={ramMb}
            onChange={(e) => {
              setRamMb(Number(e.target.value));
              setSelectedPreset("custom");
            }}
            className="w-full accent-ember cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] text-faint font-mono">
            <button type="button" onClick={() => { setRamMb(1024); setSelectedPreset("custom"); }} className="hover:text-ink cursor-pointer">1GB</button>
            <button type="button" onClick={() => { setRamMb(2048); setSelectedPreset("custom"); }} className="hover:text-ink cursor-pointer">2GB</button>
            <button type="button" onClick={() => { setRamMb(4096); setSelectedPreset("custom"); }} className="hover:text-ink cursor-pointer">4GB</button>
            <button type="button" onClick={() => { setRamMb(8192); setSelectedPreset("custom"); }} className="hover:text-ink cursor-pointer">8GB</button>
            <button type="button" onClick={() => { setRamMb(16384); setSelectedPreset("custom"); }} className="hover:text-ink cursor-pointer">16GB</button>
          </div>
        </div>

        {/* vCPU Cores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-dim flex items-center gap-1.5">
              <Cpu size={14} className="text-ember" />
              <span>CPU Cores:</span>
            </span>
            <span className="font-mono text-sm font-bold text-ink bg-elevated px-2.5 py-0.5 rounded-lg border border-line">
              {cpus} {cpus === 1 ? "vCPU" : "vCPUs"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[1, 2, 4, 8].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCpus(c); setSelectedPreset("custom"); }}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  cpus === c
                    ? "bg-ink text-surface dark:bg-surface dark:text-ink border-ink dark:border-white shadow-2xs"
                    : "bg-elevated border-line hover:border-line-strong text-dim hover:text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* CPU Architecture */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-dim flex items-center gap-1.5">
              <HardDrive size={14} className="text-ember" />
              <span>Architecture:</span>
            </span>
            <span className="font-mono text-xs font-bold text-ink uppercase bg-elevated px-2.5 py-0.5 rounded-lg border border-line">
              {arch}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setArch("x86_64"); setSelectedPreset("custom"); }}
              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                arch === "x86_64"
                  ? "bg-ink text-surface dark:bg-surface dark:text-ink border-ink dark:border-white shadow-2xs"
                  : "bg-elevated border-line hover:border-line-strong text-dim hover:text-ink"
              }`}
            >
              x86_64 (Intel/AMD)
            </button>
            <button
              type="button"
              onClick={() => { setArch("arm64"); setSelectedPreset("custom"); }}
              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                arch === "arm64"
                  ? "bg-ink text-surface dark:bg-surface dark:text-ink border-ink dark:border-white shadow-2xs"
                  : "bg-elevated border-line hover:border-line-strong text-dim hover:text-ink"
              }`}
            >
              ARM64 (Apple / Pi)
            </button>
          </div>
        </div>
      </div>

      {/* Target Workload / Selected Tools */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-faint">
              2. Target Software Workload:
            </h2>
            <p className="text-xs text-dim mt-0.5">Select the tools you intend to self-host simultaneously.</p>
          </div>

          {/* Tool Search / Add Input */}
          <div className="relative w-full sm:w-72">
            <div className="relative">
              <input
                type="text"
                placeholder="Search to add tool..."
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-faint focus:outline-none focus:border-ink dark:focus:border-white shadow-2xs"
              />
              <Plus size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
            </div>

            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-full bg-surface border border-line rounded-xl shadow-float p-1.5 space-y-1 text-xs max-h-56 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.alternative.repo}
                    type="button"
                    onClick={() => addTool(p.alternative.repo)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-elevated flex items-center justify-between group cursor-pointer"
                  >
                    <span className="font-medium text-ink group-hover:text-ember">{p.alternative.name}</span>
                    <span className="text-[10px] text-faint">replaces {p.paidTool.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-faint mr-1">Quick Add:</span>
          {POPULAR_TOOLS.map((pt) => {
            const isAdded = selectedRepos.includes(pt.repo);
            return (
              <button
                key={pt.repo}
                type="button"
                disabled={isAdded}
                onClick={() => addTool(pt.repo)}
                className={`btn-tactile px-2.5 py-1 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-colors ${
                  isAdded
                    ? "opacity-40 border-line bg-elevated text-faint cursor-default"
                    : "border-line bg-surface hover:bg-elevated text-dim hover:text-ink cursor-pointer shadow-2xs"
                }`}
              >
                <BrandLogo brand={pt.icon} name={pt.name} size={13} />
                <span>{pt.name}</span>
                {!isAdded && <Plus size={11} className="text-faint" />}
              </button>
            );
          })}
        </div>

        {/* Active Tool Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {evaluation.toolBreakdown.map((tb) => (
            <div
              key={tb.repo}
              className="p-4 rounded-xl border border-line bg-surface shadow-xs space-y-2.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div className="flex items-center gap-2">
                  <BrandLogo brand={repoBrand(tb.repo)} name={tb.name} size={18} />
                  <Link
                    to={`/repo/${tb.repo}`}
                    className="font-display font-bold text-sm text-ink hover:text-ember transition-colors"
                  >
                    {tb.name}
                  </Link>
                </div>
                {evaluation.toolBreakdown.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTool(tb.repo)}
                    className="p-1 rounded-md text-faint hover:text-caution hover:bg-elevated cursor-pointer"
                    title="Remove from simulation"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-dim">
                  <span className="text-faint">Idle RAM Footprint:</span>
                  <span className="font-mono font-bold text-ink">{formatRam(tb.idleRamMb)}</span>
                </div>
                <div className="flex items-center justify-between text-dim">
                  <span className="text-faint">Database Engine:</span>
                  <span className="font-medium text-ink truncate max-w-[150px]">{tb.databaseEngine}</span>
                </div>
                <div className="flex items-center justify-between text-dim">
                  <span className="text-faint">ARM64 Support:</span>
                  <span className={`font-semibold ${tb.isArchOk ? "text-trust" : "text-critical"}`}>
                    {tb.isArchOk ? "Verified Build" : "Missing Image"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sizing & Headroom Visualizer */}
      <div className="card-elevated p-6 bg-surface border border-line rounded-2xl shadow-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-ink">Simulation Breakdown &amp; Memory Allocation</h3>
            <p className="text-xs text-faint mt-0.5">Stacked representation of host memory consumption under idle baseline.</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-faint block">Total Host Memory:</span>
            <span className="font-mono text-lg font-bold text-ink">{formatRam(ramMb)}</span>
          </div>
        </div>

        {/* Stacked Memory Progress Bar */}
        <div className="space-y-2">
          <div className="h-6 w-full bg-elevated rounded-xl overflow-hidden border border-line flex p-0.5 gap-0.5">
            {/* Base OS (200MB) */}
            <div
              className="h-full bg-line-strong rounded-lg"
              style={{ width: `${Math.max(2, (BASE_OS_RAM_MB / ramMb) * 100)}%` }}
              title={`Base Linux OS (~${BASE_OS_RAM_MB} MB)`}
            />
            {/* Tools */}
            {evaluation.toolBreakdown.map((t, idx) => {
              const pct = (t.idleRamMb / ramMb) * 100;
              const colors = ["bg-accent", "bg-ink dark:bg-white", "bg-trust", "bg-caution"];
              return (
                <div
                  key={t.repo}
                  className={`h-full rounded-lg ${colors[idx % colors.length]}`}
                  style={{ width: `${Math.max(3, pct)}%` }}
                  title={`${t.name}: ~${t.idleRamMb} MB`}
                />
              );
            })}
            {/* Remaining Headroom */}
            {evaluation.headroomMb > 0 && (
              <div
                className="h-full bg-trust/20 rounded-lg"
                style={{ width: `${evaluation.headroomPct}%` }}
                title={`Free Headroom: ~${evaluation.headroomMb} MB (${evaluation.headroomPct}%)`}
              />
            )}
          </div>

          {/* Bar Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded bg-line-strong" />
              <span className="text-faint">Base OS ({BASE_OS_RAM_MB}MB)</span>
            </div>
            {evaluation.toolBreakdown.map((t, idx) => {
              const colors = ["bg-accent", "bg-ink dark:bg-white", "bg-trust", "bg-caution"];
              return (
                <div key={t.repo} className="flex items-center gap-1.5">
                  <div className={`size-2.5 rounded ${colors[idx % colors.length]}`} />
                  <span className="text-dim font-medium">{t.name} ({formatRam(t.idleRamMb)})</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded bg-trust/30" />
              <span className="text-trust font-bold">
                {evaluation.headroomMb > 0 ? `Free Headroom (${evaluation.headroomPct}%)` : "Over Capacity"}
              </span>
            </div>
          </div>
        </div>

        {/* Verdict & Health Summary Card */}
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            evaluation.tone === "trust"
              ? "bg-trust/10 border-trust/40 text-trust"
              : evaluation.tone === "caution"
              ? "bg-caution/10 border-caution/40 text-caution"
              : "bg-critical/10 border-critical/40 text-critical"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {evaluation.tone === "trust" ? (
                <CheckCircle2 size={22} className="text-trust" />
              ) : evaluation.tone === "caution" ? (
                <AlertTriangle size={22} className="text-caution" />
              ) : (
                <ShieldAlert size={22} className="text-critical" />
              )}
            </div>
            <div className="space-y-0.5">
              <h4 className="font-display font-bold text-base text-ink">{evaluation.label}</h4>
              <p className="text-xs text-dim leading-relaxed">{evaluation.summary}</p>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-line/40 pt-3 sm:pt-0 sm:pl-4 shrink-0">
            <span className="text-[11px] text-faint block">Peak Concurrency Estimate:</span>
            <span className="font-mono text-base font-bold text-ink inline-flex items-center gap-1 mt-0.5">
              <Users size={14} className="text-ember" />
              <span>~{evaluation.estConcurrency} active users</span>
            </span>
          </div>
        </div>

        {/* Lightweight Swap Recommendations */}
        {evaluation.activeSwaps.length > 0 && (
          <div className="p-5 rounded-2xl border border-trust/30 bg-trust/5 space-y-3">
            <div className="flex items-center gap-2 text-trust">
              <Sparkles size={16} />
              <h4 className="font-display font-bold text-sm text-ink">Smart Lightweight Alternatives Available</h4>
            </div>

            <div className="space-y-2">
              {evaluation.activeSwaps.map((as) => (
                <div
                  key={as.repo}
                  className="p-3 bg-surface rounded-xl border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-ink">
                      Swap {as.name} for {as.swap.name}
                    </span>
                    <p className="text-dim leading-normal">{as.swap.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applySwap({ fromRepo: as.repo, target: as.swap.target })}
                    className="btn-tactile px-3 py-1.5 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                  >
                    <span>Swap to {as.swap.name}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1-Click Compose Launcher Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line">
          <div className="text-xs text-dim">
            <span>Docker memory limit allocated: </span>
            <strong className="text-ink">~{Math.min(ramMb, Math.round(ramMb * 0.8))} MB host safety barrier</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCompose}
              className="btn-tactile px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copiedCompose ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
              <span>{copiedCompose ? "Copied Compose!" : "Copy Safe Compose YAML"}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCompose}
              className="btn-tactile px-3.5 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download size={13} />
              <span>Download Compose File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

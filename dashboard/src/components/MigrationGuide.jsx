import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  FileUp,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code2,
  Terminal,
  FileCode,
  Settings2,
  HardDrive,
  Layers,
  FileText,
} from "lucide-react";
import {
  getMigrationPlan,
  generateMarkdownRunbook,
  getStoredMigrationProgress,
  saveStoredMigrationProgress,
} from "../lib/migration-plans";

// Preserved for backwards compatibility with existing unit tests
export function deriveMigrationSteps(paidTool = {}, alternative = {}) {
  const paidName = paidTool.name || "Proprietary SaaS";
  const altName = alternative.name || "Open Source Alternative";

  return [
    {
      step: 1,
      title: `Export data from ${paidName}`,
      desc: `Open your ${paidName} workspace settings, select "Export Workspace", and choose JSON, CSV, or Markdown format.`,
      icon: Download,
    },
    {
      step: 2,
      title: "Review & verify schema",
      desc: `Ensure your attachments, media assets, and relational records are included in the downloaded archive.`,
      icon: FileUp,
    },
    {
      step: 3,
      title: `Import directly into ${altName}`,
      desc: `Launch ${altName}, navigate to Settings → Data Import, and drag-and-drop your exported archive for 100% loss-free import.`,
      icon: CheckCircle2,
    },
  ];
}

export default function MigrationGuide({ paidTool = {}, alternative = {} }) {
  const repo = alternative.repo || alternative.name || "";
  const plan = getMigrationPlan(repo, { ...alternative, paidTool });
  const [checkedSteps, setCheckedSteps] = useState({});
  const [copiedRunbook, setCopiedRunbook] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState("checklist"); // "checklist" | "scripts"
  
  // Environment customization parameters
  const [volume, setVolume] = useState("medium"); // "small" | "medium" | "enterprise"
  const [targetEnv, setTargetEnv] = useState("docker"); // "docker" | "vps" | "k8s"
  const [dbDialect, setDbDialect] = useState("postgres"); // "postgres" | "sqlite" | "mysql"
  
  // Scripts state
  const [scriptsData, setScriptsData] = useState(null);
  const [activeScriptKey, setActiveScriptKey] = useState("scripts/01-export.sh");
  const [loadingScripts, setLoadingScripts] = useState(false);

  const [expandedStages, setExpandedStages] = useState({
    export: true,
    setup: true,
    import: true,
    cutover: true,
    verify: true,
  });

  const toggleStage = (id) => {
    setExpandedStages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (repo) {
      setCheckedSteps(getStoredMigrationProgress(repo));
    }
  }, [repo]);

  const toggleStep = (stepKey) => {
    setCheckedSteps((prev) => {
      const next = { ...prev, [stepKey]: !prev[stepKey] };
      saveStoredMigrationProgress(repo, next);
      return next;
    });
  };

  // Fetch or generate executable scripts whenever parameters change
  useEffect(() => {
    let cancelled = false;
    async function loadKit() {
      setLoadingScripts(true);
      try {
        const res = await fetch("/api/migration/kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo,
            alternative,
            paidTool,
            config: { volume, targetEnv, dbDialect },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.kit?.scripts) {
            setScriptsData(data.kit.scripts);
          }
        }
      } catch {
        // Fallback handled gracefully
      } finally {
        if (!cancelled) setLoadingScripts(false);
      }
    }
    loadKit();
    return () => {
      cancelled = true;
    };
  }, [repo, volume, targetEnv, dbDialect]);

  // Calculate overall completion
  const totalSteps = plan.stages.reduce((acc, s) => acc + s.steps.length, 0);
  const completedSteps = Object.values(checkedSteps).filter(Boolean).length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleCopyRunbook = () => {
    const md = generateMarkdownRunbook(plan, repo, checkedSteps);
    navigator.clipboard.writeText(md);
    setCopiedRunbook(true);
    setTimeout(() => setCopiedRunbook(false), 2000);
  };

  const handleDownloadRunbook = () => {
    const md = generateMarkdownRunbook(plan, repo, checkedSteps);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `migration-runbook-${plan.paidTool.toLowerCase()}-to-${plan.alternative.toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyActiveScript = () => {
    const code = scriptsData?.[activeScriptKey] || "";
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadZipBundle = () => {
    const downloadUrl = `/api/migration/bundle?repo=${encodeURIComponent(repo)}&volume=${volume}&targetEnv=${targetEnv}&dbDialect=${dbDialect}`;
    window.location.href = downloadUrl;
  };

  return (
    <section className="card-elevated p-6 mt-6 relative overflow-hidden" aria-label="Step-by-Step Data Migration Guide">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-8 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink">
            <ArrowRightLeft size={16} className="text-accent" />
          </span>
          <div>
            <h2 className="font-display text-display-md text-ink">
              Migration Assistant: {plan.paidTool} → {plan.alternative}
            </h2>
            <p className="text-[12.5px] text-faint">
              Interactive protocol & executable data scripts to migrate data, schemas, and clients.
            </p>
          </div>
        </div>

        {/* View Mode Tabs & Badges */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-line bg-elevated p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "checklist"
                  ? "bg-surface text-ink shadow-2xs"
                  : "text-dim hover:text-ink"
              }`}
            >
              Interactive Checklist
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scripts")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "scripts"
                  ? "bg-surface text-ink shadow-2xs"
                  : "text-dim hover:text-ink"
              }`}
            >
              <Code2 size={13} className="text-accent" />
              <span>Executable Scripts</span>
            </button>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-elevated text-dim text-xs font-semibold">
            <Clock size={12} className="text-ember" />
            <span>Est. {plan.estimatedDuration}</span>
          </span>
        </div>
      </div>

      {/* Migration Parameters & Environment Bar */}
      <div className="my-3 p-3.5 rounded-xl border border-line bg-surface/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-dim">
            <HardDrive size={13} className="text-ember" />
            <span className="font-medium text-ink">Volume:</span>
            <div className="inline-flex rounded-lg border border-line bg-elevated p-0.5">
              {[
                { id: "small", label: "<1GB" },
                { id: "medium", label: "1-20GB" },
                { id: "enterprise", label: ">20GB (Batch)" },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVolume(v.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    volume === v.id ? "bg-surface text-ink font-bold shadow-2xs" : "text-faint hover:text-dim"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-dim">
            <Layers size={13} className="text-trust" />
            <span className="font-medium text-ink">Target:</span>
            <div className="inline-flex rounded-lg border border-line bg-elevated p-0.5">
              {[
                { id: "docker", label: "Docker" },
                { id: "vps", label: "VPS / Linux" },
                { id: "k8s", label: "Kubernetes" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTargetEnv(t.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    targetEnv === t.id ? "bg-surface text-ink font-bold shadow-2xs" : "text-faint hover:text-dim"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-dim">
            <span className="font-medium text-ink">DB:</span>
            <div className="inline-flex rounded-lg border border-line bg-elevated p-0.5">
              {["postgres", "sqlite", "mysql"].map((db) => (
                <button
                  key={db}
                  type="button"
                  onClick={() => setDbDialect(db)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase transition-all ${
                    dbDialect === db ? "bg-surface text-ink font-bold shadow-2xs" : "text-faint hover:text-dim"
                  }`}
                >
                  {db}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadZipBundle}
          className="btn-tactile px-3 py-1.5 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto"
          title="Download all migration scripts, configs, and markdown runbook in a .zip bundle"
        >
          <Download size={13} />
          <span>Download Migration Kit (.zip)</span>
        </button>
      </div>

      {activeTab === "checklist" ? (
        <>
          {/* Interactive Progress Bar */}
          <div className="my-4 p-4 rounded-xl border border-line bg-surface space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink flex items-center gap-1.5">
                <Sparkles size={13} className="text-ember" />
                <span>Migration Progress:</span>
              </span>
              <span className="font-mono text-xs font-bold text-trust">
                {completedSteps} of {totalSteps} steps completed ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full bg-elevated rounded-full overflow-hidden border border-line">
              <div
                className="h-full bg-trust rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* 5-Stage Step Cards */}
          <div className="space-y-3 my-4">
            {plan.stages.map((stage) => {
              const isExpanded = Boolean(expandedStages[stage.id]);
              const stageStepKeys = stage.steps.map((_, i) => `${stage.id}_${i}`);
              const completedInStage = stageStepKeys.filter((k) => checkedSteps[k]).length;
              const isStageComplete = stageStepKeys.length > 0 && completedInStage === stageStepKeys.length;

              return (
                <div
                  key={stage.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? "bg-surface border-line shadow-xs"
                      : "bg-surface/60 border-line/80 hover:border-line hover:bg-surface"
                  }`}
                >
                  {/* Stage Header Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleStage(stage.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid place-items-center size-7 rounded-lg bg-elevated border border-line text-[11px] font-bold text-ink shrink-0">
                        {stage.badge}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm font-bold text-ink truncate">{stage.name}</h3>
                          {isStageComplete && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-trust">
                              <CheckCircle2 size={13} />
                              <span>Done</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-faint truncate">{stage.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-dim hidden sm:inline">
                        {completedInStage}/{stage.steps.length}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-dim" /> : <ChevronDown size={16} className="text-faint" />}
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-line/60 space-y-3 animate-fade-in">
                      <div className="space-y-2 mt-2">
                        {stage.steps.map((step, idx) => {
                          const stepKey = `${stage.id}_${idx}`;
                          const isChecked = Boolean(checkedSteps[stepKey]);

                          return (
                            <label
                              key={stepKey}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-trust/5 border-trust/30 text-ink"
                                  : "bg-elevated/40 border-line hover:border-line-strong text-dim"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleStep(stepKey)}
                                className="mt-0.5 size-4 accent-trust cursor-pointer shrink-0 rounded"
                              />
                              <span
                                className={`text-xs leading-relaxed ${
                                  isChecked ? "line-through text-faint" : "font-medium"
                                }`}
                              >
                                {step}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {stage.tip && (
                        <div className="p-3 bg-elevated/80 rounded-xl border border-line text-xs text-dim flex items-start gap-2">
                          <Sparkles size={14} className="text-ember shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-ink">Architect Note:</strong> {stage.tip}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Checklist Footer Actions */}
          <div className="pt-4 mt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-faint">
              Checklist state auto-saved locally in browser storage.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRunbook}
                className="btn-tactile px-3.5 py-1.5 rounded-xl border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {copiedRunbook ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                <span>{copiedRunbook ? "Copied Markdown!" : "Copy Runbook (Markdown)"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadRunbook}
                className="btn-tactile px-3.5 py-1.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download size={13} />
                <span>Download .md Runbook</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Executable Scripts Studio */
        <div className="my-4 space-y-3">
          {/* File Tab Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line text-xs">
            {[
              { key: "scripts/01-export.sh", label: "01-export.sh", badge: "POSIX" },
              { key: "scripts/01-export.ps1", label: "01-export.ps1", badge: "PowerShell" },
              { key: "scripts/02-transform.js", label: "02-transform.js", badge: "Node.js" },
              { key: "scripts/03-import.sh", label: "03-import.sh", badge: "Ingest" },
              { key: "scripts/04-verify.sh", label: "04-verify.sh", badge: "Verify" },
              { key: ".env.migration.example", label: ".env.migration", badge: "Config" },
            ].map((f) => {
              const isSelected = activeScriptKey === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveScriptKey(f.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-surface border border-line text-ink font-bold shadow-2xs"
                      : "text-dim hover:text-ink hover:bg-elevated"
                  }`}
                >
                  <FileCode size={13} className={isSelected ? "text-accent" : "text-faint"} />
                  <span>{f.label}</span>
                  <span className="text-[10px] font-mono opacity-70 px-1 rounded bg-elevated border border-line/60">
                    {f.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Script Code Viewer */}
          <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-2xs">
            <div className="p-3 border-b border-line bg-elevated/50 flex items-center justify-between text-xs">
              <span className="font-mono text-ink font-semibold flex items-center gap-1.5">
                <Terminal size={14} className="text-trust" />
                <span>{activeScriptKey}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-faint">Dry-run safe default (DRY_RUN=true)</span>
                <button
                  type="button"
                  onClick={handleCopyActiveScript}
                  className="btn-tactile px-2.5 py-1 rounded-md border border-line bg-surface hover:bg-elevated text-[11px] font-semibold text-ink inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedScript ? <Check size={12} className="text-trust" /> : <Copy size={12} />}
                  <span>{copiedScript ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 text-[12px] font-mono leading-relaxed overflow-x-auto max-h-[380px] text-ink bg-base/50">
              <code>{scriptsData?.[activeScriptKey] || (loadingScripts ? "Synthesizing customized script..." : "# Script template loading...")}</code>
            </pre>
          </div>

          <div className="p-3.5 bg-trust/10 border border-trust/20 rounded-xl text-xs text-ink flex items-center justify-between">
            <span>
              <strong>Ready to execute?</strong> Run scripts sequentially from your terminal, or download the full bundle to run locally.
            </span>
            <button
              type="button"
              onClick={handleDownloadZipBundle}
              className="btn-tactile px-3 py-1 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Download size={13} />
              <span>Download .zip Bundle</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

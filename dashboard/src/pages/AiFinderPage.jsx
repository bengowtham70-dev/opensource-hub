import { useState } from "react";
import {
  Sparkles,
  KeyRound,
  Send,
  Bot,
  Search,
  Star,
  ShieldCheck,
  ArrowUpRight,
  Cpu,
  Layers,
  Filter,
  CheckCircle2,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAiSettings } from "../stores/ai-settings";
import { EmptyState } from "../components/states";
import EmberProgress from "../components/EmberProgress";
import { formatStars, formatSavings } from "../lib/format";

const SAMPLE_PROMPTS = [
  {
    title: "Agency Invoicing",
    prompt: "I manage client invoices for my agency and hate the per-seat pricing",
    category: "Finance",
  },
  {
    title: "Datadog Replacement",
    prompt: "Self-hosted alternative to Datadog for traces, logs, and APM metrics",
    category: "DevOps",
  },
  {
    title: "Local-First Notion",
    prompt: "Offline-first Notion alternative with markdown and canvas drawing",
    category: "Productivity",
  },
  {
    title: "Redis In-Memory Cache",
    prompt: "Distributed in-memory key-value cache with Redis protocol compatibility",
    category: "Database",
  },
  {
    title: "Figma Alternative",
    prompt: "Open source vector graphics and UI design tool that teams can self-host",
    category: "Design",
  },
  {
    title: "API Client for Git",
    prompt: "Developer-friendly API testing client stored as plain text files in Git",
    category: "Developer Tools",
  },
];

export default function AiFinderPage() {
  const settings = useAiSettings();
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const runWithTask = async (queryText) => {
    const clean = (queryText ?? task).trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const json = await api.aiFind({
        task: clean,
        apiKey: settings.key,
        baseUrl: settings.baseUrl,
        model: settings.model,
      });
      setResult(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const run = (e) => {
    if (e) e.preventDefault();
    runWithTask(task);
  };

  const onTextareaKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && task.trim() && !loading) {
      e.preventDefault();
      run(e);
    }
  };

  const isOllama =
    settings.baseUrl &&
    (settings.baseUrl.includes("localhost") || settings.baseUrl.includes("127.0.0.1"));

  // Dynamic client-side filtering on results
  const rawResults = result?.results || [];
  const filteredResults = rawResults.filter((r) => {
    if (!r.pairing) return false;
    const alt = r.pairing.alternative;
    if (activeFilter === "self-host") {
      // Curated seeds use "self-host"; catalog-ingested rows use "self-hosted".
      return (alt.platforms || []).some((p) => p === "self-host" || p === "self-hosted");
    }
    if (activeFilter === "permissive") {
      const spdx = (alt.license?.spdx || alt.license || "").toLowerCase();
      const type = (alt.license?.type || alt.license?.safety || "").toLowerCase();
      return (
        type.includes("permissive") ||
        spdx.includes("mit") ||
        spdx.includes("apache") ||
        spdx.includes("bsd")
      );
    }
    if (activeFilter === "local-first") {
      return (
        (alt.tags || []).includes("local-first") ||
        (alt.tags || []).includes("offline") ||
        (alt.platforms || []).includes("win") ||
        (alt.platforms || []).includes("mac")
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-[960px] px-4 md:px-6 py-10">
      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface text-[12px] text-faint mb-3">
          <Sparkles size={13} className="text-accent" />
          <span>Semantic Discovery Engine · 26,000+ Tools</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-ink tracking-tight font-normal">
          AI Tool Finder
        </h1>
        <p className="text-dim mt-2.5 max-w-[66ch] text-[15px] leading-relaxed">
          Describe any workflow, business bottleneck, or commercial SaaS tool in plain English.
          Antigravity AI matches your requirements against verified open-source solutions with
          reasoned architectural trade-offs.
        </p>
      </header>

      {/* Input Card */}
      <form onSubmit={run} className="card-elevated p-6 flex flex-col gap-4">
        <div className="relative">
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            rows={3}
            placeholder='e.g. "I manage client invoices for my agency and hate paying per-seat subscriptions"'
            aria-label="Describe your task"
            className="w-full card-elevated !bg-elevated p-4 text-[15px] text-ink placeholder:text-faint outline-none focus:border-ink/40 transition-colors resize-y leading-relaxed font-sans"
          />
          {task && (
            <button
              type="button"
              onClick={() => setTask("")}
              aria-label="Clear task description"
              className="btn-tactile absolute right-3.5 top-3.5 px-2.5 py-1 rounded-md border border-line text-[11px] text-faint hover:text-ink bg-surface transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || !task.trim()}
              className="shimmer-button btn-tactile inline-flex items-center gap-2 px-6 py-2.5 font-medium text-sm text-surface bg-ink rounded-md disabled:opacity-50 transition-opacity"
            >
              {!loading && <Send size={14} />}
              {loading ? "Analyzing Catalog…" : "Find tools"}
              <kbd className="hidden sm:inline-block tnum text-[10px] ml-1 px-1.5 py-0.5 rounded border border-surface/30 text-surface/80 select-none">
                Ctrl+↵
              </kbd>
            </button>

            {/* Provider Status Pill */}
            <span
              className={`text-[12px] tnum px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 font-medium ${
                isOllama
                  ? "border-trust/30 bg-trust/10 text-trust-strong"
                  : settings.key
                  ? "border-ink/20 bg-ink/5 text-ink"
                  : "border-line bg-surface text-faint"
              }`}
            >
              {isOllama ? (
                <>
                  <Cpu size={13} /> Local AI · Ollama (Private)
                </>
              ) : settings.key ? (
                <>
                  <Bot size={13} /> Cloud AI · {settings.model}
                </>
              ) : (
                <>
                  <Search size={13} /> Offline Hybrid Match (26k+ Repos)
                </>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => settings.toggleOpen()}
            className="btn-tactile inline-flex items-center gap-1.5 text-[13px] text-dim hover:text-ink transition-colors px-3 py-1.5 rounded-md border border-line bg-surface"
          >
            <KeyRound size={13} />
            <span>{settings.open ? "Hide Settings" : "AI Provider"}</span>
          </button>
        </div>

        {loading && (
          <div className="mt-2">
            <EmberProgress />
          </div>
        )}

        {/* Engine Settings Drawer */}
        {settings.open && (
          <div className="mt-2 p-5 rounded-xl border border-line bg-surface/70 space-y-4 animate-card-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-faint">
                Configure Inference Provider
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => settings.setPreset("openai")}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    !isOllama && settings.baseUrl.includes("openai")
                      ? "border-ink bg-ink text-surface font-medium"
                      : "border-line text-faint hover:text-ink bg-elevated"
                  }`}
                >
                  OpenAI Cloud
                </button>
                <button
                  type="button"
                  onClick={() => settings.setPreset("ollama")}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    isOllama
                      ? "border-trust bg-trust/10 text-trust-strong font-medium"
                      : "border-line text-faint hover:text-ink bg-elevated"
                  }`}
                >
                  Ollama Local (Free)
                </button>
                <button
                  type="button"
                  onClick={() => settings.setPreset("openrouter")}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    settings.baseUrl.includes("openrouter")
                      ? "border-ink bg-ink text-surface font-medium"
                      : "border-line text-faint hover:text-ink bg-elevated"
                  }`}
                >
                  OpenRouter
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-[1fr_1fr_1fr] gap-3">
              <label className="text-[12px] text-faint flex flex-col gap-1.5">
                <span>API Key {isOllama && "(Not required for local Ollama)"}</span>
                <input
                  type="password"
                  value={settings.key}
                  onChange={(e) => settings.setKey(e.target.value)}
                  placeholder={isOllama ? "None needed" : "sk-…"}
                  disabled={isOllama}
                  className="card-elevated !bg-elevated px-3 py-2 text-[13px] text-ink tnum outline-none focus:border-ink/40 disabled:opacity-50"
                />
              </label>
              <label className="text-[12px] text-faint flex flex-col gap-1.5">
                <span>Base URL</span>
                <input
                  value={settings.baseUrl}
                  onChange={(e) => settings.setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="card-elevated !bg-elevated px-3 py-2 text-[13px] text-ink tnum outline-none focus:border-ink/40"
                />
              </label>
              <label className="text-[12px] text-faint flex flex-col gap-1.5">
                <span>Model Name</span>
                <input
                  value={settings.model}
                  onChange={(e) => settings.setModel(e.target.value)}
                  placeholder="gpt-5.4-mini"
                  className="card-elevated !bg-elevated px-3 py-2 text-[13px] text-ink tnum outline-none focus:border-ink/40"
                />
              </label>
            </div>
            <p className="text-[12px] text-faint">
              🔒 Keys are kept in your local browser only. Never transmitted to third-party tracking servers.
            </p>
          </div>
        )}
      </form>

      {error && (
        <div className="mt-6 p-4 rounded-xl border border-caution/30 bg-caution/10 text-caution text-sm">
          {error}
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="mt-8 space-y-5 animate-card-in">
          {/* Summary & Meta */}
          <div className="card-elevated p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-ink font-medium text-[15px] leading-relaxed">
                {result.summary || "Here are the best matching open-source solutions for your workflow:"}
              </p>
              <p className="text-xs text-faint mt-1">
                Showing {filteredResults.length} {filteredResults.length === 1 ? "recommendation" : "recommendations"}
                {result.mode === "offline" ? " via catalog semantic matching" : " via structured LLM synthesis"}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeFilter === "all"
                    ? "border-ink bg-ink text-surface font-medium"
                    : "border-line text-faint hover:text-ink bg-surface"
                }`}
              >
                All Tools
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("self-host")}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeFilter === "self-host"
                    ? "border-ink bg-ink text-surface font-medium"
                    : "border-line text-faint hover:text-ink bg-surface"
                }`}
              >
                Self-Hostable
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("permissive")}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeFilter === "permissive"
                    ? "border-ink bg-ink text-surface font-medium"
                    : "border-line text-faint hover:text-ink bg-surface"
                }`}
              >
                Permissive
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("local-first")}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeFilter === "local-first"
                    ? "border-ink bg-ink text-surface font-medium"
                    : "border-line text-faint hover:text-ink bg-surface"
                }`}
              >
                Local-First
              </button>
            </div>
          </div>

          {filteredResults.length === 0 && (
            <EmptyState
              title="No tools match this filter"
              body="Try resetting the filter to 'All Tools' or describe your requirements with different terms."
              action={
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className="shimmer-button btn-tactile px-4 py-2 text-sm text-surface bg-ink rounded-md"
                >
                  Reset Filter
                </button>
              }
            />
          )}

          {/* Cards Grid */}
          <div className="grid gap-4">
            {filteredResults.map((r, i) => {
              const alt = r.pairing.alternative;
              const paid = r.pairing.paidTool;
              const confidencePct = Math.round((r.confidence ?? 0.5) * 100);

              return (
                <div
                  key={r.repo}
                  className="card-elevated p-6 flex flex-col md:flex-row md:items-start gap-5 group transition-colors"
                >
                  {/* Rank Indicator */}
                  <div className="shrink-0 flex items-center md:flex-col gap-2 pt-0.5">
                    <span className="tnum text-xs text-faint font-semibold px-2 py-1 rounded bg-elevated border border-line">
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="text-[11px] tnum font-medium px-2 py-0.5 rounded-full border border-trust/30 bg-trust/10 text-trust-strong"
                      title="Match Confidence"
                    >
                      {confidencePct}%
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/repo/${r.repo}`}
                        className="font-display text-2xl text-ink group-hover:text-link transition-colors font-medium flex items-center gap-2"
                      >
                        {alt.name}
                        <ArrowUpRight size={17} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                      </Link>

                      {alt.language && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-line bg-surface text-dim font-medium">
                          {alt.language}
                        </span>
                      )}

                      {alt.stars != null && (
                        <span className="text-[11px] tnum px-2.5 py-0.5 rounded-full border border-line bg-surface text-ink font-medium inline-flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          {formatStars(alt.stars)}
                        </span>
                      )}

                      {paid?.name && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-line bg-surface text-faint">
                          Replaces {paid.name}
                        </span>
                      )}

                      {paid?.pricePerYearUsd > 0 && (
                        <span className="text-[11px] tnum px-2.5 py-0.5 rounded-full border border-accent/20 bg-accent/10 text-link font-medium">
                          Save ~{formatSavings(paid.pricePerYearUsd)}/yr
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-[14px] text-dim leading-relaxed">
                      {alt.description}
                    </p>

                    {/* AI Reasoning Callout */}
                    <div className="p-3.5 rounded-lg border-l-2 border-trust bg-trust/5 text-[13.5px] text-ink/90 leading-relaxed space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-trust-strong block">
                        Why this fits your workflow:
                      </span>
                      <p>{r.reason}</p>
                    </div>

                    {/* Tags / Platforms */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {(alt.tags || []).slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="text-[11px] px-2 py-0.5 rounded border border-line/60 bg-elevated/50 text-faint"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="shrink-0 flex md:flex-col gap-2 pt-1">
                    <Link
                      to={`/repo/${r.repo}`}
                      className="btn-tactile px-4 py-2 text-xs font-medium text-surface bg-ink rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-ink/90 transition-colors"
                    >
                      View Profile
                    </Link>
                    {paid?.slug && (
                      <Link
                        to={`/alternatives/${paid.slug}`}
                        className="btn-tactile px-3 py-2 text-xs font-medium text-dim hover:text-ink rounded-md border border-line bg-surface inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        All Alternatives
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Prompts Section */}
      {!result && !loading && !error && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">
              Or Explore Real-World Workflow Queries
            </h2>
            <span className="text-xs text-faint">Click to run immediately</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex.title}
                type="button"
                onClick={() => {
                  setTask(ex.prompt);
                  runWithTask(ex.prompt);
                }}
                className="btn-tactile card-elevated p-4 text-left hover:border-ink/30 transition-all flex flex-col justify-between group h-full"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium text-link">
                      {ex.category}
                    </span>
                    <Zap size={13} className="text-faint group-hover:text-ink transition-colors" />
                  </div>
                  <h3 className="font-medium text-sm text-ink group-hover:text-link transition-colors">
                    {ex.title}
                  </h3>
                  <p className="text-xs text-dim mt-1.5 leading-relaxed">
                    "{ex.prompt}"
                  </p>
                </div>
                <span className="text-[11px] text-faint group-hover:text-ink transition-colors mt-3 inline-flex items-center gap-1">
                  Run Query →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

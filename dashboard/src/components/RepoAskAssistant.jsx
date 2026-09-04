import { useState, useRef, useEffect } from "react";
import { Terminal, Send, Sparkles, Bot, Copy, Check, CornerDownLeft, RefreshCw, Layers } from "lucide-react";
import Markdown from "../lib/markdown";
import { api } from "../lib/api";

const QUICK_PROMPTS = [
  { label: "Quickstart & Install", query: "How do I install and run this locally?" },
  { label: "Environment & Keys", query: "What API keys and environment variables are needed?" },
  { label: "Docker & Self-Host", query: "How do I run this with Docker or Compose?" },
  { label: "Trade-Offs & Parity", query: "What are the key architectural trade-offs vs proprietary software?" },
];

export default function RepoAskAssistant({ owner, name }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (questionToAsk) => {
    const q = (questionToAsk || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.askRepo(owner, name, q);
      if (data && data.answer) {
        setResponse(data);
      } else {
        setError("Unable to generate answer from repository context.");
      }
    } catch (err) {
      setError(err.message || "Failed to query repository assistant.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response?.answer) return;
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-elevated rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-line bg-canvas/40">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink grid place-items-center">
            <Bot size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-ink">Ask Byte About This Repo</span>
              <span className="inline-flex items-center gap-1 text-[10.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-trust/10 text-trust border border-trust/20">
                <span className="size-1.5 rounded-full bg-trust animate-pulse" />
                Live Assistant
              </span>
            </div>
            <p className="text-[11px] text-faint">
              Instant grounded answers, setup commands, and configuration extracted from this repository
            </p>
          </div>
        </div>

        {response && (
          <button
            type="button"
            onClick={() => {
              setResponse(null);
              setQuery("");
            }}
            className="btn-tactile text-xs text-dim hover:text-ink inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-elevated transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>New Question</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-4">
        {/* Quick Prompts Chips */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-faint mb-2">
            Suggested Developer Questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                type="button"
                disabled={loading}
                onClick={() => {
                  setQuery(p.query);
                  handleSubmit(p.query);
                }}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-line bg-surface hover:border-line-strong hover:bg-elevated text-dim hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={12} className="text-ember" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask anything about ${name} (e.g. "What are the configuration flags?", "How to run with Docker?")...`}
            disabled={loading}
            className="w-full pl-4 pr-24 py-2.5 rounded-xl border border-line bg-canvas focus:bg-surface text-ink text-sm placeholder:text-faint focus:outline-none focus:border-line-strong transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-ink dark:bg-surface text-surface dark:text-ink text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <CornerDownLeft size={12} />
              </>
            )}
          </button>
        </form>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300">
            {error}
          </div>
        )}

        {/* Answer Display */}
        {response && (
          <div className="card-elevated p-4 rounded-xl border border-line bg-canvas/60 space-y-3 animate-card-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink">Source:</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-elevated text-dim border border-line">
                  {response.source === "ollama" ? `Ollama (${response.model || "Local Model"})` : `Extracted from README: ${response.matchedSection || "Docs"}`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-tactile inline-flex items-center gap-1.5 text-xs text-dim hover:text-ink px-2.5 py-1 rounded-md border border-line bg-surface hover:bg-elevated transition-colors cursor-pointer"
                title="Copy response markdown"
              >
                {copied ? <Check size={12} className="text-trust" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none text-ink text-sm leading-relaxed overflow-x-auto">
              <Markdown source={response.answer} content={response.answer} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

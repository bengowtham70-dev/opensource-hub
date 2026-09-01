import { useState } from "react";
import { Sparkles, KeyRound, Send, Bot, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAiSettings } from "../stores/ai-settings";
import { EmptyState } from "../components/states";
import EmberProgress from "../components/EmberProgress";

// F7 — AI Tool Finder (PRD §21). The key lives in YOUR browser (localStorage)
// and is sent per-request to the local server only — never stored server-side.
export default function AiFinderPage() {
  const settings = useAiSettings();
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const json = await api.aiFind({
        task,
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

  const onTextareaKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && task.trim() && !loading) {
      e.preventDefault();
      run(e);
    }
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 md:px-6 py-10">
      <header className="mb-6">
        <h1 className="font-display text-display-lg flex items-center gap-3">
          <Sparkles size={28} className="text-dim" /> AI Tool Finder
        </h1>
        <p className="text-dim mt-2 max-w-[62ch]">
          Describe the job you're trying to get done — no keyword guessing. Get a short, reasoned
          shortlist from the catalog.
        </p>
      </header>

      <form onSubmit={run} className="card-elevated p-5 flex flex-col gap-3">
        <div className="relative">
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            rows={3}
            placeholder='e.g. "I manage client invoices for my agency and hate the per-seat pricing"'
            aria-label="Describe your task"
            className="w-full card-elevated !bg-elevated p-3.5 text-[14.5px] text-ink placeholder:text-faint outline-none focus:border-primary/50 resize-y"
          />
          {task && (
            <button
              type="button"
              onClick={() => setTask("")}
              aria-label="Clear task description"
              className="btn-tactile absolute right-3 top-3 px-2 py-0.5 rounded-full border border-line text-[11px] text-faint hover:text-dim bg-surface"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !task.trim()}
            className="shimmer-button btn-tactile inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-ink disabled:opacity-50"
          >
            {!loading && <Send size={15} />}
            {loading ? "Thinking…" : "Find tools"}
            <kbd className="hidden sm:inline-block tnum text-[10px] ml-1 px-1.5 py-0.5 rounded border border-line text-faint select-none">
              Ctrl+↵
            </kbd>
          </button>
          <span
            className={`text-[12px] tnum px-2.5 py-1 rounded-full border ${
              settings.key
                ? "border-trust/30 bg-trust/10 text-trust"
                : "border-line text-faint"
            }`}
          >
            {settings.key ? `AI mode · ${settings.model}` : "offline matching — no key"}
          </span>
          <button
            type="button"
            onClick={() => settings.toggleOpen()}
            className="btn-tactile inline-flex items-center gap-1.5 text-[12.5px] text-faint hover:text-dim"
          >
            <KeyRound size={13} /> {settings.key ? "API settings" : "Add API key"}
          </button>
        </div>
        {loading && (
          <div className="mt-1">
            <EmberProgress />
          </div>
        )}

        {settings.open && (
          <div className="mt-1 p-4 rounded-xl border border-line bg-elevated/50 grid sm:grid-cols-[1fr_180px_140px] gap-2.5 animate-card-in opacity-0">
            <label className="text-[12px] text-faint flex flex-col gap-1">
              API key (stored in this browser only)
              <input
                type="password"
                value={settings.key}
                onChange={(e) => settings.setKey(e.target.value)}
                placeholder="sk-…"
                className="card-elevated !bg-elevated px-3 py-2 text-[13px] text-ink tnum outline-none focus:border-primary/50"
              />
            </label>
            <label className="text-[12px] text-faint flex flex-col gap-1">
              Base URL
              <input
                value={settings.baseUrl}
                onChange={(e) => settings.setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="card-elevated !bg-elevated px-3 py-2 text-[13px] text-ink tnum outline-none focus:border-primary/50"
              />
            </label>
            <label className="text-[12px] text-faint flex flex-col gap-1">
              Model
              <input
                value={settings.model}
                onChange={(e) => settings.setModel(e.target.value)}
                placeholder="gpt-5.4-mini"
                className="card-elevated !bg-elevated px-3 py-2 text-[13px] text-ink tnum outline-none focus:border-primary/50"
              />
            </label>
          </div>
        )}
      </form>

      {error && (
        <p className="mt-5 text-caution tnum text-sm" role="alert">{error}</p>
      )}

      {result && (
        <div className="mt-6 animate-card-in opacity-0">
          {result.summary && (
            <p className="text-dim text-[14px] leading-relaxed mb-4 max-w-[70ch]">{result.summary}</p>
          )}
          {result.mode === "offline" && (
            <p className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line text-[12px] text-faint tnum">
              <Bot size={12} /> offline keyword matching — add a key above for AI ranking
            </p>
          )}
          {result.results.length === 0 && (
            <EmptyState
              title="Nothing matched"
              body="Try describing the job differently — or browse the trending list; the catalog is small but growing."
              action={
                <Link to="/" className="shimmer-button btn-tactile px-4 py-2 text-sm text-ink">
                  Browse trending
                </Link>
              }
            />
          )}
          <div className="grid gap-3">
            {result.results.map((r, i) =>
              r.pairing ? (
                <Link
                  key={r.repo}
                  to={`/repo/${r.repo}`}
                  className="card-elevated p-5 flex items-start gap-4 group animate-card-in"
                  style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
                >
                  <span className="tnum text-[12px] text-faint mt-1">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-lg text-ink group-hover:text-link transition-colors">
                        {r.pairing.alternative.name}
                      </span>
                      <span className="tnum text-[11px] text-faint">
                        replaces {r.pairing.paidTool.name}
                      </span>
                    </span>
                    <span className="block text-[13px] text-dim mt-1 leading-relaxed">{r.reason}</span>
                  </span>
                  <span
                    className="shrink-0 tnum text-[11px] text-faint"
                    title="model confidence"
                  >
                    {Math.round((r.confidence ?? 0.5) * 100)}%
                  </span>
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          {[
            "I manage client invoices for my agency",
            "Team chat that isn't rented per seat",
            "Design tool my whole team can edit in",
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setTask(ex)}
              className="btn-tactile card-elevated p-4 text-left text-[13px] text-dim hover:text-ink flex items-start gap-2"
            >
              <Search size={14} className="text-faint shrink-0 mt-0.5" /> {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layers, FileSpreadsheet, Save, ArrowRight, CircleAlert } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState } from "../components/states";
import { formatSavings } from "../lib/format";

// F9 (PRD §20) — Stack Audit: paste your paid stack → alternatives + totals + CSV.
// Free tier keeps ONE saved audit locally, revisitable (PRD §22 freemium shape).
export default function StackAuditPage() {
  const [input, setInput] = useState("");
  const [report, setReport] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .stackSaved()
      .then((s) => {
        setReport(s.report);
        setSavedAt(s.savedAt);
      })
      .catch(() => {});
  }, []);

  const run = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const json = await api.stackAudit(input);
      setReport(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      await api.saveStack(report);
      setSavedAt(new Date().toISOString());
    } catch {
      /* silent */
    }
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 md:px-6 py-10">
      <header className="mb-6">
        <h1 className="font-display text-display-lg flex items-center gap-3">
          <Layers size={28} className="text-primary" /> Stack Audit
        </h1>
        <p className="text-dim mt-2 max-w-[65ch]">
          Paste the paid software your team rents — one per line. Get every open-source
          alternative we know about, with honest annual savings across the whole stack.
        </p>
      </header>

      <form onSubmit={run} className="card-glass p-5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          placeholder={"Notion\nFigma\nPostman\nSlack\n1Password"}
          aria-label="Your paid tools, one per line"
          className="w-full card-glass !bg-elevated p-3.5 text-[14px] text-ink placeholder:text-faint tnum outline-none focus:border-primary/50 resize-y"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shimmer-button btn-tactile px-5 py-2.5 font-semibold text-ink disabled:opacity-50"
          >
            {loading ? "Auditing…" : "Audit my stack"}
          </button>
          <span className="text-[12px] text-faint">
            28 paid tools in the catalog — unmatched entries are listed honestly.
          </span>
        </div>
      </form>

      {error && <p className="mt-4 text-caution tnum text-sm" role="alert">⚠ {error}</p>}

      {report && (
        <div className="mt-6 animate-card-in opacity-0">
          {/* Totals banner */}
          <div className="card-glass mesh-glow-bg p-6 mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="tnum text-[11px] uppercase tracking-wider text-trust/70">
                {report.totals.tools} of your tools replaceable
              </p>
              <p className="font-display text-4xl text-trust mt-1" style={{ textShadow: "0 0 22px rgba(16,185,129,0.35)" }}>
                {formatSavings(report.totals.savingsPerYearUsd)}
                <span className="text-base text-faint font-body font-normal">/yr across the stack</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line text-dim hover:text-ink text-[13px]"
              >
                <Save size={14} /> {savedAt ? "Saved ✓" : "Save this audit"}
              </button>
              <a
                href="/api/stack-audit/saved/export"
                onClick={(e) => {
                  e.preventDefault();
                  fetch("/api/stack-audit/saved", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ report }),
                  }).then(() => {
                    window.location.href = "/api/stack-audit/saved/export";
                  });
                }}
                className="shimmer-button btn-tactile inline-flex items-center gap-2 px-4 py-2 text-[13px] text-ink"
              >
                <FileSpreadsheet size={14} /> Export CSV
              </a>
            </div>
            {savedAt && (
              <p className="w-full text-[11.5px] text-faint tnum">
                Saved locally {new Date(savedAt).toLocaleString()} — one stack audit kept (free tier).
              </p>
            )}
          </div>

          {/* Matched rows */}
          <div className="grid gap-3">
            {report.matched.map((m, i) => (
              <div
                key={m.paidTool.name}
                className="card-glass p-5 flex flex-wrap items-center gap-4 animate-card-in"
                style={{ animationDelay: `${Math.min(i, 11) * 40}ms`, opacity: 0 }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-faint">
                    {m.paidTool.planName}
                  </p>
                  <p className="tnum text-[14px] text-dim line-through decoration-caution/70">
                    {m.paidTool.name}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-trust/10 border border-trust/30 text-trust text-[12px] font-semibold whitespace-nowrap">
                  <ArrowRight size={12} /> Save {formatSavings(m.savingsPerYearUsd)}/yr
                </span>
                <div className="min-w-0">
                  <Link
                    to={`/repo/${m.alternative.repo}`}
                    className="font-display text-lg text-ink hover:text-primary transition-colors"
                  >
                    {m.alternative.name}
                  </Link>
                  <p className="tnum text-[11.5px] text-faint">
                    {m.alternative.repo}
                    {m.alternative.license?.spdx ? ` · ${m.alternative.license.spdx}` : ""}
                    {m.matchConfidence !== "exact" && ` · ${m.matchConfidence} match`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Honest unmatched list */}
          {report.unmatched.length > 0 && (
            <div className="mt-4 p-4 rounded-xl border border-line bg-primary/5">
              <p className="text-[13px] text-dim flex items-start gap-2">
                <CircleAlert size={14} className="text-caution shrink-0 mt-0.5" />
                <span>
                  No alternative in the catalog yet for:{" "}
                  <span className="tnum text-[12.5px] text-faint">
                    {report.unmatched.join(" · ")}
                  </span>{" "}
                  — the catalog grows with each daily sync.
                </span>
              </p>
            </div>
          )}

          <p className="mt-4 text-[11px] text-faint max-w-[75ch]">{report.totals.disclaimer}</p>
        </div>
      )}

      {!report && !loading && (
        <div className="mt-6">
          <EmptyState
            title="Audit your whole stack in one paste"
            body="List what your team pays for today. Anything we can replace shows up with its alternative, license and yearly savings — exportable as CSV for your next budget meeting."
          />
        </div>
      )}
    </div>
  );
}

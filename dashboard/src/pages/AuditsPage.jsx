import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, FileSpreadsheet, Trash2, TrendingUp, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState } from "../components/states";

// F8 — saved trust audits (PRD §22 saved comparisons + §20 exportable report).
// Trend chart appears once the daily cron accumulates ≥7 days of snapshots;
// until then we say so honestly instead of drawing fake history.
export default function AuditsPage() {
  const [audits, setAudits] = useState(null);

  useEffect(() => {
    api.audits().then(setAudits).catch(() => setAudits([]));
  }, []);

  const remove = async (repo) => {
    await api.removeAudit(repo);
    setAudits((a) => a.filter((x) => x.repo !== repo));
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 md:px-6 py-10">
      <header className="mb-6">
        <h1 className="font-display text-display-lg flex items-center gap-3">
          <Bookmark size={26} className="text-primary" /> Saved audits
        </h1>
        <p className="text-dim mt-2 text-[14px] max-w-[65ch]">
          Point-in-time trust snapshots you kept — export any of them as CSV for a procurement
          ticket. Stored locally on this machine.
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-[12px] text-faint tnum px-2.5 py-1 rounded-full border border-line">
          <TrendingUp size={12} /> 90-day trend charts unlock once the daily snapshot cron
          accumulates a week of real history — no fabricated data here.
        </p>
      </header>

      {!audits && <div className="skeleton h-24 w-full" />}

      {audits && audits.length === 0 && (
        <EmptyState
          title="No saved audits yet"
          body="Open any tool and hit “Save audit” on its Trust Score card — keep a point-in-time record you can export later."
          action={
            <Link to="/" className="shimmer-button btn-tactile px-4 py-2 text-sm text-ink">
              Find a tool
            </Link>
          }
        />
      )}

      <div className="grid gap-3">
        {audits &&
          audits.map((a, i) => (
            <div
              key={a.repo}
              className="card-glass p-5 flex flex-wrap items-center gap-4 animate-card-in"
              style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
            >
              <div className="min-w-0 flex-1">
                <Link to={`/repo/${a.repo}`} className="font-display text-lg text-ink hover:text-primary transition-colors">
                  {a.repo.split("/")[1]}
                </Link>
                <p className="tnum text-[12px] text-faint">
                  saved {new Date(a.savedAt).toLocaleDateString()} · {a.signals.length} signals
                </p>
              </div>
              <span
                className={`font-display text-2xl ${
                  a.band === "strong" || a.band === "good" ? "text-trust" : "text-caution"
                }`}
              >
                {a.score}
                <span className="text-[12px] text-faint tnum">/100</span>
              </span>
              <div className="flex items-center gap-1.5">
                <a
                  href={`/api/audits/${a.repo}/export`}
                  download
                  className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line text-[12px] text-dim hover:text-ink hover:border-tech/40"
                  title="Download CSV for a procurement ticket"
                >
                  <FileSpreadsheet size={13} /> CSV
                </a>
                <button
                  type="button"
                  onClick={() => remove(a.repo)}
                  aria-label={`Remove audit for ${a.repo}`}
                  className="btn-tactile grid place-items-center size-8 rounded-full border border-line text-faint hover:text-caution hover:border-caution/40"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {audits && audits.length > 0 && (
        <p className="mt-6 text-[12px] text-faint flex items-center gap-1.5">
          Re-check a repo any time — its live Trust Score card has a fresh “Save audit” button
          <ArrowRight size={12} />
        </p>
      )}
    </div>
  );
}

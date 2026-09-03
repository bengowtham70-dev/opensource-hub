import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, RefreshCw, ShieldCheck, ArrowRight, AlertTriangle, CheckCircle2, Rss, Download } from "lucide-react";
import { useWatchlist } from "../stores/watchlist";
import { EmptyState } from "../components/states";

export default function WatchlistPage() {
  const watchlist = useWatchlist();
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  const watchedEntries = Object.entries(watchlist.watched).map(([repo, baselineScore]) => ({
    repo,
    baselineScore,
  }));

  const exportWatchlist = () => {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      watchlist: watchlist.watched,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "osh-watchlist.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await watchlist.check();
      setCheckResult({
        alerts: res.alerts || [],
        checkedAt: res.checkedAt || new Date().toISOString(),
      });
    } catch (err) {
      setCheckResult({ error: err.message });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 md:px-6 py-10 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs">
            <Bell size={13} className="text-accent" />
            <span>Health & Trust Alerts</span>
          </div>
          <h1 className="font-display text-display-lg text-ink">
            Your Watchlist
          </h1>
          <p className="text-sm text-dim max-w-[60ch]">
            Tracked repositories monitored for sudden Trust Score drops, maintenance slowdowns, or licensing changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/feeds/rss"
            target="_blank"
            rel="noreferrer"
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-line bg-surface text-xs font-semibold text-dim hover:text-ink shadow-2xs transition-colors"
            title="Subscribe to RSS Release Feed"
          >
            <Rss size={13} className="text-accent shrink-0" />
            <span>RSS Feed</span>
          </a>

          <button
            type="button"
            onClick={exportWatchlist}
            disabled={watchedEntries.length === 0}
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-line bg-surface text-xs font-semibold text-dim hover:text-ink shadow-2xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={watchedEntries.length > 0 ? "Download your watchlist as JSON" : "Watchlist is empty"}
          >
            <Download size={13} className="text-ember shrink-0" />
            <span>Export JSON</span>
          </button>

          {watchedEntries.length > 0 && (
            <button
              type="button"
              onClick={handleCheckNow}
              disabled={checking}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface text-xs font-semibold text-ink hover:border-line-strong shadow-2xs transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw size={14} className={checking ? "animate-spin text-accent" : "text-faint"} />
              <span>{checking ? "Checking signals..." : "Check health now"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Check Status Feedback */}
      {checkResult && (
        <div className={`p-4 rounded-xl border text-xs animate-card-in ${
          checkResult.error
            ? "border-caution/30 bg-caution/10 text-caution"
            : checkResult.alerts.length > 0
            ? "border-caution/30 bg-caution/10 text-caution"
            : "border-trust/30 bg-trust/10 text-trust"
        }`}>
          {checkResult.error ? (
            <p>Health check failed: {checkResult.error}</p>
          ) : checkResult.alerts.length > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle size={14} />
                <span>{checkResult.alerts.length} health alert(s) detected:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                {checkResult.alerts.map((a) => (
                  <li key={a.repo}>
                    <Link to={`/repo/${a.repo}`} className="underline font-semibold">{a.repo}</Link>: {a.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>All watched repositories maintain healthy Trust Scores with zero critical drops.</span>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {watchedEntries.length === 0 ? (
        <EmptyState
          title="No repositories in your watchlist"
          body="Click the Bell icon on any open source tool's profile page to watch it. You'll receive automated alerts if its Trust Score drops or maintenance stalls."
          action={
            <Link to="/" className="shimmer-button btn-tactile px-4 py-2 text-sm text-ink inline-flex items-center gap-1.5">
              <span>Browse trending tools</span>
              <ArrowRight size={14} />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {watchedEntries.map(({ repo, baselineScore }) => (
            <div
              key={repo}
              className="card-elevated p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-card-in"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/repo/${repo}`}
                    className="font-display text-lg font-semibold text-ink hover:text-link transition-colors truncate"
                  >
                    {repo}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-xs text-faint">
                  <span>Baseline Trust Score:</span>
                  <span className="font-semibold text-ink px-2 py-0.5 rounded-md bg-elevated border border-line tnum">
                    {baselineScore ?? "Unscored"}
                  </span>
                  <span>·</span>
                  <span>Monitored on this machine</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/repo/${repo}`}
                  className="btn-tactile px-3.5 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-dim hover:text-ink transition-colors"
                >
                  View Details
                </Link>
                <button
                  type="button"
                  onClick={() => watchlist.toggle(repo)}
                  className="btn-tactile p-2 rounded-lg border border-line bg-surface text-faint hover:text-caution hover:border-caution/30 transition-colors"
                  title="Remove from watchlist"
                  aria-label={`Unwatch ${repo}`}
                >
                  <BellOff size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

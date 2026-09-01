import { useState, useEffect } from "react";
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  Zap,
  Activity,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { api } from "../lib/api";

export default function ApiKeyModal({ open, onClose, onStatusChange }) {
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchStatus = () => {
    setLoading(true);
    setError(null);
    api
      .githubStatus()
      .then((s) => {
        setStatus(s);
        if (onStatusChange) onStatusChange(s);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) {
      fetchStatus();
      setTokenInput("");
      setSuccessMsg(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError("Please enter a GitHub Personal Access Token.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.setGithubToken(tokenInput.trim());
      setSuccessMsg(res.message || "Connected successfully!");
      setTokenInput("");
      fetchStatus();
    } catch (err) {
      setError(err.message || "Failed to validate GitHub token.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteGithubToken();
      setSuccessMsg("GitHub token disconnected.");
      fetchStatus();
    } catch (err) {
      setError(err.message || "Failed to disconnect.");
    } finally {
      setLoading(false);
    }
  };

  const remaining = status?.rateLimit?.remaining ?? 60;
  const limit = status?.rateLimit?.limit ?? 60;
  const percentUsed = Math.min(100, Math.max(0, Math.round(((limit - remaining) / limit) * 100)));
  const percentLeft = 100 - percentUsed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl transition-all duration-150 space-y-5 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 grid place-items-center size-8 rounded-full text-dim hover:text-ink hover:bg-surface-elevated transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="grid place-items-center size-10 rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
            <Key size={20} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">GitHub API Connection</h2>
            <p className="text-xs sm:text-sm text-dim mt-0.5">
              Connect a GitHub Token to unlock live search across millions of repositories and 5,000 requests/hr.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
            <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Live Status Card */}
        <div className="rounded-xl border border-line bg-surface-elevated p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-faint">Live Quota & Status</span>
            {status?.hasToken ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Authenticated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Unauthenticated (60 req/hr)
              </span>
            )}
          </div>

          {/* User Info if connected */}
          {status?.user && (
            <div className="flex items-center gap-3 pt-1 pb-2 border-b border-line">
              {status.user.avatar_url && (
                <img
                  src={status.user.avatar_url}
                  alt={status.user.login}
                  className="size-9 rounded-full border border-line"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink truncate">{status.user.name || status.user.login}</p>
                  <span className="text-xs text-dim">@{status.user.login}</span>
                </div>
                <p className="text-xs text-faint">{status.user.public_repos ?? 0} public repositories</p>
              </div>
            </div>
          )}

          {/* Rate Limit Meter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-dim">
              <span className="inline-flex items-center gap-1">
                <Activity size={13} className="text-accent" />
                <span>API Calls Available:</span>
              </span>
              <span className="font-semibold text-ink tnum">
                {(remaining ?? 0).toLocaleString()} / {(limit ?? 60).toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-line overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  percentLeft > 30 ? "bg-emerald-500" : percentLeft > 10 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${percentLeft}%` }}
              />
            </div>
          </div>
        </div>

        {/* Token Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="gh-token-input" className="block text-xs font-semibold text-ink mb-1.5">
              Personal Access Token (classic or fine-grained)
            </label>
            <div className="relative">
              <input
                id="gh-token-input"
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={status?.hasToken ? "Paste new token to replace..." : "ghp_xxxxxxxxxxxxxxxxxxxx"}
                className="w-full h-10 px-3.5 pr-10 rounded-lg border border-line bg-surface text-ink text-sm placeholder:text-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-ink transition-colors"
                tabIndex={-1}
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-faint mt-1.5">
              Tokens are stored strictly locally on your machine in <code className="text-ink">~/.opensource-hub</code> and never sent to any third-party server.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {status?.hasToken ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
              >
                <Trash2 size={14} />
                <span>Disconnect Key</span>
              </button>
            ) : (
              <a
                href="https://github.com/settings/tokens/new?description=OpenSource+Hub&scopes=public_repo"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <span>Generate token on GitHub</span>
                <ExternalLink size={12} />
              </a>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-md border border-line bg-surface text-xs font-medium text-dim hover:text-ink hover:border-line-strong transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-ink text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                <span>Verify & Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

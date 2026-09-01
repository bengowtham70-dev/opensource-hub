import { useState, useEffect } from "react";
import {
  HeartHandshake,
  GitPullRequest,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  CircleDot,
  MessageSquare,
  X,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function ContributionRadar({ repo, name = "" }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(null); // 'first-issue' | 'help-wanted' | 'prs'
  const [copiedUrl, setCopiedUrl] = useState(false);

  const repoName = name || (repo ? repo.split("/")[1] : "");

  const goodFirstIssuesUrl = `https://github.com/${repo}/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22`;
  const helpWantedUrl = `https://github.com/${repo}/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22`;
  const prsUrl = `https://github.com/${repo}/pulls`;

  useEffect(() => {
    if (!repo) return;
    setLoading(true);
    fetch(`/api/repo/${repo}/issues?label=good+first+issue`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.items)) {
          setIssues(data.items.slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [repo]);

  if (!repo) return null;

  const getActiveUrl = () => {
    if (selectedTab === "help-wanted") return helpWantedUrl;
    if (selectedTab === "prs") return prsUrl;
    return goodFirstIssuesUrl;
  };

  const copyActiveUrl = async () => {
    try {
      await navigator.clipboard.writeText(getActiveUrl());
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  return (
    <section
      className="card-elevated p-6 mt-6 relative overflow-hidden bg-surface border border-line rounded-2xl space-y-5"
      aria-label="Good First Issues & Contribution Radar"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-9 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
            <HeartHandshake size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Contribution Radar</h2>
            <p className="text-xs text-dim">
              Help build and improve {repoName}. Curated beginner-friendly tasks and active backlog.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-trust/30 bg-trust/10 text-trust text-xs font-semibold">
          <Sparkles size={13} className="text-trust" />
          Community Welcome
        </span>
      </div>

      {/* 3 Interactive Cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {/* Good First Issues */}
        <div
          onClick={() => setSelectedTab("first-issue")}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
            selectedTab === "first-issue"
              ? "bg-pink-500/10 border-pink-500/50 shadow-sm"
              : "bg-elevated/40 border-line hover:border-pink-500/40 hover:bg-surface"
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-pink-500 mb-2">
              <Sparkles size={16} />
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-500/10">
                Beginner
              </span>
            </div>
            <h3 className="font-display text-sm font-bold text-ink">Good First Issues</h3>
            <p className="text-xs text-faint mt-1 leading-relaxed">
              Curated beginner-friendly tasks ideal for first-time open-source contributors.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-pink-600 dark:text-pink-400 font-semibold">
            <span>Explore Tasks</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* Help Wanted */}
        <div
          onClick={() => setSelectedTab("help-wanted")}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
            selectedTab === "help-wanted"
              ? "bg-amber-500/10 border-amber-500/50 shadow-sm"
              : "bg-elevated/40 border-line hover:border-amber-500/40 hover:bg-surface"
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <HelpCircle size={16} />
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10">
                Features
              </span>
            </div>
            <h3 className="font-display text-sm font-bold text-ink">Help Wanted</h3>
            <p className="text-xs text-faint mt-1 leading-relaxed">
              High-impact feature requests and bug fixes currently needing maintainer assistance.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
            <span>View Backlog</span>
            <ArrowRight size={13} />
          </div>
        </div>

        {/* Active Pull Requests */}
        <div
          onClick={() => setSelectedTab("prs")}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
            selectedTab === "prs"
              ? "bg-blue-500/10 border-blue-500/50 shadow-sm"
              : "bg-elevated/40 border-line hover:border-blue-500/40 hover:bg-surface"
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-blue-500 mb-2">
              <GitPullRequest size={16} />
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10">
                In Progress
              </span>
            </div>
            <h3 className="font-display text-sm font-bold text-ink">Active Pull Requests</h3>
            <p className="text-xs text-faint mt-1 leading-relaxed">
              Review community contributions and see upcoming changes shipping next.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
            <span>Browse PRs</span>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>

      {/* In-App Live Issues Drawer / Explorer */}
      {selectedTab && (
        <div className="card-elevated p-5 rounded-xl border border-line bg-surface/90 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <CircleDot size={16} className="text-trust" />
              <h4 className="font-semibold text-sm text-ink">
                {selectedTab === "first-issue"
                  ? "Live Beginner Issues"
                  : selectedTab === "help-wanted"
                  ? "Open Help Wanted Backlog"
                  : "Community Pull Requests"}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyActiveUrl}
                className="btn-tactile px-2.5 py-1 rounded-lg border border-line text-xs text-dim hover:text-ink inline-flex items-center gap-1"
                title="Copy GitHub issues search link"
              >
                {copiedUrl ? <Check size={12} className="text-trust" /> : <Copy size={12} />}
                <span>{copiedUrl ? "Copied Link" : "Copy Query URL"}</span>
              </button>

              <a
                href={getActiveUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile px-3 py-1 rounded-lg bg-ink text-white dark:bg-white dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Open on GitHub</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                onClick={() => setSelectedTab(null)}
                className="p-1 text-faint hover:text-ink rounded-md"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List of Live Issues */}
          {issues.length > 0 ? (
            <div className="space-y-2">
              {issues.map((item) => (
                <a
                  key={item.id || item.number}
                  href={item.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg border border-line bg-elevated/40 hover:border-line-strong hover:bg-surface transition-all flex items-center justify-between gap-3 group block"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-faint">#{item.number}</span>
                      <span className="text-xs font-semibold text-ink group-hover:text-ember transition-colors truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.labels?.slice(0, 3).map((lbl) => (
                        <span
                          key={lbl}
                          className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-line text-dim"
                        >
                          {lbl}
                        </span>
                      ))}
                      <span className="text-[10.5px] text-faint">by @{item.author}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-faint text-xs">
                    {item.comments > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare size={12} />
                        <span>{item.comments}</span>
                      </span>
                    )}
                    <ExternalLink size={13} className="opacity-60 group-hover:opacity-100" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-elevated/40 border border-line text-xs text-dim text-center space-y-1">
              <p>Ready to contribute? Click <strong>Open on GitHub</strong> above to browse the open tracker directly.</p>
              <p className="text-faint text-[11px]">Direct repository target: {repo}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

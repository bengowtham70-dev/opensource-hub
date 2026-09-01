import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tag, Sparkles, Download, ExternalLink, RefreshCw, Calendar, ArrowRight, Rss } from "lucide-react";
import { relativeDate } from "../lib/format";
import EmberProgress from "../components/EmberProgress";
import BrandLogo, { paidBrand } from "../components/BrandLogo";

export default function ReleasesFeedPage() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChangelogs, setExpandedChangelogs] = useState(new Set());
  const [copiedRss, setCopiedRss] = useState(false);

  useEffect(() => {
    fetch("/api/releases/feed")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.releases)) {
          setFeed(data.releases);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleChangelog = (repo) => {
    setExpandedChangelogs((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) next.delete(repo);
      else next.add(repo);
      return next;
    });
  };

  const copyRssUrl = async () => {
    try {
      const url = `${window.location.origin}/api/feed/releases.xml`;
      await navigator.clipboard.writeText(url);
      setCopiedRss(true);
      setTimeout(() => setCopiedRss(false), 2000);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-ember font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Real-time Software Updates</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            Live Software Releases Feed
          </h1>
          <p className="text-sm text-dim mt-1.5 max-w-2xl">
            Track daily updates, new features, and changelogs from top open-source projects replacing proprietary SaaS.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={copyRssUrl}
            className="btn-tactile px-3.5 py-2 rounded-lg border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Rss size={13} className="text-ember" />
            <span>{copiedRss ? "RSS Link Copied!" : "RSS Feed"}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-12 space-y-4 text-center">
          <EmberProgress />
          <p className="text-xs text-faint">Scanning latest GitHub releases across the ecosystem…</p>
        </div>
      )}

      {!loading && feed.length === 0 && (
        <div className="card-elevated p-8 text-center text-dim text-sm">
          No recent releases discovered yet. Check back soon!
        </div>
      )}

      {/* Timeline Feed */}
      <div className="space-y-4">
        {feed.map((rel, idx) => {
          const isExpanded = expandedChangelogs.has(rel.repo);
          return (
            <article
              key={`${rel.repo}-${rel.tag}`}
              className="card-elevated p-5 sm:p-6 bg-surface border border-line rounded-2xl hover:border-line-strong transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-elevated border border-line grid place-items-center shrink-0">
                    <BrandLogo repo={rel.repo} name={rel.name} size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/repo/${rel.repo}`}
                        className="font-display text-lg font-bold text-ink hover:text-ember transition-colors"
                      >
                        {rel.name}
                      </Link>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ember/10 border border-ember/20 text-ember font-mono text-xs font-semibold">
                        <Tag size={10} />
                        {rel.tag}
                      </span>
                      {rel.prerelease && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-caution/10 border border-caution/30 text-caution font-semibold">
                          Pre-release
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-faint">
                      Replaces <span className="text-dim font-medium">{rel.paidTool}</span> · {rel.category}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-faint inline-flex items-center gap-1">
                    <Calendar size={12} />
                    {relativeDate(rel.publishedAt)}
                  </span>
                </div>
              </div>

              {/* Release Title */}
              {rel.title && rel.title !== rel.tag && (
                <h3 className="font-semibold text-sm text-ink">{rel.title}</h3>
              )}

              {/* Changelog preview */}
              {rel.body && (
                <div className="space-y-2">
                  <div
                    className={`text-xs text-dim leading-relaxed font-sans prose-sm max-w-none ${
                      isExpanded ? "" : "line-clamp-3"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans text-xs bg-elevated/40 p-3 rounded-lg border border-line/50 text-dim">
                      {rel.body}
                    </pre>
                  </div>
                  {rel.body.length > 200 && (
                    <button
                      type="button"
                      onClick={() => toggleChangelog(rel.repo)}
                      className="text-xs font-semibold text-ember hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Collapse Release Notes ↑" : "Read Full Changelog ↓"}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/50">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/install/${rel.repo}`}
                    download
                    className="btn-tactile px-3 py-1.5 rounded-lg bg-ink text-white dark:bg-white dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={12} />
                    <span>Download Installer</span>
                  </a>
                  <a
                    href={rel.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-xs font-medium text-dim hover:text-ink inline-flex items-center gap-1"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink size={11} className="opacity-60" />
                  </a>
                </div>

                <Link
                  to={`/repo/${rel.repo}`}
                  className="text-xs font-semibold text-ember hover:underline inline-flex items-center gap-1"
                >
                  <span>Explore {rel.name}</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

import { Calendar, Clock, GitBranch, Heart, Layers, Scale, Server, Sparkles, Star, Tag, Package } from "lucide-react";
import { formatStars, relativeDate, formatCompact } from "../lib/format";

export default function QuickFactsCard({ repo, name, live, stars30, data, pairing, metrics }) {
  const owner = repo.split("/")[0];
  const a = pairing?.alternative;
  const starsCount = stars30?.stars ?? live?.stars ?? 0;
  const isSelfHosted = a?.platforms?.includes("self-host") ?? false;
  const licenseSpdx = live?.license?.spdx || a?.license?.spdx || "Open Source";
  const versionTag = data?.latestRelease?.tag || "Latest";
  const repoAge = data?.repoAgeYears != null ? `${data.repoAgeYears} years` : null;

  return (
    <aside aria-label={`Quick facts for ${name}`} className="space-y-4">
      <div className="card-elevated p-5 space-y-4 group relative overflow-hidden">
        {/* Smooth Background Raccoon Mascot Watermark */}
        <div
          className="pointer-events-none absolute -bottom-8 -right-8 w-44 h-44 sm:w-48 sm:h-48 opacity-0 group-hover:opacity-15 group-active:opacity-30 transition-all duration-500 ease-out transform translate-y-4 group-hover:translate-y-0 select-none z-0"
          aria-hidden="true"
        >
          <img
            src="/mascot-transparent.png"
            alt=""
            className="w-full h-full object-contain filter grayscale dark:invert contrast-125 pointer-events-none"
          />
        </div>

        {/* Header Summary */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <h3 className="font-semibold text-sm text-ink">Project Specifications</h3>
          <div className="flex items-center gap-1 text-xs font-semibold text-trust bg-trust/10 px-2 py-0.5 rounded-full border border-trust/20">
            <span>Production Ready</span>
          </div>
        </div>

        {/* Spec Rows */}
        <div className="space-y-2.5 text-xs relative z-10">
          {live?.pushedAt && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-dim">
                <Clock size={13} className="text-faint" /> Last commit
              </span>
              <span className="font-medium text-ink tnum" title={live.pushedAt}>
                {relativeDate(live.pushedAt)}
              </span>
            </div>
          )}

          {repoAge && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-dim">
                <Calendar size={13} className="text-faint" /> Repository age
              </span>
              <span className="font-medium text-ink tnum">{repoAge}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-dim">
              <Tag size={13} className="text-faint" /> Version
            </span>
            <span className="font-medium text-ink tnum">{versionTag}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-dim">
              <Server size={13} className="text-faint" /> Self-hosted
            </span>
            <span className={`font-medium ${isSelfHosted ? "text-trust" : "text-dim"}`}>
              {isSelfHosted ? "Yes (Docker / Native)" : "Desktop / CLI"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-dim">
              <GitBranch size={13} className="text-faint" /> Repository
            </span>
            <a
              href={`https://github.com/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ember hover:underline truncate max-w-[160px]"
              title={repo}
            >
              {repo}
            </a>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-dim">
              <Scale size={13} className="text-faint" /> License
            </span>
            <span className="font-medium text-ink truncate max-w-[140px]" title={licenseSpdx}>
              {licenseSpdx}
            </span>
          </div>

          {metrics?.metrics?.npm != null && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-dim">
                <Package size={13} className="text-faint" /> npm downloads
              </span>
              <span className="font-medium text-ink tnum">{formatCompact(metrics.metrics.npm)}/mo</span>
            </div>
          )}

          {metrics?.metrics?.pypi != null && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-dim">
                <Package size={13} className="text-faint" /> PyPI installs
              </span>
              <span className="font-medium text-ink tnum">{formatCompact(metrics.metrics.pypi)}/mo</span>
            </div>
          )}

          {metrics?.metrics?.docker != null && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-dim">
                <Server size={13} className="text-faint" /> Docker pulls
              </span>
              <span className="font-medium text-ink tnum">{formatCompact(metrics.metrics.docker)}</span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="border-t border-line/60 pt-3 space-y-2 relative z-10">
          <a
            href={`/api/install/${repo}`}
            download
            className="btn-tactile w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-ink text-surface text-xs font-semibold hover:opacity-90 transition-opacity"
            title="Automatically download packaged installer"
          >
            <span>Download for Your OS</span>
          </a>

          <a
            href={`https://github.com/sponsors/${owner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-line hover:border-line-strong bg-surface hover:bg-elevated text-xs font-medium text-dim hover:text-ink transition-colors"
          >
            <Heart size={14} className="text-[#ea4aaa]" />
            <span>Sponsor {name} on GitHub</span>
          </a>
        </div>
      </div>
    </aside>
  );
}

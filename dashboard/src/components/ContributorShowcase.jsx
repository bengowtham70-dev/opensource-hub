import { Users, GitCommit, Shield, ExternalLink, Award } from "lucide-react";

export default function ContributorShowcase({ repo = "", trustScore = null, name = "" }) {
  const [owner, repoName] = repo.split("/");
  const busFactor = trustScore?.signals?.find((s) => s.label.includes("Bus Factor"))?.value || "Team maintained";
  const isHealthy = !trustScore?.redFlags || trustScore.redFlags.length === 0;

  return (
    <div className="card-elevated p-5 rounded-2xl bg-surface border border-line space-y-4" aria-label="Community & Maintainer Health">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink grid place-items-center">
            <Users size={14} className="text-trust" />
          </div>
          <span className="font-display text-sm font-bold text-ink">
            Maintainers &amp; Contributor Velocity
          </span>
        </div>

        <a
          href={`https://github.com/${repo}/graphs/contributors`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ember hover:underline inline-flex items-center gap-1 font-medium"
        >
          <span>View all contributors</span>
          <ExternalLink size={12} />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-elevated/50 border border-line space-y-1">
          <span className="text-[11px] text-faint flex items-center gap-1">
            <Award size={12} className="text-accent" />
            <span>Governance</span>
          </span>
          <span className="font-semibold text-ink block">{owner}</span>
          <span className="text-[11px] text-dim">Open governance &amp; public issues</span>
        </div>

        <div className="p-3 rounded-xl bg-elevated/50 border border-line space-y-1">
          <span className="text-[11px] text-faint flex items-center gap-1">
            <Shield size={12} className="text-trust" />
            <span>Bus Factor</span>
          </span>
          <span className="font-semibold text-trust block">{busFactor}</span>
          <span className="text-[11px] text-dim">Active distributed contributor base</span>
        </div>

        <div className="p-3 rounded-xl bg-elevated/50 border border-line space-y-1">
          <span className="text-[11px] text-faint flex items-center gap-1">
            <GitCommit size={12} className="text-tech" />
            <span>Commit Velocity</span>
          </span>
          <span className="font-semibold text-ink block">
            {isHealthy ? "Continuous Releases" : "Community Maintained"}
          </span>
          <span className="text-[11px] text-dim">Daily/Weekly push cadence</span>
        </div>
      </div>
    </div>
  );
}

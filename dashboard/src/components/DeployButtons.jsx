import { Rocket, ExternalLink } from "lucide-react";
import { deriveSelfHost, deployTargets } from "../../../src/server/deploy.js";

export default function DeployButtons({ repo, alternative = {} }) {
  const badge = deriveSelfHost(alternative);
  const targets = deployTargets(alternative);

  if (!badge && targets.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {badge && (
        <span
          title={badge.note}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] font-medium ${badge.tone}`}
        >
          {badge.label}
        </span>
      )}
      {targets.map((t) => (
        <a
          key={t.name}
          href={t.url(repo)}
          target="_blank"
          rel="noreferrer"
          title={`One-click deploy ${repo.split("/")[1]} on ${t.name}`}
          className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line text-dim hover:text-ink hover:border-primary/40 text-[12px]"
        >
          <Rocket size={12} className="text-primary" /> Deploy on {t.name}
          <ExternalLink size={11} className="opacity-50" />
        </a>
      ))}
    </div>
  );
}

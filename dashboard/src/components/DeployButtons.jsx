import { Rocket, ExternalLink, Cloud, Server, Sparkles } from "lucide-react";
import { deriveSelfHost, deployTargets } from "../../../src/server/deploy.js";

export default function DeployButtons({ repo, alternative = {} }) {
  const badge = deriveSelfHost(alternative);
  const baseTargets = deployTargets(alternative);

  // Expanded multi-cloud deploy options for homelabbers and developers
  const cloudTargets = [...baseTargets];
  if (alternative.ecosystems?.docker || alternative.dockerImage) {
    if (!cloudTargets.some((t) => t.name === "Coolify")) {
      cloudTargets.push({
        name: "Coolify",
        icon: Server,
        url: (r) => `https://coolify.io/docs/knowledge-base/docker/compose`,
      });
    }
    if (!cloudTargets.some((t) => t.name === "Fly.io")) {
      cloudTargets.push({
        name: "Fly.io",
        icon: Cloud,
        url: (r) => `https://fly.io/launch?repo=${encodeURIComponent(`https://github.com/${r}`)}`,
      });
    }
  }

  if (!badge && cloudTargets.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {badge && (
        <span
          title={badge.note}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-medium ${badge.tone}`}
        >
          {badge.label}
        </span>
      )}
      {cloudTargets.map((t) => {
        const Icon = t.icon || Rocket;
        const directUrl = t.url(repo);
        const trackerUrl = `/api/go/${t.name.toLowerCase()}?repo=${encodeURIComponent(repo)}&type=deploy&url=${encodeURIComponent(directUrl)}`;
        return (
          <a
            key={t.name}
            href={trackerUrl}
            target="_blank"
            rel="noreferrer"
            title={`One-click deploy ${repo ? repo.split("/")[1] : "app"} on ${t.name}`}
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-surface text-dim hover:text-ink hover:border-primary/40 text-[12px] font-medium transition-colors"
          >
            <Icon size={13} className="text-faint" />
            <span>Deploy on {t.name}</span>
            <ExternalLink size={11} className="opacity-50" />
          </a>
        );
      })}
    </div>
  );
}

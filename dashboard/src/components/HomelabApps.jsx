import { Server, ExternalLink, Cloud, Home, Zap, Database } from "lucide-react";

export default function HomelabApps({ repo = "", name = "" }) {
  const homelabTargets = [
    {
      platform: "Umbrel App Store",
      icon: Cloud,
      url: "https://umbrel.com",
      badge: "Community Store",
    },
    {
      platform: "CasaOS 1-Click",
      icon: Home,
      url: "https://casaos.io",
      badge: "App Store Compatible",
    },
    {
      platform: "Unraid Community Apps",
      icon: Zap,
      url: "https://unraid.net/community/apps",
      badge: "Docker XML",
    },
    {
      platform: "TrueNAS SCALE",
      icon: Database,
      url: "https://www.truenas.com/truenas-scale/",
      badge: "TrueCharts",
    },
  ];

  return (
    <div className="card-elevated p-6 bg-surface border border-line rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-ink" />
          <h3 className="font-display text-lg font-bold text-ink">
            Homelab &amp; Self-Host OS Support
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-dim bg-elevated px-2.5 py-0.5 rounded-full border border-line">
          Docker Verified
        </span>
      </div>

      <p className="text-xs text-dim leading-relaxed">
        Deploy <strong>{name}</strong> directly onto your homelab server or NAS operating system:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {homelabTargets.map((t) => {
          const IconComp = t.icon;
          return (
            <a
              key={t.platform}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl border border-line bg-elevated hover:border-line-strong hover:bg-surface transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-surface border border-line grid place-items-center shrink-0">
                  <IconComp size={16} className="text-ink" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-ink block group-hover:text-accent transition-colors">
                    {t.platform}
                  </span>
                  <span className="text-[10px] text-faint block">{t.badge}</span>
                </div>
              </div>
              <ExternalLink size={13} className="text-faint opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

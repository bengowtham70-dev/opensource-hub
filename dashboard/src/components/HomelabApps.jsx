import { Server, ExternalLink, HardDrive, Cpu, Terminal } from "lucide-react";

export default function HomelabApps({ repo = "", name = "" }) {
  const shortName = repo.split("/")[1] || name.toLowerCase().replace(/[^a-z0-9]/g, "");

  const homelabTargets = [
    {
      platform: "Umbrel App Store",
      icon: "☂️",
      url: `https://umbrel.com`,
      badge: "Community Store",
    },
    {
      platform: "CasaOS 1-Click",
      icon: "🏠",
      url: `https://casaos.io`,
      badge: "App Store Compatible",
    },
    {
      platform: "Unraid Community Apps",
      icon: "⚡",
      url: `https://unraid.net/community/apps`,
      badge: "Docker XML",
    },
    {
      platform: "TrueNAS SCALE",
      icon: "🐬",
      url: `https://www.truenas.com/truenas-scale/`,
      badge: "TrueCharts",
    },
  ];

  return (
    <div className="card-elevated p-6 bg-surface border border-line rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-ember" />
          <h3 className="font-display text-lg font-bold text-ink">
            Homelab &amp; Self-Host OS Support
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-trust bg-trust/10 px-2 py-0.5 rounded-full border border-trust/20">
          Docker Verified
        </span>
      </div>

      <p className="text-xs text-dim leading-relaxed">
        Deploy <strong>{name}</strong> directly onto your homelab server or NAS operating system:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {homelabTargets.map((t) => (
          <a
            key={t.platform}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl border border-line bg-elevated hover:border-line-strong hover:bg-surface transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{t.icon}</span>
              <div>
                <span className="font-semibold text-xs text-ink block group-hover:text-ember transition-colors">
                  {t.platform}
                </span>
                <span className="text-[10px] text-faint block">{t.badge}</span>
              </div>
            </div>
            <ExternalLink size={13} className="text-faint opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
}

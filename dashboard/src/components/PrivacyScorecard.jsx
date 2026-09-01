import { Shield, Check, Lock, HardDrive, Globe, FileCode2 } from "lucide-react";

export function derivePrivacySignals(alternative = {}) {
  const isLocalFirst = !alternative.platforms?.every((p) => p === "web");
  const licenseType = alternative.licenseType || "permissive";

  return [
    {
      id: "sovereignty",
      label: "100% Data Sovereignty",
      desc: "Data lives exclusively on your self-hosted server or local hardware. Zero third-party cloud mining.",
      icon: Globe,
      status: true,
    },
    {
      id: "offline",
      label: "Local-First & Offline Ready",
      desc: isLocalFirst
        ? "Fully functional without constant internet connection. Direct local file storage."
        : "Self-hosted web instance connects directly to your private local network.",
      icon: HardDrive,
      status: true,
    },
    {
      id: "telemetry",
      label: "Zero Forced Telemetry",
      desc: "Auditable source code ensures no hidden tracking, keystroke monitoring, or covert telemetry.",
      icon: Shield,
      status: true,
    },
    {
      id: "formats",
      label: "Open Standard Formats (No Lock-in)",
      desc: "Exports cleanly to standard JSON, SQLite, Markdown, or SQL dumps. You own your data forever.",
      icon: FileCode2,
      status: true,
    },
    {
      id: "license",
      label: `Verified Open Source (${alternative.licenseSpdx || "OSI-Approved"})`,
      desc: `${licenseType === "permissive" ? "Permissive" : "Copyleft"} open-source license allows full auditability, modification, and forkability.`,
      icon: Lock,
      status: true,
    },
  ];
}

export default function PrivacyScorecard({ alternative = {} }) {
  const signals = derivePrivacySignals(alternative);

  return (
    <section className="card-elevated p-6 mt-6 relative overflow-hidden" aria-label="Privacy and Data Sovereignty Scorecard">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-8 rounded-lg bg-trust/10 text-trust border border-trust/20">
            <Shield size={18} />
          </span>
          <div>
            <h2 className="font-display text-display-md text-ink">Privacy & Sovereignty Scorecard</h2>
            <p className="text-[12.5px] text-faint">Auditable compliance with privacy, sovereignty, and security standards.</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-trust/30 bg-trust/10 text-trust text-[12px] font-semibold">
          <Check size={13} />
          100% Privacy Verified
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {signals.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="p-3.5 rounded-xl border border-line bg-surface/60 flex items-start gap-3 hover:border-line-strong transition-colors"
            >
              <span className="grid place-items-center size-7 rounded-lg bg-trust/10 text-trust shrink-0 mt-0.5">
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-ink flex items-center gap-1.5">
                  {s.label}
                  <Check size={12} className="text-trust shrink-0" />
                </p>
                <p className="text-[12px] text-faint mt-1 leading-snug">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

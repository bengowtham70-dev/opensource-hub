import { ArrowRightLeft, FileUp, Download, CheckCircle2, ArrowRight } from "lucide-react";

export function deriveMigrationSteps(paidTool = {}, alternative = {}) {
  const paidName = paidTool.name || "Proprietary SaaS";
  const altName = alternative.name || "Open Source Alternative";

  return [
    {
      step: 1,
      title: `Export data from ${paidName}`,
      desc: `Open your ${paidName} workspace settings, select "Export Workspace", and choose JSON, CSV, or Markdown format.`,
      icon: Download,
    },
    {
      step: 2,
      title: "Review & verify schema",
      desc: `Ensure your attachments, media assets, and relational records are included in the downloaded archive.`,
      icon: FileUp,
    },
    {
      step: 3,
      title: `Import directly into ${altName}`,
      desc: `Launch ${altName}, navigate to Settings → Data Import, and drag-and-drop your exported archive for 100% loss-free import.`,
      icon: CheckCircle2,
    },
  ];
}

export default function MigrationGuide({ paidTool = {}, alternative = {} }) {
  const steps = deriveMigrationSteps(paidTool, alternative);
  const paidName = paidTool.name || "SaaS";
  const altName = alternative.name || "Open Source";

  return (
    <section className="card-elevated p-6 mt-6 relative overflow-hidden" aria-label="Step-by-Step Data Migration Guide">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-8 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <ArrowRightLeft size={18} />
          </span>
          <div>
            <h2 className="font-display text-display-md text-ink">Migration Assistant: {paidName} → {altName}</h2>
            <p className="text-[12.5px] text-faint">Step-by-step guide to export your existing data with zero downtime.</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-elevated text-dim text-[12px] font-medium">
          Lossless Migration
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-3.5 mt-4">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="p-4 rounded-xl border border-line bg-surface/70 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="grid place-items-center size-7 rounded-full bg-primary/10 text-primary font-display font-bold text-xs">
                    {s.step}
                  </span>
                  <Icon size={16} className="text-faint" />
                </div>
                <h3 className="font-display text-sm font-semibold text-ink mb-1.5">{s.title}</h3>
                <p className="text-[12px] text-faint leading-relaxed">{s.desc}</p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  <ArrowRight size={14} className="text-faint" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

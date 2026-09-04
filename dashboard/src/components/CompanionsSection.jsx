import { Link, useInRouterContext } from "react-router-dom";
import { Puzzle, ArrowRight, GitCompare, Sparkles } from "lucide-react";
import { getCompanions } from "../lib/companions";

export default function CompanionsSection({ repo = "", currentName = "", className = "" }) {
  const companions = getCompanions(repo);
  const inRouter = useInRouterContext();

  if (!companions || companions.length === 0) return null;

  return (
    <section
      className={`card-elevated p-6 mt-6 relative overflow-hidden ${className}`}
      aria-label="Ecosystem Companions & Synergies"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-8 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink">
            <Puzzle size={16} className="text-accent" />
          </span>
          <div>
            <h2 className="font-display text-display-md text-ink">
              Ecosystem Companions: Works Well Alongside
            </h2>
            <p className="text-[12.5px] text-faint">
              Curated open-source software that integrates naturally with {currentName || repo}.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-elevated text-dim text-xs font-semibold">
          <Sparkles size={12} className="text-ember" />
          <span>{companions.length} Synergistic Pairings</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
        {companions.map((comp) => {
          const [owner, name] = comp.repo.split("/");
          const detailUrl = `/repo/${owner}/${name}`;
          const compareUrl = `/compare/${encodeURIComponent(repo)}/vs/${encodeURIComponent(comp.repo)}`;

          const renderDetailLink = () => {
            const classes =
              "btn-tactile px-3.5 py-1.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer";
            if (inRouter) {
              return (
                <Link to={detailUrl} className={classes}>
                  <span>View {comp.name}</span>
                  <ArrowRight size={13} />
                </Link>
              );
            }
            return (
              <a href={detailUrl} className={classes}>
                <span>View {comp.name}</span>
                <ArrowRight size={13} />
              </a>
            );
          };

          return (
            <article
              key={comp.repo}
              className="p-4 rounded-xl border border-line bg-surface/70 flex flex-col justify-between hover:border-line-strong transition-all space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-display text-sm font-bold text-ink truncate">
                    {comp.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-elevated border border-line text-dim">
                    {comp.category}
                  </span>
                </div>
                <p className="text-xs text-dim leading-relaxed">{comp.reason}</p>
              </div>

              <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-faint truncate max-w-[160px]">
                  {comp.repo}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {renderDetailLink()}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

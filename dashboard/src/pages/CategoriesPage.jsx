import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";
import { getPairings } from "../lib/seed";
import { allGroups } from "../lib/categories";
import RepoCard from "../components/RepoCard";
import Breadcrumbs from "../components/Breadcrumbs";

// Parity P4 (plans/PLAN_PARITY.md) — hierarchical category browser.
// Groups → categories → inline tool cards (client-side, zero backend).
export default function CategoriesPage() {
  const [pairings, setPairings] = useState(null);
  const [open, setOpen] = useState(null); // "groupSlug::category"

  useEffect(() => {
    getPairings().then(setPairings).catch(() => setPairings([]));
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const p of pairings || []) {
      const c = p.paidTool.category;
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }
    return map;
  }, [pairings]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-10">
      <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Categories" }]} />
      <header className="mb-8">
        <h1 className="font-display text-display-lg flex items-center gap-3">
          <Layers className="text-trust" size={30} /> Categories
        </h1>
        <p className="text-dim mt-2 max-w-[60ch]">
          Every paid-tool category grouped the way you'd actually shop for software. Open one to
          see its free alternatives.
        </p>
      </header>

      {!pairings && (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {pairings && (
        <div className="space-y-8">
          {allGroups().map((group) => (
            <section key={group.slug} aria-label={group.label}>
              <h2 className="font-display text-display-md text-ink mb-1">{group.label}</h2>
              <p className="text-sm text-dim mb-3 max-w-[65ch]">{group.description}</p>
              <div className="flex flex-wrap gap-2">
                {group.categories.map((cat) => {
                  const tools = byCategory.get(cat) || [];
                  if (tools.length === 0) return null;
                  const key = `${group.slug}::${cat}`;
                  const isOpen = open === key;
                  return (
                    <div key={key} className="w-full">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? null : key)}
                        className="btn-tactile w-full flex items-center justify-between gap-3 px-4 py-3 border border-line bg-surface hover:bg-elevated hover:border-line-strong text-left transition-all shadow-2xs group cursor-pointer"
                        style={{ borderRadius: "var(--radius-card, 12px)" }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="size-2 rounded-full bg-trust/70 group-hover:bg-trust transition-colors" />
                          <span className="text-sm font-medium text-ink group-hover:text-ember transition-colors">{cat}</span>
                        </div>
                        <span
                          className="tnum text-xs px-2.5 py-1 bg-elevated border border-line text-dim font-medium transition-colors"
                          style={{ borderRadius: "var(--radius-control, 6px)" }}
                        >
                          {tools.length} {tools.length === 1 ? "swap" : "swaps"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="mt-3 mb-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-card-in">
                          {tools.map((p, i) => (
                            <RepoCard key={p.alternative.repo} pairing={p} stars30d={null} index={i} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

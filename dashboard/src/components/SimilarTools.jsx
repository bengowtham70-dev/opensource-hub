import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { getPairings } from "../lib/seed";

// F12 — "More in this category" on the detail page.
// getPairings() is promise-shaped (async seed mirror) — resolve it in an effect,
// never .filter() the promise itself (that crashed every detail page).
export default function SimilarTools({ category, currentRepo }) {
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    let alive = true;
    Promise.resolve(getPairings())
      .then((pairings) => {
        if (!alive || !Array.isArray(pairings)) return;
        setSimilar(
          pairings
            .filter(
              (p) =>
                p.paidTool.category === category &&
                p.alternative.repo.toLowerCase() !== String(currentRepo || "").toLowerCase()
            )
            .slice(0, 4)
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [category, currentRepo]);

  if (similar.length === 0) return null;

  return (
    <section className="mt-6 card-glass p-6" aria-label="Similar tools">
      <h2 className="font-display text-display-md mb-4 flex items-center gap-2.5">
        <Layers size={19} className="text-primary" /> More {category} alternatives
      </h2>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {similar.map((p, i) => (
          <Link
            key={p.alternative.repo}
            to={`/repo/${p.alternative.repo}`}
            className="btn-tactile p-3.5 rounded-xl border border-line bg-primary/5 hover:border-primary/35 group animate-card-in"
            style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-medium text-[13.5px] text-ink group-hover:text-primary transition-colors truncate">
                {p.alternative.name}
              </span>
              <span className="tnum text-[11px] text-trust whitespace-nowrap">
                replaces {p.paidTool.name}
              </span>
            </span>
            <span className="block text-[12px] text-faint mt-0.5 truncate">{p.alternative.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

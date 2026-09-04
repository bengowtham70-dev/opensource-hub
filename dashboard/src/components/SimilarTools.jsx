import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { getPairings } from "../lib/seed";
import { api } from "../lib/api";

// F12 — "More in this category" on the detail page.
// getPairings() is promise-shaped (async seed mirror) — resolve it in an effect.
// When uncataloged or dynamic category has 0 pairings, fallback to api.catalog.
export default function SimilarTools({ category, currentRepo }) {
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    let alive = true;
    Promise.resolve(getPairings())
      .then((pairings) => {
        if (!alive || !Array.isArray(pairings)) return;
        const matches = pairings
          .filter(
            (p) =>
              p.paidTool?.category?.toLowerCase() === String(category || "").toLowerCase() &&
              p.alternative?.repo?.toLowerCase() !== String(currentRepo || "").toLowerCase()
          )
          .slice(0, 4);

        if (matches.length > 0) {
          setSimilar(matches);
        } else if (category) {
          api
            .catalog({ q: category, limit: 6 })
            .then((res) => {
              if (!alive || !res?.results) return;
              const fallback = res.results
                .filter(
                  (r) =>
                    r.alternative?.repo?.toLowerCase() !== String(currentRepo || "").toLowerCase()
                )
                .slice(0, 4);
              setSimilar(fallback);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [category, currentRepo]);

  if (similar.length === 0) return null;

  return (
    <section className="mt-6 card-elevated p-6" aria-label="Similar tools">
      <h2 className="font-display text-display-md mb-4 flex items-center gap-2.5">
        <Layers size={19} className="text-dim" /> More {category} alternatives
      </h2>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {similar.map((p, i) => (
          <Link
            key={p.alternative?.repo || i}
            to={`/repo/${p.alternative?.repo || ""}`}
            className="btn-tactile p-3.5 rounded-xl border border-line bg-primary/5 hover:border-primary/35 group animate-card-in"
            style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-medium text-[13.5px] text-ink group-hover:text-link transition-colors truncate">
                {p.alternative?.name}
              </span>
              <span className="tnum text-[11px] text-trust whitespace-nowrap">
                {p.paidTool && !p.paidTool.isCommunity && p.paidTool.name !== p.alternative?.name
                  ? `replaces ${p.paidTool.name}`
                  : "open source"}
              </span>
            </span>
            <span className="block text-[12px] text-faint mt-0.5 truncate">{p.alternative?.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

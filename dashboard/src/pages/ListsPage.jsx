import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ListChecks } from "lucide-react";
import { api } from "../lib/api";
import RepoCard from "../components/RepoCard";
import Byte from "../components/Byte";

// Public curated lists — PRD §2.10 / plans/PLAN_PHASE2.md Phase 7.
export function ListsIndexPage() {
  const [lists, setLists] = useState(null);

  useEffect(() => {
    api.lists().then(setLists).catch(() => setLists([]));
  }, []);

  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-display-lg flex items-center gap-3">
          <ListChecks className="text-trust" size={30} /> Curated lists
        </h1>
        <p className="text-dim mt-2 max-w-[60ch]">
          Hand-picked stacks with stated inclusion criteria — every pick explains why it earned its spot.
        </p>
      </header>

      {!lists && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {lists && lists.length === 0 && (
        <div className="card-glass p-10 text-center">
          <Byte size={64} />
          <p className="mt-4 text-dim">No lists published yet — check back after the next catalog sync.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {lists &&
          lists.map((l, i) => (
            <Link
              key={l.slug}
              to={`/lists/${l.slug}`}
              className="card-glass p-6 group animate-card-in flex flex-col gap-2"
              style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-display-md text-ink group-hover:text-primary transition-colors">
                  {l.title}
                </span>
                <span className="shrink-0 px-2.5 py-1 rounded-full border border-line text-faint tnum text-[12px]">
                  {l.repoCount} tools
                </span>
              </span>
              <span className="text-sm text-dim leading-relaxed">{l.description}</span>
              <span className="mt-auto pt-2 inline-flex items-center gap-1 text-sm text-faint group-hover:text-primary transition-colors">
                View list <ArrowRight size={14} />
              </span>
            </Link>
          ))}
      </div>
    </div>
  );
}

export function ListDetailPage() {
  const { slug } = useParams();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setList(null);
    setError(null);
    api.list(slug).then(setList).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (error)
    return (
      <div className="mx-auto max-w-[760px] px-4 py-16 text-center">
        <p className="text-caution tnum text-sm mb-4">⚠ {error}</p>
        <Link to="/lists" className="shimmer-button btn-tactile inline-flex px-4 py-2 text-sm text-ink">
          Back to lists
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10">
      <Link to="/lists" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile">
        <ArrowLeft size={15} /> All lists
      </Link>

      {!list ? (
        <div className="mt-6 space-y-3">
          <div className="skeleton h-10 w-2/3" />
          <div className="skeleton h-4 w-full max-w-[60ch]" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-56 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <header className="mt-4 animate-card-in opacity-0">
            <h1 className="font-display text-display-lg tracking-tight">{list.title}</h1>
            <p className="text-dim mt-2 max-w-[70ch] leading-relaxed">{list.description}</p>
          </header>

          {/* Stated inclusion criteria — PRD §2.10 honesty rule */}
          <blockquote className="mt-5 p-4 rounded-xl border-l-2 border-trust/50 bg-trust/5 text-sm text-dim leading-relaxed animate-card-in opacity-0">
            <span className="text-trust font-semibold tnum text-[12px] uppercase tracking-wider block mb-1">
              Inclusion criteria
            </span>
            {list.criteria}
          </blockquote>

          {list.pairings.length === 0 ? (
            <div className="card-glass p-10 mt-8 text-center">
              <Byte size={72} />
              <p className="mt-4 text-dim max-w-[45ch] mx-auto">
                Nothing in the catalog matches this list yet — the daily sync may still be catching up.
              </p>
              <Link to="/" className="shimmer-button btn-tactile mt-5 inline-flex px-4 py-2 text-sm text-ink">
                Browse trending instead
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
              {list.pairings.map((p, i) => (
                <RepoCard
                  key={p.alternative.repo}
                  pairing={p}
                  stars30d={p.stars30d}
                  freshness={p.freshness ?? null}
                  maintenance={p.maintenance ?? null}
                  downloads={p.downloads ?? null}
                  index={i}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
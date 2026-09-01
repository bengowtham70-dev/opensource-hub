import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowRight, Download, Upload } from "lucide-react";
import { useFavorites } from "../stores/favorites";
import { getPairings, getPairingMap } from "../lib/seed";
import { api } from "../lib/api";
import { EmptyState } from "../components/states";
import { formatSavings } from "../lib/format";

export default function FavoritesPage() {
  const fav = useFavorites();
  const pairings = usePairings();
  const fileRef = useRef(null);
  const [importMsg, setImportMsg] = useState(null);

  useEffect(() => {
    fav.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // F11 — import side of the export loop (PRD §12 data portability).
  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const json = await api.import(data);
      await fav.load();
      setImportMsg(`Imported ${json.importedFavorites} favorites · ${json.community.votes} voted tools · ${json.community.tags} tagged.`);
    } catch (err) {
      setImportMsg(`Import failed: ${err.message}`);
    } finally {
      e.target.value = "";
    }
  };

  const cards = useMemo(
    () =>
      fav.items
        .map((f) => {
          const pairing = pairings.get(f.repo.toLowerCase());
          return pairing ? { pairing, key: f.repo, addedAt: f.addedAt } : null;
        })
        .filter(Boolean),
    [fav.items, pairings]
  );

  const totalSaved = cards.reduce((sum, c) => sum + c.pairing.paidTool.pricePerYearUsd, 0);

  if (fav.loaded && cards.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10">
        <EmptyState
          title="No favorites yet"
          body="Tap the heart on any tool card and it will wait for you here — stored on your machine only, no account needed."
          action={
            <Link to="/" className="shimmer-button btn-tactile px-4 py-2 text-sm text-ink">
              Find your first alternative
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-display-lg">Your favorites</h1>
          <p className="text-sm text-faint mt-1">Saved locally on this machine · most recent first</p>
        </div>
        {totalSaved > 0 && (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-trust/10 border border-trust/30 text-trust font-semibold animate-card-in">
            <Heart size={15} fill="currentColor" />
            Saving {formatSavings(totalSaved)}/yr in total
          </span>
        )}
        {/* PRD §17 — export everything the user created locally (F1). */}
        <a
          href="/api/export"
          download="opensource-hub-export.json"
          className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line text-dim hover:text-ink hover:border-line-strong text-sm"
          title="Download favorites, votes and tags as JSON"
        >
          <Download size={15} /> Export my data
        </a>
        {/* F11 — import it back on a new machine (PRD §12). */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line text-dim hover:text-ink hover:border-line-strong text-sm"
        >
          <Upload size={15} /> Import
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
      </header>
      {importMsg && (
        <p className={`mb-4 text-[13px] tnum ${importMsg.toLowerCase().includes("failed") ? "text-caution" : "text-trust"}`} role="status">
          {importMsg}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {cards.map(({ pairing }, i) => (
          <div key={pairing.alternative.repo} className="animate-card-in" style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}>
            <FavoriteCard pairing={pairing} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FavoriteCard({ pairing }) {
  // Favorites view reuses the trending card minus sparkline (no snapshot fetch per favorite).
  const a = pairing.alternative;
  return (
    <article className="card-elevated p-5 flex flex-col gap-3 h-full">
      <header className="flex items-start justify-between gap-2">
        <Link to={`/repo/${a.repo}`} className="font-display text-xl text-ink tracking-tight hover:text-link transition-colors">
          {a.name}
        </Link>
        <FavoriteToggle repo={a.repo} name={a.name} />
      </header>
      <p className="text-sm text-dim leading-relaxed line-clamp-2">{a.description}</p>
      <footer className="mt-auto pt-1 flex items-center justify-between border-t border-line">
        <span className="tnum text-[12px] text-tech">{a.language}</span>
        <Link
          to={`/repo/${a.repo}`}
          className="btn-tactile inline-flex items-center gap-1 text-[12px] text-link hover:text-ink"
        >
          Open <ArrowRight size={13} />
        </Link>
      </footer>
    </article>
  );
}

function FavoriteToggle({ repo, name }) {
  const fav = useFavorites();
  const isFav = fav.has(repo);
  return (
    <button
      type="button"
      aria-label={`Remove ${name} from favorites`}
      aria-pressed={isFav}
      onClick={() => fav.toggle(repo)}
      className="btn-tactile grid place-items-center size-9 rounded-full bg-trust/15 border border-trust/40 text-trust"
    >
      <Heart size={16} fill="currentColor" />
    </button>
  );
}

function usePairings() {
  const [map, setMap] = useState(new Map());
  useEffect(() => {
    getPairings().then(() => setMap(getPairingMap()));
  }, []);
  return map;
}
